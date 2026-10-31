import { AREAS } from '@/lib/mls-options';

// Homepage band for the instant estimate. The report card on the right is an illustration with
// made-up numbers (clearly labelled), never MLS® data.
const SAMPLE = { value: 1385000, low: 1318000, high: 1452000, rent: 3950, methods: [['comps', 1372000, 40], ['adjusted', 1391000, 30], ['ppsf', 1404000, 20]] };
const money = (n) => `$${n.toLocaleString('en-US')}`;

export default function EstimatePromo({ lang, v }) {
  const p = v.promo;
  const e = v.est;
  const r = e.report;
  return (
    <section className="block estp" id="estimate" aria-labelledby="estp-title">
      <div className="wrap estp-grid">
        <div className="estp-copy">
          <div className="eyebrow light">{p.eyebrow}</div>
          <h2 id="estp-title">{p.title}</h2>
          <p className="estp-lead">{p.lead}</p>
          <ul className="estp-points">
            {p.points.map((x) => (
              <li key={x}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {x}
              </li>
            ))}
          </ul>
          <form className="estp-form" method="get" action={`/${lang}/estimate`}>
            <input type="hidden" name="purpose" value="mine" />
            <label className="estp-addr">
              <span className="sr">{e.addr}</span>
              <input name="addr" placeholder={p.addrPh} dir={lang === 'fa' ? 'rtl' : 'ltr'} required maxLength={80} autoComplete="street-address" />
            </label>
            <label className="estp-city">
              <span className="sr">{p.area}</span>
              <select name="area" defaultValue="" required>
                <option value="" disabled>{p.area}</option>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
            <button className="btn btn-accent" type="submit">{p.go}</button>
          </form>
          <p className="estp-note">{p.note}</p>
        </div>

        <figure className="estp-sample" aria-label={p.sample}>
          <div className="estp-tag">{p.sample}</div>
          <div className="estp-head">
            <small>{r.title}</small>
            <b dir="ltr">{p.sampleAddr}</b>
            <span>{p.sampleCity}</span>
          </div>
          <div className="estp-value">
            <small>{e.result}</small>
            <strong dir="ltr">{money(SAMPLE.value)}</strong>
            <span className="estp-conf">{e.conf.high}</span>
          </div>
          <div className="estp-range" dir="ltr" aria-label={e.range}>
            <div className="bar"><i style={{ left: `${((SAMPLE.value - SAMPLE.low) / (SAMPLE.high - SAMPLE.low)) * 100}%` }} /></div>
            <div className="ends"><span>{money(SAMPLE.low)}</span><span>{money(SAMPLE.high)}</span></div>
          </div>
          <ul className="estp-methods">
            {SAMPLE.methods.map(([k, val, w]) => (
              <li key={k}>
                <span>{r.methods[k][0]}</span>
                <span className="w"><i style={{ width: `${w * 2.2}%` }} /></span>
                <b dir="ltr">{money(val)}</b>
              </li>
            ))}
          </ul>
          <div className="estp-foot">
            <div>
              <small>{p.trend}</small>
              <svg viewBox="0 0 160 40" aria-hidden="true"><path d="M2 32 L18 30 L32 33 L46 27 L60 28 L74 22 L88 24 L102 18 L116 20 L130 14 L144 15 L158 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div>
              <small>{r.rent}</small>
              <b dir="ltr">{money(SAMPLE.rent)}<span>{p.rentMo}</span></b>
            </div>
          </div>
          <figcaption>{p.sampleNote}</figcaption>
        </figure>
      </div>
    </section>
  );
}
