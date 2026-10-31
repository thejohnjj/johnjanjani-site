import { t as dictFor } from '@/lib/i18n';
import { mlsT } from '@/lib/i18n-mls';
import { vowT } from '@/lib/i18n-vow';
import { getMemberId } from '@/lib/session';
import { getMember } from '@/lib/listings';
import { getVowAccess } from '@/lib/vow';
import { readEstimateInput, inputComplete, estimateValue, SIZES } from '@/lib/estimate';
import { recordEstimateLead } from '@/lib/estimate-lead';
import { AREAS } from '@/lib/mls-options';
import { guardFeedView } from '@/lib/feed-guard';
import MembershipProvider from '@/components/Membership';
import { Header, Footer } from '@/components/SiteChrome';
import MobileBar from '@/components/MobileBar';
import VowGate from '@/components/VowGate';
import { feedPrice, MlsDisclaimer } from '@/components/MlsCard';
import SoldCard, { VowCopyright } from '@/components/SoldCard';
import { WHATSAPP } from '@/lib/site';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }) {
  const e = vowT(params.lang).est;
  return {
    title: e.title,
    description: e.lead,
    robots: { index: false, follow: true },
  };
}

const SIZE_LABEL = { '<700': '< 700', '700-999': '700–999', '1000-1399': '1,000–1,399', '1400-1999': '1,400–1,999', '2000-2499': '2,000–2,499', '2500-2999': '2,500–2,999', '3000-3499': '3,000–3,499', '3500+': '3,500+' };

