'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault();
    setError('');
    const password = new FormData(e.currentTarget).get('password');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) router.refresh();
    else setError('Wrong password.');
  }
  return (
    <form className="form" onSubmit={submit} style={{ maxWidth: 420, margin: '10vh auto' }}>
      <h3>Admin sign in</h3>
      <div className="field">
        <label htmlFor="pw">Password</label>
        <input id="pw" name="password" type="password" autoComplete="current-password" required />
      </div>
      <p className="err" role="alert">{error}</p>
      <button className="btn btn-ink" type="submit">Sign in</button>
    </form>
  );
}

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn btn-ghost"
      onClick={async () => {
        await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ logout: true }) });
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}

const EMPTY = {
  code: '', mls_number: '', status: 'sale', kind: 'house', city_en: '', city_fa: '', type_en: '', type_fa: '', price: '', address: '',
  beds: '', baths: '', parking: '', sqft: '', description_en: '', description_fa: '', features_en: '', features_fa: '',
  photos: [], listing_brokerage: '', tour_url: '', active: true, sort_order: 0,
  section: 'tour', pick_note_en: '', pick_note_fa: '', expires_at: '',
};

export function ListingEditor({ initial, defaultSection }) {
  const router = useRouter();
  const [v, setV] = useState(() =>
    initial
      ? {
          ...EMPTY,
          ...initial,
          section: initial.section || 'tour',
          expires_at: initial.expires_at ? String(initial.expires_at).slice(0, 10) : '',
          features_en: (initial.features_en || []).join('\n'),
          features_fa: (initial.features_fa || []).join('\n'),
        }
      : { ...EMPTY, section: defaultSection === 'pick' ? 'pick' : 'tour' }
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setV({ ...v, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function upload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const url = String(process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
    const anon = String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
    if (!url || !anon) return setMsg('Supabase keys are missing in Vercel settings.');
    const supa = createClient(url, anon);
    setBusy(true);
    const added = [];
    for (const [i, file] of files.entries()) {
      setMsg(`Uploading photo ${i + 1} of ${files.length}…`);
      const r = await fetch('/api/admin/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: file.type }),
      });
      if (!r.ok) {
        setMsg(`Skipped ${file.name}: use JPG, PNG or WebP.`);
        continue;
      }
      const { path, token, publicUrl } = await r.json();
      const { error } = await supa.storage.from('listing-photos').uploadToSignedUrl(path, token, file, { contentType: file.type });
      if (error) setMsg(`Upload failed for ${file.name}: ${error.message}`);
      else added.push(publicUrl);
    }
    setV((cur) => ({ ...cur, photos: [...cur.photos, ...added] }));
    setBusy(false);
    setMsg(added.length ? `${added.length} photo(s) added. Press Save to keep them.` : '');
    e.target.value = '';
  }

  async function importLinks() {
    const urls = String(v.photo_links || '').split(/\s+/).filter((u) => u.startsWith('https://'));
    if (!urls.length) return setMsg('Paste photo links first, one per line.');
    setBusy(true);
    setMsg(`Copying ${urls.length} photo(s)…`);
    const r = await fetch('/api/admin/import-photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls }),
    });
    const data = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg(data.error || 'Could not copy photos.');
    setV((cur) => ({ ...cur, photo_links: '', photos: [...cur.photos, ...data.photos] }));
    const failed = data.failed?.length ? ` ${data.failed.length} could not be copied.` : '';
    setMsg(`${data.photos.length} photo(s) added.${failed} Press Save to keep them.`);
  }

  function movePhoto(i, d) {
    const p = [...v.photos];
    const j = i + d;
    if (j < 0 || j >= p.length) return;
    [p[i], p[j]] = [p[j], p[i]];
    setV({ ...v, photos: p });
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setMsg('Saving…');
    const body = { ...v };
    // Before the Daily picks SQL is run, old listings have no section column: don't send it for them.
    if (initial && initial.section === undefined && v.section !== 'pick') delete body.section;
    const res = await fetch('/api/admin/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(data.error || 'Could not save.');
    setMsg('Saved.');
    router.push('/admin');
    router.refresh();
  }

  async function remove() {
    if (!initial?.id) return;
    if (v.confirmDelete !== true) return setV({ ...v, confirmDelete: true });
    const res = await fetch(`/api/admin/listings?id=${initial.id}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/admin');
      router.refresh();
    } else setMsg('Could not delete.');
  }

  const F = ({ id, label, ...rest }) => (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} value={v[id] ?? ''} onChange={set(id)} {...rest} />
    </div>
  );

  return (
    <form className="form" onSubmit={save} style={{ padding: 0 }}>
      <div className="admin-grid">
        <div className="field">
          <label htmlFor="section">Section</label>
          <select id="section" value={v.section} onChange={set('section')}>
            <option value="tour">Realtor’s Picks: a home I toured (with code)</option>
            <option value="pick">Daily pick: a listing I like</option>
          </select>
        </div>
        {v.section === 'pick'
          ? F({ id: 'expires_at', label: 'Hide after (leave empty on a new pick = 14 days)', type: 'date' })
          : F({ id: 'code', label: 'Code (same as your Instagram post, e.g. 12)', required: true })}
        {F({ id: 'mls_number', label: 'MLS® number' })}
        {F({ id: 'listing_brokerage', label: 'Listing brokerage (shown on the listing)', required: true, placeholder: 'e.g. HomeLife Landmark Realty Inc.' })}
        {F({ id: 'tour_url', label: 'Instagram home tour link (optional)', type: 'url', placeholder: 'https://www.instagram.com/reel/…' })}
        <div className="field">
          <label htmlFor="status">For sale or rent</label>
          <select id="status" value={v.status} onChange={set('status')}>
            <option value="sale">For sale</option>
            <option value="rent">For rent</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="kind">Property kind (for filters)</label>
          <select id="kind" value={v.kind} onChange={set('kind')}>
            <option value="house">House</option>
            <option value="townhouse">Townhouse</option>
            <option value="condo">Condo</option>
          </select>
        </div>
        {F({ id: 'price', label: v.status === 'rent' ? 'Rent per month ($)' : 'Price ($)', inputMode: 'numeric', required: true })}
        {F({ id: 'address', label: 'Full address (members only)', required: true })}
        {F({ id: 'type_en', label: 'Type in English (e.g. Detached house)', required: true })}
        <div className="field">
          <label htmlFor="type_fa">Type in Farsi</label>
          <input id="type_fa" dir="rtl" value={v.type_fa} onChange={set('type_fa')} />
        </div>
        {F({ id: 'city_en', label: 'City / area in English (e.g. North York)', required: true })}
        <div className="field">
          <label htmlFor="city_fa">City / area in Farsi</label>
          <input id="city_fa" dir="rtl" value={v.city_fa} onChange={set('city_fa')} />
        </div>
        {F({ id: 'beds', label: 'Bedrooms (e.g. 3 or 3+1 → 3)', inputMode: 'decimal' })}
        {F({ id: 'baths', label: 'Bathrooms', inputMode: 'decimal' })}
        {F({ id: 'parking', label: 'Parking spaces', inputMode: 'numeric' })}
        {F({ id: 'sqft', label: 'Size (sq ft, e.g. 1,100–1,199)' })}
        {F({ id: 'sort_order', label: 'Order on page (lower shows first)', inputMode: 'numeric' })}
      </div>
      {v.section === 'pick' && (
        <div className="admin-grid">
          <div className="field">
            <label htmlFor="pick_note_en">Why I picked it, in English (one short line)</label>
            <input id="pick_note_en" maxLength={300} value={v.pick_note_en} onChange={set('pick_note_en')} placeholder="e.g. Rare ravine lot under $1.5M" />
          </div>
          <div className="field">
            <label htmlFor="pick_note_fa">Why I picked it, in Farsi</label>
            <input id="pick_note_fa" dir="rtl" maxLength={300} value={v.pick_note_fa} onChange={set('pick_note_fa')} />
          </div>
        </div>
      )}
      <div className="field">
        <label htmlFor="description_en">Description in English</label>
        <textarea id="description_en" rows="5" value={v.description_en} onChange={set('description_en')} />
      </div>
      <div className="field">
        <label htmlFor="description_fa">Description in Farsi</label>
        <textarea id="description_fa" rows="5" dir="rtl" value={v.description_fa} onChange={set('description_fa')} />
      </div>
      <div className="admin-grid">
        <div className="field">
          <label htmlFor="features_en">Features in English (one per line)</label>
          <textarea id="features_en" rows="6" value={v.features_en} onChange={set('features_en')} />
        </div>
        <div className="field">
          <label htmlFor="features_fa">Features in Farsi (one per line)</label>
          <textarea id="features_fa" rows="6" dir="rtl" value={v.features_fa} onChange={set('features_fa')} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="photos">Photos (the first one is the cover)</label>
        <input id="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={upload} disabled={busy} />
      </div>
      <div className="field">
        <label htmlFor="photo_links">Or paste photo links (one per line)</label>
        <textarea id="photo_links" rows="3" value={v.photo_links || ''} onChange={set('photo_links')} placeholder="https://…jpg" />
        <button type="button" className="btn" style={{ border: '1px solid var(--line)', alignSelf: 'flex-start', marginTop: 8 }} onClick={importLinks} disabled={busy}>
          Copy photos from links
        </button>
      </div>
      {v.photos.length > 0 && (
        <div className="admin-photos">
          {v.photos.map((p, i) => (
            <div key={p}>
              <img src={p} alt={`Photo ${i + 1}`} />
              <div>
                <button type="button" onClick={() => movePhoto(i, -1)} aria-label="Move earlier">←</button>
                <button type="button" onClick={() => movePhoto(i, 1)} aria-label="Move later">→</button>
                <button type="button" onClick={() => setV({ ...v, photos: v.photos.filter((x) => x !== p) })} aria-label="Remove photo">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <label className="check" htmlFor="active">
        <input id="active" type="checkbox" checked={v.active} onChange={set('active')} />
        <span>Show this listing on the website</span>
      </label>
      <p className="err" role="status" style={{ color: 'var(--muted)' }}>{msg}</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button className="btn btn-accent" type="submit" disabled={busy}>Save listing</button>
        <a className="btn" href="/admin" style={{ border: '1px solid var(--line)' }}>Cancel</a>
        {initial?.id && (
          <button type="button" className="btn" onClick={remove} style={{ border: '1px solid var(--error)', color: 'var(--error)' }}>
            {v.confirmDelete ? 'Tap again to delete for good' : 'Delete listing'}
          </button>
        )}
      </div>
    </form>
  );
}

export function ReviewsAdmin({ reviews }) {
  const router = useRouter();
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function save(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = Object.fromEntries(new FormData(form));
    setBusy(true);
    setMsg('');
    const res = await fetch('/api/admin/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(data.error || 'Could not save.');
    form.reset();
    setMsg('Saved.');
    router.refresh();
  }

  async function toggle(r) {
    await fetch('/api/admin/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...r, active: !r.active }) });
    router.refresh();
  }

  async function remove(r) {
    if (!window.confirm(`Delete the review from ${r.name}?`)) return;
    await fetch(`/api/admin/reviews?id=${r.id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <form className="form" onSubmit={save} style={{ padding: 20, border: '1px solid var(--line)', borderRadius: 18, background: 'var(--surface)' }}>
        <div className="admin-grid">
          <div className="field"><label htmlFor="rvName">Client name (e.g. Sara M.)</label><input id="rvName" name="name" required /></div>
          <div className="field"><label htmlFor="rvSource">Where it’s from (e.g. Google review)</label><input id="rvSource" name="source" /></div>
          <div className="field">
            <label htmlFor="rvRating">Stars</label>
            <select id="rvRating" name="rating" defaultValue="5">{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}</option>)}</select>
          </div>
          <div className="field"><label htmlFor="rvOrder">Order (lower shows first)</label><input id="rvOrder" name="sort_order" inputMode="numeric" defaultValue="0" /></div>
        </div>
        <div className="field"><label htmlFor="rvEn">Review in English</label><textarea id="rvEn" name="text_en" rows="3" /></div>
        <div className="field"><label htmlFor="rvFa">Review in Farsi</label><textarea id="rvFa" name="text_fa" rows="3" dir="rtl" /></div>
        <p className="err" role="status" style={{ color: 'var(--muted)' }}>{msg}</p>
        <button className="btn btn-accent" type="submit" disabled={busy} style={{ justifySelf: 'start' }}>Add review</button>
      </form>
      {reviews.length > 0 && (
        <div className="tablebox">
          <table>
            <thead><tr><th>Name</th><th>Stars</th><th>Review</th><th>Shown</th><th></th></tr></thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}<br /><small>{r.source}</small></td>
                  <td>{'★'.repeat(r.rating)}</td>
                  <td style={{ maxWidth: 420 }}>{r.text_en}{r.text_en && r.text_fa ? <br /> : null}<span dir="rtl">{r.text_fa}</span></td>
                  <td>{r.active ? 'Yes' : 'Hidden'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button type="button" className="linkbtn" onClick={() => toggle(r)}>{r.active ? 'Hide' : 'Show'}</button>{' · '}
                    <button type="button" className="linkbtn" onClick={() => remove(r)} style={{ color: 'var(--error)' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
