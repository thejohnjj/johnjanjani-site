import { t as dictFor } from '@/lib/i18n';
import { getMemberId } from '@/lib/session';
import { getMember } from '@/lib/listings';
import MembershipProvider from '@/components/Membership';
import { Header, Footer } from '@/components/SiteChrome';
import MobileBar from '@/components/MobileBar';
import Calculator from '@/components/Calculator';
import { Icons } from '@/components/ContactIcons';
import { PHONE, PHONE_TEL } from '@/lib/site';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }) {
  const t = dictFor(params.lang);
  return {
    title: t.seo.calc,
    description: t.cLead,
    alternates: { canonical: `/${params.lang}/calculator`, languages: { en: '/en/calculator', fa: '/fa/calculator' } },
  };
}

export default async function CalculatorPage({ params }) {
  const lang = params.lang;
  const t = dictFor(lang);
  const member = await getMember(getMemberId());
  return (
    <MembershipProvider lang={lang} t={t}>
      <Header lang={lang} t={t} member={member} path="/calculator" />
      <main className="tool-page">
        <section className="tool-hero slim">
          <div className="wrap">
            <div className="eyebrow light">{t.cEyebrow}</div>
            <h1>{t.cTitle}</h1>
            <p className="lead">{t.cLead}</p>
          </div>
        </section>
        <div className="wrap" style={{ paddingBlock: '32px 64px' }}>
          <Calculator lang={lang} t={t} />
          <div className="g-cta" style={{ marginTop: 32 }}>
            <div>
              <h2>{t.cCtaTitle}</h2>
              <p>{t.cCtaText}</p>
            </div>
            <a className="btn btn-accent" href={`tel:${PHONE_TEL}`}><span className="ci">{Icons.phone}</span><span dir="ltr">{PHONE}</span></a>
          </div>
        </div>
      </main>
      <Footer lang={lang} t={t} />
      <MobileBar lang={lang} t={t} member={Boolean(member)} />
    </MembershipProvider>
  );
}
