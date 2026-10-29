import { t as dictFor } from '@/lib/i18n';
import { getMemberId } from '@/lib/session';
import { getListings, getMember, splitListings } from '@/lib/listings';
import PicksGrid from '@/components/PicksGrid';
import HeroStories from '@/components/HeroStories';
import HeroMap from '@/components/HeroMap';
import HeroVideo from '@/components/HeroVideo';
import { GEO } from '@/lib/geo';
import ContactForm from '@/components/ContactForm';
import { money, number } from '@/lib/format';
import MembershipProvider, { JoinButton } from '@/components/Membership';
import ListingsGrid from '@/components/ListingsGrid';
import { Header, Footer } from '@/components/SiteChrome';
import { Icons } from '@/components/ContactIcons';
import MobileBar from '@/components/MobileBar';
import { getReviews } from '@/lib/reviews';
import { digits } from '@/lib/format';
import { PHONE, PHONE_TEL, INSTAGRAM_EN, INSTAGRAM_FA, FACEBOOK_URL, OFFICE, OFFICE_MAP } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default async function Home({ params, searchParams }) {
  const lang = params.lang;
  const t = dictFor(lang);
  const member = await getMember(getMemberId());
  const [all, reviews] = await Promise.all([getListings(Boolean(member)), getReviews()]);
  const { tours: listings, picks } = splitListings(all, lang);
  // Opening slideshow: the newest toured homes that have a photo.
  const slides = listings
    .filter((l) => l.photos[0] && !['sold', 'off'].includes(l.status))
    .slice(0, 6)
    .map((l) => ({ img: l.photos[0], code: l.code, type: l.type[lang], city: l.city[lang], href: `/${lang}/listings/${l.slug}` }));
  // Map opening (default when a Mapbox token is set); ?hero=photos shows the photo slideshow, ?hero=map forces the map.
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN || '';
  // Default opening: video hero. ?hero=map and ?hero=photos keep the older openings for comparison.
  const heroMode = ['map', 'photos', 'reel'].includes(searchParams?.hero) ? searchParams.hero : 'video';
  const useMap = heroMode === 'map' && Boolean(mapboxToken);
  const rated = reviews.filter((r) => r.rating);
  const stats = {
    reviews: reviews.length,
    rating: rated.length ? (rated.reduce((a, r) => a + r.rating, 0) / rated.length).toFixed(1) : '5.0',
    toured: listings.filter((l) => l.code).length,
  };
  const points = useMap
    ? [...listings, ...picks]
        .filter((l) => GEO[l.mls] && l.photos[0] && !['sold', 'off'].includes(l.status))
        .map((l) => ({ lat: GEO[l.mls][0], lng: GEO[l.mls][1], img: l.photos[0], code: l.code, type: l.type[lang], city: l.city[lang], href: `/${lang}/listings/${l.slug}` }))
    : [];

  return (
    <MembershipProvider lang={lang} t={t}>
      <Header lang={lang} t={t} member={member} />
      <main>
        {heroMode === 'video' || heroMode === 'reel' ? (
          <HeroVideo t={t} lang={lang} stats={stats} reel={heroMode === 'reel'} />
        ) : useMap && points.length > 0 ? (
          <HeroMap points={points} t={t} lang={lang} mapboxToken={mapboxToken} look={{ real: 'standard', satellite: 'satellite', day: 'day' }[searchParams?.look] || 'fast'} />
        ) : slides.length > 0 ? (
          <HeroStories slides={slides} t={t} lang={lang} />
        ) : (
          <section className="hero">
            <div className="wrap">
              <div>
                <div className="eyebrow light">{t.heroEyebrow}</div>
                <h1>{t.heroTitleA}<em>{t.heroTitleEm}</em>{t.heroTitleB}{t.heroTitleEm2 && <em>{t.heroTitleEm2}</em>}{t.heroTitleC}</h1>
                <p className="lead">{t.heroLead}</p>
                <div className="ctas">
                  <a className="btn btn-accent" href={picks.length ? '#picks' : '#listings'}>{t.heroCta}</a>
                  {!member && <JoinButton className="btn btn-ghost" label={t.heroJoin} />}
                </div>
              </div>
            </div>
          </section>
        )}

        {picks.length > 0 && (
          <section className="block picks" id="picks">
            <div className="wrap">
              <PicksGrid picks={picks} t={t} lang={lang} preview />
            </div>
          </section>
        )}

        <section className="block" id="listings">
          <div className="wrap">
            <ListingsGrid listings={listings} t={t} lang={lang} isMember={Boolean(member)} preview />
          </div>
        </section>

        <section className="block tools" id="tools">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <div className="eyebrow">{t.toolsEyebrow}</div>
                <h2>{t.toolsTitle}</h2>
              </div>
            </div>
            <div className="tool-cards">
              {t.toolCards.map((c) => (
                <a key={c.key} className={`tool-card tc-${c.key}`} href={`/${lang}/${{ homeValue: 'home-value', sellerGuide: 'seller-guide' }[c.key] || c.key}`}>
                  <span className="tc-icon">{Icons[c.icon]}</span>
                  <h3>{c.title}</h3>
                  <p>{c.text}</p>
                  <span className="tc-cta">{c.cta} <span aria-hidden="true">{lang === 'fa' ? '←' : '→'}</span></span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="block about" id="about">
          <div className="wrap">
            <div>
              <div className="eyebrow">{t.aboutEyebrow}</div>
              <h2>{t.aboutTitle}</h2>
              <p>{t.aboutP1}</p>
              <p>{t.aboutP2}</p>
            </div>
            <div className="facts">
              {t.facts.map(([n, label]) => (
                <div key={label}>
                  <strong>{n}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="block" id="market">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <div className="eyebrow">{t.marketEyebrow}</div>
                <h2>{t.marketTitle}</h2>
              </div>
            </div>
            <div className="stats">
              {t.market.map(([label, value, isMoney, delta]) => (
                <div className="stat" key={label}>
                  <span className="l">{label}</span>
                  <strong>{isMoney ? money(value, lang) : number(value, lang)}</strong>
                  <span className="d">{delta}</span>
                </div>
              ))}
            </div>
            <p className="src">{t.marketSource}</p>
          </div>
        </section>

        {reviews.length > 0 && (
          <section className="block reviews" id="reviews">
            <div className="wrap">
              <div className="sec-head">
                <div>
                  <div className="eyebrow">{t.rEyebrow}</div>
                  <h2>{t.rTitle}</h2>
                </div>
              </div>
              <div className="review-grid">
                {reviews.map((r) => {
                  const text = (lang === 'fa' ? r.text_fa || r.text_en : r.text_en || r.text_fa) || '';
                  const other = lang === 'fa' ? !r.text_fa : !r.text_en;
                  return (
                    <figure className="review" key={r.id}>
                      <div className="stars" aria-label={`${r.rating}/5`}>
                        {Array.from({ length: 5 }, (_, i) => <span key={i} className={i < r.rating ? 'on' : ''}>{Icons.star}</span>)}
                      </div>
                      <blockquote dir={other ? (lang === 'fa' ? 'ltr' : 'rtl') : undefined}>“{text}”</blockquote>
                      <figcaption><b>{r.name}</b>{r.source && <span> · {r.source}</span>}</figcaption>
                    </figure>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        <section className="contact" id="contact">
          <div className="wrap">
            <div>
              <div className="eyebrow light">{t.contactEyebrow}</div>
              <h2>{t.contactTitle}</h2>
              <p>{t.contactText}</p>
              <ContactForm lang={lang} t={t} />
            </div>
            <div className="cbox">
              <div className="cphone">
                <span className="cl">{t.contactLabels.phone}</span>
                <a className="num ltr" dir="ltr" href={`tel:${PHONE_TEL}`}>{PHONE}</a>
                <div className="cbtns">
                  <a className="btn btn-accent" href={`tel:${PHONE_TEL}`}><span className="ci">{Icons.phone}</span>{t.contactCall}</a>
                  <a className="btn btn-ghost" href={`sms:${PHONE_TEL}`}><span className="ci">{Icons.sms}</span>{t.contactText2}</a>
                </div>
              </div>
              <ul className="clinks">
                <li><a href={`https://instagram.com/${INSTAGRAM_EN}`} target="_blank" rel="noopener noreferrer"><span className="ic">{Icons.instagram}</span><span><b>Instagram</b><small dir="ltr">@{INSTAGRAM_EN} · English</small></span></a></li>
                <li><a href={`https://instagram.com/${INSTAGRAM_FA}`} target="_blank" rel="noopener noreferrer"><span className="ic">{Icons.instagram}</span><span><b>Instagram</b><small dir="ltr">@{INSTAGRAM_FA} · فارسی</small></span></a></li>
                {FACEBOOK_URL && (
                  <li><a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer"><span className="ic">{Icons.facebook}</span><span><b>Facebook</b><small>{t.contactFacebook}</small></span></a></li>
                )}
                <li><a href={OFFICE_MAP} target="_blank" rel="noopener noreferrer"><span className="ic">{Icons.pin}</span><span><b>{t.contactLabels.office}</b><small dir="ltr">{OFFICE}</small></span></a></li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <Footer lang={lang} t={t} />
      <MobileBar lang={lang} t={t} member={Boolean(member)} />
    </MembershipProvider>
  );
}
