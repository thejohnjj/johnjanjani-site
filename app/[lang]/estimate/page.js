import { t as dictFor } from '@/lib/i18n';
import { mlsT } from '@/lib/i18n-mls';
import { vowT } from '@/lib/i18n-vow';
import { getMemberId } from '@/lib/session';
import { getMember } from '@/lib/listings';
import { getVowAccess } from '@/lib/vow';
import { readEstimateInput, inputComplete, estimateValue, buildReport, SIZES } from '@/lib/estimate';
import TrendChart from '@/components/TrendChart';
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
      if (result.ok) result.report = await buildReport(i, result).catch((err) => { console.error('report', err?.message); return null; });
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
            {step === 2 && result?.ok && <Report lang={lang} e={e} s={s} m={m} i={i} result={result} where={where} wa={wa} />}
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


const money = (n) => feedPrice(n);
const fill = (str, map) => Object.entries(map).reduce((a, [k, v]) => a.split(`{${k}}`).join(v), str);

function Report({ lang, e, s, m, i, result, where, wa }) {
  const r = result.report;
  const R = e.report;
  const value = r?.value ?? result.value;
  const low = r?.low ?? result.low;
  const high = r?.high ?? result.high;
  const span = high - low || 1;
  const pos = Math.min(95, Math.max(5, ((value - low) / span) * 100));
  const address = `${i.unit ? `${i.unit} - ` : ''}${i.addr}, ${i.area}`;
  const typeLabel = e.types[i.type];
  const placeT = r?.trend?.level === 'community' && result.location.community ? result.location.community : result.location.city || i.area;
  const placeM = r?.market?.level === 'community' && result.location.community ? result.location.community : result.location.city || i.area;
  const today = new Date().toISOString().slice(0, 10);
  const wsum = r ? r.methods.reduce((a, x) => a + x.weight, 0) : 1;

  return (
    <div className="report">
      <section className="est-result rep-head">
        <div className="rep-for">
          <span className="est-label">{R.title}</span>
          <span>{fill(R.prepared, { d: today })} <b dir="ltr">{address}</b> · {typeLabel} · {i.beds} {m.bd}{i.baths ? ` · ${i.baths} ${m.ba}` : ''}</span>
        </div>
        <div className="est-top">
          <div>
            <span className="est-label">{R.blended}</span>
            <b className="est-value" dir="ltr">{money(value)}</b>
            <span className={`est-conf ${result.confidence}`}>{e.conf[result.confidence]}</span>
          </div>
          <div className="est-range">
            <span className="est-label">{e.range}</span>
            <div className="bar" dir="ltr"><i /><em style={{ left: `${pos}%` }} /></div>
            <div className="ends" dir="ltr"><span>{money(low)}</span><span>{money(high)}</span></div>
          </div>
        </div>
        <p className="mls-line" dir="auto">{e.basedOn.replace('{n}', result.count).replace('{w}', where).replace('{m}', result.months)}</p>
        <details><summary>{e.edit}</summary><EstimateForm lang={lang} e={e} i={i} /></details>
      </section>

      {r && (
        <section className="rep-card">
          <h2>{R.methodsTitle}</h2>
          <p className="rep-sub">{R.methodsSub}</p>
          <div className="rep-methods">
            {r.methods.map((x) => {
              const [title, desc] = R.methods[x.key];
              const d = fill(desc, {
                n: x.n,
                p: x.key === 'ppsf' ? `$${x.ppsf}` : money(r.lastSale?.price),
                d: r.lastSale?.date || '',
              });
              return (
                <div key={x.key} className="rep-method">
                  <div className="rm-top"><b>{title}</b><span className="rm-w">{Math.round((x.weight / wsum) * 100)}% {R.weight}</span></div>
                  <b className="rm-v" dir="ltr">{money(x.value)}</b>
                  <span className="rm-d" dir="auto">{d}</span>
                </div>
              );
            })}
            <div className="rep-method total">
              <div className="rm-top"><b>{R.blended}</b></div>
              <b className="rm-v" dir="ltr">{money(value)}</b>
            </div>
          </div>
        </section>
      )}

      {r && (
        <section className="rep-card">
          <h2>{R.conditionTitle}</h2>
          <p className="rep-sub">{R.conditionSub}</p>
          <div className="rep-cond">
            {['needsWork', 'good', 'renovated'].map((k) => (
              <div key={k} className={k === 'good' ? 'on' : ''}>
                <span>{R.condition[k]}</span>
                <b dir="ltr">{money(r.condition[k])}</b>
              </div>
            ))}
          </div>
        </section>
      )}

      {r?.trend && (
        <section className="rep-card">
          <div className="rep-h">
            <h2>{R.trendTitle}</h2>
            {r.trend.yoy != null && <span className={`rep-badge ${r.trend.yoy >= 0 ? 'up' : 'down'}`} dir="ltr">{r.trend.yoy > 0 ? '+' : ''}{fill(R.yoy, { v: r.trend.yoy })}</span>}
          </div>
          <p className="rep-sub">{fill(R.trendSub, { t: typeLabel, w: placeT })}</p>
          {r.trend.months.filter((x) => x.median).length >= 4 ? (
            <TrendChart points={r.trend.months} title={R.trendTitle} labels={{ tableView: R.tableView, month: R.month, median: s.median, sales: R.sales }} />
          ) : (
            <p className="mls-line">{R.trendThin}</p>
          )}
        </section>
      )}

      <div className="rep-two">
        {r?.market && (
          <section className="rep-card">
            <h2>{R.marketTitle}</h2>
            <p className="rep-sub">{fill(R.marketSub, { t: typeLabel, w: placeM })}</p>
            {r.market.market && (
              <div className={`rep-market ${r.market.market}`}>
                <b>{R.market[r.market.market]}</b>
                <div className="gauge" dir="ltr"><i style={{ left: `${Math.min(96, Math.max(4, (Math.min(r.market.monthsOfInventory, 9) / 9) * 100))}%` }} /></div>
                <div className="gauge-l" dir="ltr"><span>{R.market.seller}</span><span>{R.market.balanced}</span><span>{R.market.buyer}</span></div>
                <span className="rep-sub">{R.marketText[r.market.market]}</span>
              </div>
            )}
            <dl className="rep-stats">
              {r.market.monthsOfInventory != null && <div><dt>{R.moi}</dt><dd dir="ltr">{r.market.monthsOfInventory}</dd></div>}
              <div><dt>{R.active}</dt><dd dir="ltr">{r.market.active}</dd></div>
              <div><dt>{R.soldPm}</dt><dd dir="ltr">{r.market.soldPerMonth}</dd></div>
              {r.market.ratio != null && <div><dt>{R.ratio}</dt><dd dir="ltr">{r.market.ratio}%</dd></div>}
              {r.market.overAsking != null && <div><dt>{R.over}</dt><dd dir="ltr">{r.market.overAsking}%</dd></div>}
              {r.market.dom != null && <div><dt>{R.dom}</dt><dd dir="ltr">{r.market.dom}</dd></div>}
            </dl>
          </section>
        )}
        {r?.rent && (
          <section className="rep-card">
            <h2>{R.rentTitle}</h2>
            <p className="rep-sub">{fill(R.rentSub, { n: r.rent.count })}</p>
            <dl className="rep-stats big">
              <div><dt>{R.rent}</dt><dd dir="ltr">{money(r.rent.median)}<small> {m.perMonth}</small></dd></div>
              <div><dt>{R.rentRange}</dt><dd dir="ltr">{money(r.rent.low)} – {money(r.rent.high)}</dd></div>
              <div><dt>{R.yield}</dt><dd dir="ltr">{r.rent.yield}%</dd></div>
            </dl>
          </section>
        )}
      </div>

      {r?.lastSale && (
        <section className="rep-card">
          <h2>{R.lastSaleTitle}</h2>
          <dl className="rep-stats">
            <div><dt>{s.soldOn.replace('{d}', '')}</dt><dd dir="ltr">{r.lastSale.date}</dd></div>
            <div><dt>{s.soldFor}</dt><dd dir="ltr">{money(r.lastSale.price)}</dd></div>
            {r.lastSale.today && <div><dt>{e.report.cols.today}</dt><dd dir="ltr">{money(r.lastSale.today)}</dd></div>}
          </dl>
        </section>
      )}

      <aside className="mls-contact" style={{ margin: '6px 0 26px' }}>
        <h2>{e.exactTitle}</h2>
        <p>{e.exactText}</p>
        <div className="row">
          <a className="btn btn-accent" href={wa} target="_blank" rel="noopener noreferrer">{e.exactBtn}</a>
          <a className="btn btn-ghost" href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lang === 'fa' ? 'سلام پوریا، می‌خواهم یک تماس رایگان ۱۵ دقیقه‌ای رزرو کنم.' : 'Hi John, I’d like to book a free 15-minute call.')}`} target="_blank" rel="noopener noreferrer">{e.call}</a>
        </div>
      </aside>

      <h2 style={{ fontSize: 26 }}>{e.compsTitle}</h2>
      <div className="mls-grid" style={{ marginTop: 14 }}>
        {(r?.comps || result.comps).map((l) => <SoldCard key={l.key} l={l} s={s} m={m} lang={lang} />)}
      </div>

      {r && (
        <section className="rep-card" style={{ marginTop: 26 }}>
          <h2>{R.tableTitle}</h2>
          <div className="rep-table">
            <table>
              <thead>
                <tr><th>{R.cols.address}</th><th>{R.cols.sold}</th><th>{R.cols.date}</th><th>{R.cols.layout}</th><th>{R.cols.size}</th><th>{R.cols.today}</th></tr>
              </thead>
              <tbody>
                {(r.comps || []).map((c) => (
                  <tr key={c.key}>
                    <td dir="ltr"><a href={`/${lang}/mls/${encodeURIComponent(c.key)}`}>{c.address || [c.community, c.city].filter(Boolean).join(', ')}</a></td>
                    <td dir="ltr">{c.soldPrice ? money(c.soldPrice) : '—'}</td>
                    <td dir="ltr">{c.soldDate || '—'}</td>
                    <td dir="ltr">{c.bedsBelow ? `${c.bedsAbove}+${c.bedsBelow}` : c.beds ?? '—'} / {c.baths ?? '—'}</td>
                    <td dir="ltr">{c.sqft || '—'}</td>
                    <td dir="ltr">{c.adjPrice ? money(Math.round(c.adjPrice / 1000) * 1000) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
