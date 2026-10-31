// Card for one MLS® feed listing. Values are shown as delivered by PropTx.
// The listing brokerage uses the same font and size as the other details (IDX/VOW §6.3(c)).
export function feedPrice(n) {
  return n ? `$${Number(n).toLocaleString('en-US')}` : '';
}

export function bedsLabel(l) {
  if (l.bedsAbove != null && l.bedsBelow) return `${l.bedsAbove}+${l.bedsBelow}`;
  return l.beds ?? l.bedsAbove ?? null;
}

export function MlsSpecs({ l, m }) {
  const beds = bedsLabel(l);
  return (
    <div className="mls-specs" dir="ltr">
      {beds ? <span><b>{beds}</b> {m.bd}</span> : null}
      {l.baths ? <span><b>{l.baths}</b> {m.ba}</span> : null}
      {l.parking ? <span><b>{l.parking}</b> {m.pk}</span> : null}
      {l.sqft ? <span><b>{l.sqft}</b> {m.sqft}</span> : null}
    </div>
  );
}

// estHref: link to the instant estimate for this home, prefilled. Sits under the card (not inside its link).
export default function MlsCard({ l, m, lang, estHref, estLabel }) {
  const place = [l.community, l.city].filter(Boolean).join(', ');
  const card = (
    <a className="card mls-card" href={`/${lang}/mls/${encodeURIComponent(l.key)}`}>
      <div className="ph">
        {l.photo ? <img src={l.photo} alt={l.address || place} loading="lazy" /> : <span className="noimg">{l.subtype}</span>}
        <span className="tag">{l.lease ? m.lease : m.sale}</span>
      </div>
      <div className="body mls-body">
        <div className="price" dir="ltr">
          {feedPrice(l.price)}
          {l.lease && <small> {m.perMonth}</small>}
        </div>
        <div className="mls-line" dir="ltr">{l.address || place}</div>
        <div className="mls-line" dir="ltr">{[l.subtype, l.address ? place : null].filter(Boolean).join(' · ')}</div>
        <MlsSpecs l={l} m={m} />
        <div className="mls-line">
          {m.brokerage}: <span dir="ltr">{l.brokerage}</span>
        </div>
      </div>
    </a>
  );
  if (!estHref) return card;
  return (
    <div className="mls-cell">
      {card}
      <a className="mls-est" href={estHref}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V9m6 10V5m6 14v-7m4 7H2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        <span>{estLabel}</span>
        <span aria-hidden="true" className="arr">{lang === 'fa' ? '←' : '→'}</span>
      </a>
    </div>
  );
}

export function MlsDisclaimer({ m }) {
  return (
    <div className="mls-disclaimer">
      <p>{m.disclaimer}</p>
      {m.disclaimerEn && <p lang="en" dir="ltr">{m.disclaimerEn}</p>}
    </div>
  );
}
