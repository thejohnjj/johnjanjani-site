import { t as dictFor } from '@/lib/i18n';
import { mlsT, FEED_LIVE } from '@/lib/i18n-mls';
import { getMemberId } from '@/lib/session';
import { getMember } from '@/lib/listings';
import { getFeedListing } from '@/lib/proptx';
import { guardFeedView } from '@/lib/feed-guard';
import MembershipProvider from '@/components/Membership';
import { Header, Footer } from '@/components/SiteChrome';
import MobileBar from '@/components/MobileBar';
import Gallery from '@/components/Gallery';
import { feedPrice, MlsSpecs, MlsDisclaimer } from '@/components/MlsCard';
import { WHATSAPP, PHONE, PHONE_TEL } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const m = mlsT(params.lang);
  const l = await getFeedListing(decodeURIComponent(params.key));
  const title = l && !l.error ? `${l.address || [l.community, l.city].filter(Boolean).join(', ')} · ${m.mlsNo}${l.key}` : m.title;
  return {
    title,
    robots: FEED_LIVE ? undefined : { index: false, follow: false },
    alternates: { canonical: `/${params.lang}/mls/${params.key}`, languages: { en: `/en/mls/${params.key}`, fa: `/fa/mls/${params.key}` } },
  };
}

export default async function MlsListingPage({ params }) {
  const lang = params.lang;
  const t = dictFor(lang);
  const m = mlsT(lang);
  const key = decodeURIComponent(params.key);
  const member = await getMember(getMemberId());
  const allowed = await guardFeedView({ action: 'view', listingKey: key.slice(0, 20), memberId: member?.id || null });
  const l = allowed ? await getFeedListing(key) : null;
  const ok = l && !l.error;
  const place = ok ? [l.community, l.city].filter(Boolean).join(', ') : '';
  const wa = ok ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(m.waText.replace('{k}', l.key).replace('{a}', l.address || place))}` : '';

  return (
    <MembershipProvider lang={lang} t={t}>
      <Header lang={lang} t={t} member={member} path={`/mls/${params.key}`} />
      <main className="wrap">
        <a className="back" href={`/${lang}/search`}>{m.back}</a>
        {!allowed && <p className="mls-count" style={{ marginTop: 24 }}>{m.blocked}</p>}
        {allowed && !ok && <p className="mls-count" style={{ marginTop: 24 }}>{l?.error ? m.error : m.gone}</p>}
        {ok && (
          <div className="detail">
            <div className="media">
              <Gallery photos={l.photos} alt={l.address || place} />
            </div>
            <div className="info">
              <div className="eyebrow">{l.lease ? m.lease : m.sale} · <span dir="ltr">{l.city}</span></div>
              <h1 dir="ltr" style={{ textAlign: 'start' }}>{l.address || place}</h1>
              <div className="price" dir="ltr" style={{ textAlign: 'start' }}>
                {feedPrice(l.price)}
                {l.lease && <small> {m.perMonth}</small>}
              </div>
              <div className="mls-line" dir="ltr">{[l.subtype, l.address ? place : null].filter(Boolean).join(' · ')}</div>
              <MlsSpecs l={l} m={m} />
              <div className="mls-line">{m.brokerage}: <span dir="ltr">{l.brokerage}</span></div>
              <div className="mls-line">{m.mlsNo} <span dir="ltr">{l.key}</span></div>
              {l.remarks && (
                <div>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>{m.fromListing}</div>
                  <p className="mls-remarks" lang="en" dir="ltr" style={{ textAlign: 'start' }}>{l.remarks}</p>
                </div>
              )}
              {l.facts.length > 0 && (
                <div>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>{m.details}</div>
                  <dl className="mls-facts">
                    {l.facts.map(([k, v]) => (
                      <div key={k}>
                        <dt>{m.facts[k]}</dt>
                        <dd dir="ltr">{String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
              {l.tour && <a className="btn btn-line" href={l.tour} target="_blank" rel="noopener noreferrer">{m.tour}</a>}

              <aside className="mls-contact" aria-label={m.contactTitle}>
                <h2>{m.contactTitle}</h2>
                <p>{m.contactText}</p>
                <div className="row">
                  <a className="btn btn-accent" href={wa} target="_blank" rel="noopener noreferrer">{m.whatsapp}</a>
                  <a className="btn btn-ghost" href={`tel:${PHONE_TEL}`} dir="ltr">{m.call} {PHONE}</a>
                </div>
                <small>{m.contactWho}</small>
                <small>{m.contactNote}</small>
              </aside>
            </div>
          </div>
        )}
        <MlsDisclaimer m={m} />
        <div style={{ height: 48 }} />
      </main>
      <Footer lang={lang} t={t} />
      <MobileBar lang={lang} t={t} member={Boolean(member)} />
    </MembershipProvider>
  );
}
