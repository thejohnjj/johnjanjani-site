import { t as dictFor } from '@/lib/i18n';
import { mlsT, FEED_LIVE } from '@/lib/i18n-mls';
import { vowT } from '@/lib/i18n-vow';
import { getMemberId } from '@/lib/session';
import { getMember } from '@/lib/listings';
import { getFeedListing } from '@/lib/proptx';
import { getVowAccess } from '@/lib/vow';
import { getVowListing, getAddressHistory, getPriceChanges } from '@/lib/vow-data';
import { guardFeedView } from '@/lib/feed-guard';
import MembershipProvider from '@/components/Membership';
import { Header, Footer } from '@/components/SiteChrome';
import MobileBar from '@/components/MobileBar';
import Gallery from '@/components/Gallery';
import VowGate from '@/components/VowGate';
import { feedPrice, MlsSpecs, MlsDisclaimer } from '@/components/MlsCard';
import { SoldPriceBlock, History, VowCopyright } from '@/components/SoldCard';
import { WHATSAPP, PHONE, PHONE_TEL } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const m = mlsT(params.lang);
  const access = await getVowAccess();
  const key = decodeURIComponent(params.key);
  const l = access.status === 'ok' ? await getVowListing(key) : await getFeedListing(key);
  const ok = l && !l.error;
  const title = ok ? `${l.address || [l.community, l.city].filter(Boolean).join(', ')} · ${m.mlsNo}${l.key}` : m.title;
  // Sold details are members-only, so only active public listings may ever be indexed.
  const indexable = FEED_LIVE && access.status !== 'ok';
  return {
    title,
    robots: indexable ? undefined : { index: false, follow: false },
    alternates: { canonical: `/${params.lang}/mls/${params.key}`, languages: { en: `/en/mls/${params.key}`, fa: `/fa/mls/${params.key}` } },
  };
}

export default async function MlsListingPage({ params }) {
  const lang = params.lang;
  const t = dictFor(lang);
  const m = mlsT(lang);
  const v = vowT(lang);
  const s = v.sold;
  const key = decodeURIComponent(params.key);
  const member = await getMember(getMemberId());
  const access = await getVowAccess();
  const vow = access.status === 'ok';
  const allowed = await guardFeedView({ action: 'view', kind: vow ? 'vow' : 'idx', listingKey: key.slice(0, 20), memberId: access.member?.id || member?.id || null });

  let l = null;
  let history = [];
  let changes = [];
  if (allowed) {
    l = vow ? await getVowListing(key) : await getFeedListing(key);
    if (vow && l && !l.error) [history, changes] = await Promise.all([getAddressHistory(l), getPriceChanges(l.key)]);
  }
  const ok = l && !l.error;
  const offMarket = ok && vow && !l.available;
  const place = ok ? [l.community, l.city].filter(Boolean).join(', ') : '';
  const wa = ok ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(m.waText.replace('{k}', l.key).replace('{a}', l.address || place))}` : '';
  const here = `/${lang}/mls/${encodeURIComponent(key)}`;

  return (
    <MembershipProvider lang={lang} t={t}>
      <Header lang={lang} t={t} member={member} path={`/mls/${params.key}`} />
      <main className="wrap">
        <a className="back" href={offMarket ? `/${lang}/sold` : `/${lang}/search`}>{m.back}</a>
        {!allowed && <p className="mls-count" style={{ marginTop: 24 }}>{m.blocked}</p>}

        {/* Not active and not signed in: it may be a sold home. Offer the free account; show no data. */}
        {allowed && !ok && !vow && (
          <div style={{ marginTop: 24 }}>
            <div className="vow-note">{s.teaserTitle}. {s.teaserText}</div>
            <VowGate lang={lang} initial={access.status === 'expired' ? 'expired' : access.status === 'unverified' ? 'unverified' : 'signup'} email={access.member?.email || member?.email || ''} next={here} />
          </div>
        )}
        {allowed && !ok && vow && <p className="mls-count" style={{ marginTop: 24 }}>{l?.error ? m.error : m.gone}</p>}

        {ok && (
          <div className="detail">
            <div className="media">
              <Gallery photos={l.photos} alt={l.address || place} />
              {vow && (
                <div style={{ marginTop: 28 }}>
                  <History items={history} changes={changes} s={s} currentKey={l.key} lang={lang} />
                </div>
              )}
            </div>
            <div className="info">
              <div className="eyebrow">
                {offMarket ? s.status[l.status] || l.status : l.lease ? m.lease : m.sale} · <span dir="ltr">{l.city}</span>
              </div>
              <h1 dir="ltr" style={{ textAlign: 'start' }}>{l.address || place}</h1>
              {offMarket && (l.status === 'Sold' || l.status === 'Leased') ? (
                <SoldPriceBlock l={l} s={s} m={m} big />
              ) : (
                <div className="price" dir="ltr" style={{ textAlign: 'start' }}>
                  {feedPrice(l.price ?? l.listPrice)}
                  {l.lease && <small> {m.perMonth}</small>}
                </div>
              )}
              <div className="mls-line" dir="ltr">{[l.subtype, l.address ? place : null].filter(Boolean).join(' · ')}</div>
              <MlsSpecs l={l} m={m} />
              <div className="mls-line">{m.brokerage}: <span dir="ltr">{l.brokerage}</span></div>
              <div className="mls-line">{m.mlsNo} <span dir="ltr">{l.key}</span></div>

              {!vow && (
                <a className="vow-teaser" href={`/${lang}/account?next=${encodeURIComponent(here)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <b>{s.historyTitle}</b>
                  <span className="mls-line">{s.teaserText}</span>
                  <span className="btn btn-accent" style={{ justifySelf: 'start' }}>{s.unlock}</span>
                </a>
              )}

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
                    {l.facts.map(([k, val]) => (
                      <div key={k}>
                        <dt>{m.facts[k]}</dt>
                        <dd dir="ltr">{String(val)}</dd>
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
        {vow && <VowCopyright s={s} />}
        <div style={{ height: 48 }} />
      </main>
      <Footer lang={lang} t={t} />
      <MobileBar lang={lang} t={t} member={Boolean(member)} />
    </MembershipProvider>
  );
}
