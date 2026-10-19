import { t as dictFor } from '@/lib/i18n';
import { getMemberId } from '@/lib/session';
import { getListings, getMember } from '@/lib/listings';
import { money, number } from '@/lib/format';
import MembershipProvider, { JoinButton } from '@/components/Membership';
import ListingsGrid from '@/components/ListingsGrid';
import { Header, Footer } from '@/components/SiteChrome';

export const dynamic = 'force-dynamic';

export default async function Home({ params }) {
  const lang = params.lang;
  const t = dictFor(lang);
  const member = await getMember(getMemberId());
  const listings = await getListings(Boolean(member));

  return (
    <MembershipProvider lang={lang} t={t}>
      <Header lang={lang} t={t} member={member} />
      <main>
        <section className="hero">
          <svg className="hero-house" viewBox="-20 0 240 200" aria-hidden="true">
            <path d="M10 104 L64 56 L118 104 V170 H10 Z M82 84 L138 32 L194 84 V190 H82 Z M-20 116 H220" fill="none" stroke="#F6F1E7" strokeWidth="2" />
          </svg>
          <div className="wrap">
            <div>
              <div className="eyebrow light">{t.heroEyebrow}</div>
              <h1>
                {t.heroTitleA}
                <em>{t.heroTitleEm}</em>
                {t.heroTitleB}
                {t.heroTitleEm2 && <em>{t.heroTitleEm2}</em>}
                {t.heroTitleC}
              </h1>
              <p className="lead">{t.heroLead}</p>
              <div className="ctas">
                <a className="btn btn-accent" href="#listings">{t.heroCta}</a>
                {!member && <JoinButton className="btn btn-ghost" label={t.heroJoin} />}
              </div>
            </div>
            <div className="portrait">
              <img src="/images/john.jpg" alt={lang === 'fa' ? 'پوریا جانجانی' : 'Purya (John) Janjani'} width="640" height="640" />
              <div className="badge">
                <strong>{t.badgeTitle}</strong>
                <span>{t.badgeSub}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="block" id="listings">
          <div className="wrap">
            <ListingsGrid listings={listings} t={t} lang={lang} isMember={Boolean(member)} />
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

        <section className="contact" id="contact">
          <div className="wrap">
            <div>
              <div className="eyebrow light">{t.contactEyebrow}</div>
              <h2>{t.contactTitle}</h2>
              <p>{t.contactText}</p>
            </div>
            <dl>
              <dt>{t.contactLabels.phone}</dt>
              <dd className="ltr"><a href="tel:+14376676652">437-667-6652</a></dd>
              <dt>{t.contactLabels.web}</dt>
              <dd className="ltr">johnjanjani.com</dd>
              <dt>Instagram</dt>
              <dd className="ltr">
                <a href="https://instagram.com/john.janjani" rel="noopener">@john.janjani</a> ·{' '}
                <a href="https://instagram.com/purya.janjani" rel="noopener">@purya.janjani</a>
              </dd>
              <dt>{t.contactLabels.office}</dt>
              <dd className="ltr">1053 McNicoll Ave, Toronto, ON</dd>
            </dl>
          </div>
        </section>
      </main>
      <Footer lang={lang} t={t} />
    </MembershipProvider>
  );
}
