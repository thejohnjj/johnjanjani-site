import { notFound } from 'next/navigation';
import { t as dictFor } from '@/lib/i18n';
import { getMemberId } from '@/lib/session';
import { getListing, getMember, recordView } from '@/lib/listings';
import MembershipProvider, { JoinButton } from '@/components/Membership';
import { Header, Footer } from '@/components/SiteChrome';
import Gallery from '@/components/Gallery';
import ShowingButton from '@/components/ShowingButton';
import LockIcon from '@/components/LockIcon';
import { Price, Specs } from '@/components/ListingCard';
import { digits } from '@/lib/format';
import MobileBar from '@/components/MobileBar';
import { ListingJsonLd } from '@/components/JsonLd';
import { SITE } from '@/lib/site';

// Turns an Instagram Reel or post link into its embeddable address.
function reelEmbed(url) {
  const m = String(url || '').match(/instagram\.com\/(?:[\w.]+\/)?(reel|reels|p|tv)\/([\w-]+)/i);
  if (!m) return null;
  const kind = m[1].toLowerCase() === 'p' ? 'p' : 'reel';
  return `https://www.instagram.com/${kind}/${m[2]}/embed`;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const l = await getListing(params.slug, false);
  if (!l) return {};
  const lang = params.lang;
  const t = dictFor(lang);
  const title = `${l.code ? `${t.code} ${l.code} · ` : ''}${l.type[lang]} · ${l.city[lang]} · ${t.status[l.status]}`;
  return {
    title,
    description: l.description[lang].slice(0, 160),
    alternates: { canonical: `/${lang}/listings/${l.slug}`, languages: { en: `/en/listings/${l.slug}`, fa: `/fa/listings/${l.slug}`, 'x-default': `/en/listings/${l.slug}` } },
    openGraph: { title, images: l.photos.slice(0, 1) },
  };
}

export default async function ListingPage({ params }) {
  const lang = params.lang;
  const t = dictFor(lang);
  const member = await getMember(getMemberId());
  const l = await getListing(params.slug, Boolean(member));
  if (!l) notFound();
  if (member) await recordView(member, l).catch(() => {});
  const label = `${l.type.en} · ${l.city.en}`;

  return (
    <MembershipProvider lang={lang} t={t}>
      <Header lang={lang} t={t} member={member} path={`/listings/${l.slug}`} />
      <ListingJsonLd l={l} lang={lang} url={`${SITE}/${lang}/listings/${l.slug}`} />
      <main className="wrap">
        <a className="back" href={`/${lang}/${l.section === 'pick' ? 'picks' : 'listings'}`}>{l.section === 'pick' ? t.pkBack : t.backToListings}</a>
        <div className="detail">
          <div className="media">
            <Gallery photos={l.photos} alt={`${l.type[lang]} · ${l.city[lang]}`} />
            {reelEmbed(l.tour) && (
              <div className="reel-embed">
                <h2>{t.reelTitle}</h2>
                <iframe src={reelEmbed(l.tour)} title={t.reelTitle} loading="lazy" allow="encrypted-media; picture-in-picture" allowFullScreen />
              </div>
            )}
          </div>
          <div className="info">
            {l.code && <div className="code-badge">{t.code}: <span dir="ltr">{digits(l.code, lang)}</span></div>}
            <div className="eyebrow">{t.status[l.status]} · {l.city[lang]}</div>
            <h1>{l.type[lang]}</h1>
            <Price l={l} t={t} lang={lang} />
            {l.address ? (
              <div className="where ltr" dir="ltr" style={{ textAlign: 'start', fontSize: 17 }}>{l.address}</div>
            ) : (
              <div className="where">
                {l.city[lang]} ·{' '}
                <span className="locked" style={{ padding: '3px 10px', fontSize: 14 }}>
                  <LockIcon />
                  {t.lockAddr}
                </span>
              </div>
            )}
            <Specs l={l} t={t} lang={lang} />
            {l.section === 'pick' && l.note[lang] && (
              <div className="pick-why">
                <span>{t.pkWhy}</span>
                <p>{l.note[lang]}</p>
              </div>
            )}
            {l.description[lang] && <p style={{ whiteSpace: 'pre-line' }}>{l.description[lang]}</p>}
            {l.features[lang].length > 0 && (
              <div>
                <div className="eyebrow" style={{ marginBottom: 8 }}>{t.features}</div>
                <ul className="feat">
                  {l.features[lang].map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
            {member ? (
              <ShowingButton listingId={l.id} label={t.showing} sentLabel={t.showingSent} errorLabel={t.errServer} />
            ) : (
              <JoinButton label={t.unlockBtn} listingLabel={label} />
            )}
            {l.tour && (
              <a className="btn btn-ghost tour" href={l.tour} target="_blank" rel="noopener noreferrer">{t.watchTour}</a>
            )}
            <div className="broker">
              {l.brokerage && <p>{t.brokerage}: <b dir="ltr">{l.brokerage}</b></p>}
              {l.mls && <p className="ltr" dir="ltr">{t.mls} {l.mls}</p>}
            </div>
          </div>
        </div>
      </main>
      <Footer lang={lang} t={t} />
      <MobileBar lang={lang} t={t} member={Boolean(member)} />
    </MembershipProvider>
  );
}