function EstimateForm({ lang, e, i }) {
  return (
    <form className="est-form" method="get" action={`/${lang}/estimate`}>
      <label className="wide">{e.addr}<input name="addr" defaultValue={i.addr} placeholder={e.addrPh} dir="ltr" required maxLength={80} autoComplete="street-address" /></label>
      <label>{e.unit}<input name="unit" defaultValue={i.unit} dir="ltr" maxLength={10} /></label>
      <label>{e.area}
        <select name="area" defaultValue={i.area} required>
          <option value="" disabled>—</option>
          {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </label>
      <label>{e.type}
        <select name="type" defaultValue={i.type} required>
          <option value="" disabled>—</option>
          {Object.entries(e.types).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <label>{e.beds}
        <select name="beds" defaultValue={i.beds ?? ''} required>
          <option value="" disabled>—</option>
          {[0, 1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n === 0 ? (lang === 'fa' ? 'استودیو' : 'Studio') : n}</option>)}
        </select>
      </label>
      <label>{e.baths}
        <select name="baths" defaultValue={i.baths ?? ''}>
          <option value="">—</option>
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      <label>{e.size}
        <select name="size" defaultValue={i.size}>
          <option value="">{e.sizeAny}</option>
          {Object.keys(SIZES).map((k) => <option key={k} value={k}>{SIZE_LABEL[k]}</option>)}
        </select>
      </label>
      <button className="btn btn-accent" type="submit">{e.go}</button>
    </form>
  );
}

export default async function EstimatePage({ params, searchParams }) {
  const lang = params.lang;
  const t = dictFor(lang);
  const m = mlsT(lang);
  const v = vowT(lang);
  const e = v.est;
  const s = v.sold;
  const member = await getMember(getMemberId());
  const access = await getVowAccess();
  const i = readEstimateInput(searchParams);
  const complete = inputComplete(i);
  const vow = access.status === 'ok';
  const here = `/${lang}/estimate?${new URLSearchParams(Object.entries({ addr: i.addr, unit: i.unit, area: i.area, type: i.type, beds: i.beds ?? '', baths: i.baths ?? '', size: i.size }).filter(([, x]) => x !== '' && x != null)).toString()}`;

  let result = null;
  let allowed = true;
  if (complete && vow) {
    allowed = await guardFeedView({ action: 'estimate', kind: 'vow', memberId: access.member.id });
    if (allowed) {
      result = await estimateValue(i);
      if (result.ok || result.reason === 'few') await recordEstimateLead(access.member, i, lang).catch(() => {});
    }
  }
  const step = !complete ? 0 : vow ? 2 : 1;
  const where = result?.ok ? (result.level === 'building' ? e.levels.building : (result.level === 'community' ? result.location.community : result.location.city || i.area)) : '';
  const wa = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(e.exactWa.replace('{a}', `${i.unit ? `${i.unit} - ` : ''}${i.addr}, ${i.area}`))}`;

  return (
    <MembershipProvider lang={lang} t={t}>
      <Header lang={lang} t={t} member={member} path={complete ? here.slice(3) : '/estimate'} />
      <main>
        <section className="block list-page">
          <div className="wrap">
            <a className="back" href={`/${lang}`}>{t.backHome}</a>
            <h1>{e.title}</h1>
            <p style={{ color: 'var(--muted)', margin: '6px 0 18px', fontSize: 18 }}>{e.lead}</p>
            <ol className="est-steps">
              {e.steps.map((label, n) => <li key={label} className={n === step ? 'on' : n < step ? 'done' : ''}><span>{n + 1}</span>{label}</li>)}
            </ol>

            {step === 0 && <EstimateForm lang={lang} e={e} i={i} />}

            {step === 1 && (
              <>
                <p className="vow-note">{e.gateNote}</p>
                <VowGate lang={lang} initial={access.status === 'expired' || access.status === 'terms' ? 'expired' : access.status === 'unverified' ? 'unverified' : 'signup'} email={access.member?.email || member?.email || ''} next={here} />
              </>
            )}

            {step === 2 && !allowed && <p className="mls-count">{m.blocked}</p>}
            {step === 2 && result && !result.ok && (
              <div className="est-result">
                <p>{result.location?.streetFound === false ? e.notFound : e.few}</p>
                <div className="row"><a className="btn btn-accent" href={wa} target="_blank" rel="noopener noreferrer">{e.exactBtn}</a></div>
                <details style={{ marginTop: 16 }}><summary>{e.edit}</summary><EstimateForm lang={lang} e={e} i={i} /></details>
              </div>
            )}
            {step === 2 && result?.ok && (
              <>
                <div className="est-result">
                  <div className="est-top">
                    <div>
                      <span className="est-label">{e.result}</span>
                      <b className="est-value" dir="ltr">{feedPrice(result.value)}</b>
                      <span className={`est-conf ${result.confidence}`}>{e.conf[result.confidence]}</span>
                    </div>
                    <div className="est-range">
                      <span className="est-label">{e.range}</span>
                      <div className="bar"><i /></div>
                      <div className="ends" dir="ltr"><span>{feedPrice(result.low)}</span><span>{feedPrice(result.high)}</span></div>
                    </div>
                  </div>
                  <p className="mls-line" dir="auto">
                    <b dir="ltr">{`${i.unit ? `${i.unit} - ` : ''}${i.addr}, ${i.area}`}</b> · {e.basedOn.replace('{n}', result.count).replace('{w}', where).replace('{m}', result.months)}
                  </p>
                  <details><summary>{e.edit}</summary><EstimateForm lang={lang} e={e} i={i} /></details>
                </div>

                <aside className="mls-contact" style={{ marginBottom: 26 }}>
                  <h2>{e.exactTitle}</h2>
                  <p>{e.exactText}</p>
                  <div className="row">
                    <a className="btn btn-accent" href={wa} target="_blank" rel="noopener noreferrer">{e.exactBtn}</a>
                    <a className="btn btn-ghost" href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lang === 'fa' ? 'سلام پوریا، می‌خواهم یک تماس رایگان ۱۵ دقیقه‌ای رزرو کنم.' : 'Hi John, I’d like to book a free 15-minute call.')}`} target="_blank" rel="noopener noreferrer">{e.call}</a>
                  </div>
                </aside>

                <h2 style={{ fontSize: 26 }}>{e.compsTitle}</h2>
                <div className="mls-grid" style={{ marginTop: 14 }}>
                  {result.comps.map((l) => <SoldCard key={l.key} l={l} s={s} m={m} lang={lang} />)}
                </div>
              </>
            )}

            <p className="est-disclaimer">{e.disclaimer}</p>
            <MlsDisclaimer m={m} />
            {vow && <VowCopyright s={s} />}
          </div>
        </section>
      </main>
      <Footer lang={lang} t={t} />
      <MobileBar lang={lang} t={t} member={Boolean(member)} />
    </MembershipProvider>
  );
}
