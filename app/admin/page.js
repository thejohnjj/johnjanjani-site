import { sortByCode } from '@/lib/listings';
import { isAdmin } from '@/lib/session';
import { db } from '@/lib/supabase';
import { LoginForm, LogoutButton, ReviewsAdmin } from './AdminClient';

export const dynamic = 'force-dynamic';

const when = (d) => new Date(d).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Toronto' });

export default async function Admin() {
  if (!isAdmin()) return <LoginForm />;
  const client = db();
  if (!client) {
    return <main className="wrap legal"><h1>Setup needed</h1><p>Add the Supabase keys in Vercel → Settings → Environment Variables, then redeploy.</p></main>;
  }

  const [members, listings, showings, views, leads, reviews] = await Promise.all([
    client.from('members').select('id, name, email, phone, lang, first_listing, created_at, last_seen_at').order('created_at', { ascending: false }).limit(500),
    client.from('listings').select('*').order('sort_order').order('created_at', { ascending: false }),
    client.from('showing_requests').select('id, created_at, members(name, phone, email), listings(address, mls_number)').order('created_at', { ascending: false }).limit(100),
    client.from('listing_views').select('member_id'),
    client.from('leads').select('*').order('created_at', { ascending: false }).limit(500),
    client.from('reviews').select('*').order('sort_order').order('created_at', { ascending: false }),
  ]);
  const setupNeeded = Boolean(leads.error || reviews.error);
  const valuations = (leads.data || []).filter((l) => l.kind === 'valuation');
  const guides = (leads.data || []).filter((l) => l.kind === 'guide');
  const TL = { '0-3': 'Within 3 months', '3-6': '3–6 months', '6-12': '6–12 months', curious: 'Just curious' };
  const viewCount = {};
  for (const v of views.data || []) viewCount[v.member_id] = (viewCount[v.member_id] || 0) + 1;

  return (
    <>
      <header className="top">
        <div className="wrap">
          <a className="brand" href="/admin"><b style={{ display: 'inline' }}>ADMIN</b></a>
          <a className="lang" href="/en" target="_blank" rel="noopener">View site</a>
          <LogoutButton />
        </div>
      </header>
      <main className="wrap" style={{ paddingBlock: '32px 72px', display: 'grid', gap: 40 }}>
        <section>
          <div className="sec-head">
            <div><div className="eyebrow">Listings</div><h2>{listings.data?.length || 0} listings</h2></div>
            <a className="btn btn-accent" href="/admin/listing/new">Add a listing</a>
          </div>
          <div className="tablebox">
            <table>
              <thead><tr><th>Photo</th><th>Code</th><th>Listing</th><th>MLS®</th><th>Price</th><th>Shown</th><th></th></tr></thead>
              <tbody>
                {sortByCode(listings.data || []).map((l) => (
                  <tr key={l.id}>
                    <td>{l.photos?.[0] ? <img src={l.photos[0]} alt="" width="72" height="54" style={{ objectFit: 'cover', borderRadius: 8 }} /> : '—'}</td>
                    <td><b>{l.code || '—'}</b></td>
                    <td>{l.type_en} · {l.city_en}<br /><small>{l.status === 'rent' ? 'For rent' : 'For sale'}</small></td>
                    <td>{l.mls_number || '—'}</td>
                    <td>${Number(l.price).toLocaleString('en-US')}{l.status === 'rent' ? '/mo' : ''}</td>
                    <td>{l.active ? 'Yes' : 'Hidden'}</td>
                    <td><a href={`/admin/listing/${l.id}`}>Edit</a></td>
                  </tr>
                ))}
                {!listings.data?.length && <tr><td colSpan="7">No listings yet. Press “Add a listing”.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        {setupNeeded && (
          <p className="banner" style={{ margin: 0 }}>
            One step left: run the new SQL from supabase/schema.sql (the “leads” and “reviews” tables) in Supabase → SQL Editor, then refresh this page.
          </p>
        )}

        <section>
          <div className="sec-head"><div><div className="eyebrow">Home value requests</div><h2>{valuations.length} requests</h2></div></div>
          <div className="tablebox">
            <table>
              <thead><tr><th>When</th><th>Name</th><th>Phone</th><th>Email</th><th>Property</th><th>Selling</th><th>Note</th></tr></thead>
              <tbody>
                {valuations.map((v) => (
                  <tr key={v.id}>
                    <td>{when(v.created_at)}</td>
                    <td>{v.name}<br /><small>{v.lang === 'fa' ? 'Farsi' : 'English'}</small></td>
                    <td>{v.phone}</td>
                    <td>{v.email}</td>
                    <td>{v.details?.address}{v.details?.city ? `, ${v.details.city}` : ''}<br /><small>{v.details?.type} · {v.details?.beds || '—'} bd · {v.details?.baths || '—'} ba</small></td>
                    <td><b>{TL[v.details?.timeline] || '—'}</b></td>
                    <td>{v.details?.note || '—'}</td>
                  </tr>
                ))}
                {!valuations.length && <tr><td colSpan="7">No requests yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="sec-head"><div><div className="eyebrow">Showing requests</div><h2>{showings.data?.length || 0} requests</h2></div></div>
          <div className="tablebox">
            <table>
              <thead><tr><th>When</th><th>Name</th><th>Phone</th><th>Email</th><th>Listing</th></tr></thead>
              <tbody>
                {(showings.data || []).map((s) => (
                  <tr key={s.id}>
                    <td>{when(s.created_at)}</td>
                    <td>{s.members?.name}</td>
                    <td>{s.members?.phone}</td>
                    <td>{s.members?.email}</td>
                    <td>{s.listings?.address}{s.listings?.mls_number ? ` (${s.listings.mls_number})` : ''}</td>
                  </tr>
                ))}
                {!showings.data?.length && <tr><td colSpan="5">No requests yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="sec-head"><div><div className="eyebrow">Members (your leads)</div><h2>{members.data?.length || 0} members</h2></div></div>
          <div className="tablebox">
            <table>
              <thead><tr><th>Joined</th><th>Name</th><th>Phone</th><th>Email</th><th>Language</th><th>First listing viewed</th><th>Views</th><th>Last visit</th></tr></thead>
              <tbody>
                {(members.data || []).map((m) => (
                  <tr key={m.id}>
                    <td>{when(m.created_at)}</td>
                    <td>{m.name}</td>
                    <td>{m.phone}</td>
                    <td>{m.email}</td>
                    <td>{m.lang === 'fa' ? 'Farsi' : 'English'}</td>
                    <td>{m.first_listing || '—'}</td>
                    <td>{viewCount[m.id] || 0}</td>
                    <td>{when(m.last_seen_at)}</td>
                  </tr>
                ))}
                {!members.data?.length && <tr><td colSpan="8">No members yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
        <section>
          <div className="sec-head"><div><div className="eyebrow">Buyer guide downloads</div><h2>{guides.length} downloads</h2></div></div>
          <div className="tablebox">
            <table>
              <thead><tr><th>When</th><th>Name</th><th>Email</th><th>Phone</th><th>Language</th><th>Stage</th></tr></thead>
              <tbody>
                {guides.map((g) => (
                  <tr key={g.id}>
                    <td>{when(g.created_at)}</td>
                    <td>{g.name}</td>
                    <td>{g.email}</td>
                    <td>{g.phone || '—'}</td>
                    <td>{g.lang === 'fa' ? 'Farsi' : 'English'}</td>
                    <td>{g.details?.stage || '—'}</td>
                  </tr>
                ))}
                {!guides.length && <tr><td colSpan="6">No downloads yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="sec-head"><div><div className="eyebrow">Client reviews</div><h2>{reviews.data?.length || 0} reviews</h2></div></div>
          <p style={{ marginTop: 0, color: 'var(--muted)' }}>Reviews appear on the homepage. Only add real reviews from your clients, with their permission.</p>
          <ReviewsAdmin reviews={reviews.data || []} />
        </section>
      </main>
    </>
  );
}
