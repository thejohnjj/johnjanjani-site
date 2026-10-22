import { t as dictFor } from '@/lib/i18n';
import { getMemberId, hasGuide } from '@/lib/session';
import { getMember } from '@/lib/listings';
import { GUIDE } from '@/lib/guide';
import MembershipProvider from '@/components/Membership';
import { Header, Footer } from '@/components/SiteChrome';
import MobileBar from '@/components/MobileBar';
import GuideForm from '@/components/GuideForm';
import PrintButton from '@/components/PrintButton';
import { Icons } from '@/components/ContactIcons';
import { PHONE, PHONE_TEL } from '@/lib/site';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }) {
  const t = dictFor(params.lang);
  return {
    title: t.gTitle,
    description: t.gLead,
    alternates: { canonical: `/${params.lang}/guide`, languages: { en: '/en/guide', fa: '/fa/guide' } },
  };
}

function Section({ s }) {
  return (
    <section className="g-sec" id={s.id}>
      <h2>{s.title}</h2>
      {s.intro && <p>{s.intro}</p>}
      {s.table && (
        <div className="g-table">
          <table>
            <thead><tr>{s.table.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>{s.table.rows.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
      <ul>{s.items.map((it) => <li key={it}>{it}</li>)}</ul>
      {s.tip && <p className="g-tip">{s.tip}</p>}
    </section>
  );
}

export default async function Guide({ params }) {
  const lang = params.lang;
  const t = dictFor(lang);
  const member = await getMember(getMemberId());
  const unlocked = hasGuide() || Boolean(member);
  const sections = GUIDE[lang];

  return (
    <MembershipProvider lang={lang} t={t}>
      <Header lang={lang} t={t} member={member} path="/guide" />
      <main className="tool-page">
        <section className="tool-hero">
          <svg className="hero-house" viewBox="-20 0 240 200" aria-hidden="true">
            <path d="M10 104 L64 56 L118 104 V170 H10 Z M82 84 L138 32 L194 84 V190 H82 Z M-20 116 H220" fill="none" stroke="#F6F1E7" strokeWidth="2" />
          </svg>
          <div className={`wrap ${unlocked ? 'tool-head' : 'tool-grid'}`}>
            <div className="tool-intro">
              <div className="eyebrow light">{t.gEyebrow}</div>
              <h1>{t.gTitle}</h1>
              <p className="lead">{t.gLead}</p>
              {!unlocked && (
                <>
                  <h2 className="toc-h">{t.gInside}</h2>
                  <ol className="toc">
                    {sections.map((s) => <li key={s.id}>{s.title.replace(/^[0-9۰-۹]+\.\s*/, '')}</li>)}
                  </ol>
                </>
              )}
              {unlocked && <PrintButton label={t.gPrint} />}
            </div>
            {!unlocked && <GuideForm lang={lang} t={t} />}
          </div>
        </section>

        {unlocked && (
          <div className="wrap guide">
            <nav className="g-toc no-print" aria-label={t.gInside}>
              {sections.map((s) => <a key={s.id} href={`#${s.id}`}>{s.title}</a>)}
            </nav>
            <article>
              {sections.map((s) => <Section key={s.id} s={s} />)}
              <div className="g-cta">
                <div>
                  <h2>{t.gCtaTitle}</h2>
                  <p>{t.gCtaText}</p>
                </div>
                <a className="btn btn-accent" href={`tel:${PHONE_TEL}`}><span className="ci">{Icons.phone}</span><span dir="ltr">{PHONE}</span></a>
              </div>
              <p className="g-disc">{t.gDisclaimer}</p>
              <p className="g-disc print-only">
                {lang === 'fa' ? 'پوریا جان جانی' : 'Purya (John) Janjani'} · {PHONE} · johnjanjani.com · {t.footerBrokerage}
              </p>
            </article>
          </div>
        )}
      </main>
      <Footer lang={lang} t={t} />
      <MobileBar lang={lang} t={t} member={Boolean(member)} />
    </MembershipProvider>
  );
}
