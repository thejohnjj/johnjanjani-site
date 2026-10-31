import { VOW_LIVE, vowT } from '@/lib/i18n-vow';
import { t as dictFor } from '@/lib/i18n';
import { getMemberId } from '@/lib/session';
import { getMember } from '@/lib/listings';
import MembershipProvider from '@/components/Membership';
import { Header, Footer } from '@/components/SiteChrome';
import MobileBar from '@/components/MobileBar';
import HomeValueForm from '@/components/HomeValueForm';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }) {
  const t = dictFor(params.lang);
  return {
    title: t.seo.hv,
    description: t.hvLead,
    alternates: { canonical: `/${params.lang}/home-value`, languages: { en: '/en/home-value', fa: '/fa/home-value' } },
  };
}

export default async function HomeValue({ params }) {
  const lang = params.lang;
  const t = dictFor(lang);
  const member = await getMember(getMemberId());
  return (
    <MembershipProvider lang={lang} t={t}>
      <Header lang={lang} t={t} member={member} path="/home-value" />
      <main className="tool-page">
        <section className="tool-hero">
          <svg className="hero-house" viewBox="-20 0 240 200" aria-hidden="true">
            <path d="M10 104 L64 56 L118 104 V170 H10 Z M82 84 L138 32 L194 84 V190 H82 Z M-20 116 H220" fill="none" stroke="#F6F1E7" strokeWidth="2" />
          </svg>
          <div className="wrap tool-grid">
            <div className="tool-intro">
              <div className="eyebrow light">{t.hvEyebrow}</div>
              <h1>{t.hvTitle}</h1>
              <p className="lead">{t.hvLead}</p>
              {VOW_LIVE && (
                <a className="est-cta" href={`/${lang}/estimate`} style={{ margin: '14px 0' }}>
                  <b>{vowT(lang).est.title}</b><span>{vowT(lang).est.lead}</span><span aria-hidden="true">{lang === 'fa' ? '←' : '→'}</span>
                </a>
              )}
              <ul className="ticks">
                {t.hvPoints.map((p) => <li key={p}>{p}</li>)}
              </ul>
              <div className="tool-who">
                <img src="/images/john.jpg" alt="" width="64" height="64" />
                <div>
                  <b>{lang === 'fa' ? 'پوریا جان جانی' : 'Purya (John) Janjani'}</b>
                  <span>{t.footerBrokerage}</span>
                </div>
              </div>
            </div>
            <HomeValueForm lang={lang} t={t} />
          </div>
        </section>
      </main>
      <Footer lang={lang} t={t} />
      <MobileBar lang={lang} t={t} member={Boolean(member)} />
    </MembershipProvider>
  );
}
