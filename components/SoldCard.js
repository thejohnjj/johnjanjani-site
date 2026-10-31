// Sold-data display pieces for the members-only area. Values are shown as delivered by the feed;
// the only numbers we add are plain arithmetic (percent of asking, medians).
import { feedPrice, MlsSpecs } from '@/components/MlsCard';

const fill = (s, map) => Object.entries(map).reduce((acc, [k, v]) => acc.split(`{${k}}`).join(v), s);

export function SoldBadge({ l, s }) {
  return <span className={`tag sold-tag${l.lease ? ' leased' : ''}`}>{l.lease ? s.lease : s.sale}</span>;
}

export function SoldPriceBlock({ l, s, m, big = false }) {
  return (
    <div className={`sold-price${big ? ' big' : ''}`}>
      <div className="sp-main">
        <span className="sp-label">{l.lease ? s.leasedFor : s.soldFor}</span>
        {l.soldPrice ? (
          <b dir="ltr">{feedPrice(l.soldPrice)}{l.lease && <small> {m.perMonth}</small>}</b>
        ) : (
          <b className="sp-held">{s.held}</b>
        )}
      </div>
      <div className="sp-sub" dir="auto">
        {l.listPrice ? <span>{s.listedAt} <span dir="ltr">{feedPrice(l.listPrice)}</span></span> : null}
        {l.ratio ? <span className={l.ratio >= 100 ? 'up' : 'down'}>{fill(s.ofAsking, { r: l.ratio })}</span> : null}
      </div>
      <div className="sp-sub">
        {l.soldDate ? <span>{fill(l.lease ? s.leasedOn : s.soldOn, { d: l.soldDate })}</span> : null}
        {Number.isFinite(l.dom) ? <span>{fill(s.inDays, { n: l.dom })}</span> : null}
      </div>
    </div>
  );
}

export default function SoldCard({ l, s, m, lang }) {
  const place = [l.community, l.city].filter(Boolean).join(', ');
  return (
    <a className="card mls-card sold-card" href={`/${lang}/mls/${encodeURIComponent(l.key)}`}>
      <div className="ph">
        {l.photo ? <img src={l.photo} alt={l.address || place} loading="lazy" /> : <span className="noimg">{l.subtype}</span>}
        <SoldBadge l={l} s={s} />
      </div>
      <div className="body mls-body">
        <SoldPriceBlock l={l} s={s} m={m} />
        <div className="mls-line" dir="ltr">{l.address || place}</div>
        <div className="mls-line" dir="ltr">{[l.subtype, l.address ? place : null].filter(Boolean).join(' · ')}</div>
        <MlsSpecs l={l} m={m} />
        <div className="mls-line">{m.brokerage}: <span dir="ltr">{l.brokerage}</span></div>
      </div>
    </a>
  );
}

export function Snapshot({ snap, s, lang, where, typeLabel }) {
  if (!snap) return null;
  const n = (x) => Number(x).toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US');
  const title = [typeLabel, where].filter(Boolean).join(' · ');
  if (!snap.enough) return <div className="snap thin"><b>{s.snapTitle}</b> <span>{s.snapThin}</span></div>;
  return (
    <section className="snap" aria-label={s.snapTitle}>
      <div className="snap-head">
        <b>{s.snapTitle}</b>
        <span>{fill(s.snapSub, { t: title, m: n(snap.months), n: n(snap.count) })}</span>
      </div>
      <div className="snap-grid">
        <div><span>{s.median}</span><b dir="ltr">{feedPrice(snap.median)}</b></div>
        <div><span>{s.range}</span><b dir="ltr">{feedPrice(snap.low)} – {feedPrice(snap.high)}</b></div>
        {snap.ratio != null && <div><span>{s.ratio}</span><b dir="ltr">{snap.ratio}%</b></div>}
        {snap.overAsking != null && <div><span>{s.over}</span><b dir="ltr">{snap.overAsking}%</b></div>}
        {snap.dom != null && <div><span>{s.dom}</span><b dir="ltr">{snap.dom}</b></div>}
      </div>
    </section>
  );
}

export function History({ items, changes, s, currentKey, lang }) {
  return (
    <section className="history">
      <div className="eyebrow" style={{ marginBottom: 10 }}>{s.historyTitle}</div>
      {!items.length && <p className="mls-line">{s.historyNone}</p>}
      <ol>
        {items.map((h) => (
          <li key={h.key} className={h.key === currentKey ? 'current' : ''}>
            <div className="h-status"><b>{s.status[h.status] || h.status}</b>{h.ended ? <span dir="ltr"> {h.ended}</span> : null}</div>
            <div className="h-line">
              {h.listed && fill(s.listedLine, { d: h.listed, p: '' })}
              <span dir="ltr">{feedPrice(h.originalPrice)}</span>
              {h.listPrice && h.originalPrice && h.listPrice !== h.originalPrice ? <> → <span dir="ltr">{feedPrice(h.listPrice)}</span></> : null}
              {h.soldPrice ? <> · {fill(s.soldLine, { p: '' })}<b dir="ltr">{feedPrice(h.soldPrice)}</b></> : null}
              {Number.isFinite(h.dom) ? <> · {fill(s.inDays, { n: h.dom })}</> : null}
            </div>
            {h.key !== currentKey && <a href={`/${lang}/mls/${encodeURIComponent(h.key)}`} className="h-link" dir="ltr">MLS® {h.key}</a>}
          </li>
        ))}
      </ol>
      {changes?.length > 0 && (
        <div className="h-changes">
          <span>{s.priceChanges}:</span>
          {changes.map((c) => (
            <span key={c.date + c.to} dir="ltr">{c.date}: {feedPrice(c.from)} → {feedPrice(c.to)}</span>
          ))}
        </div>
      )}
    </section>
  );
}

export function VowCopyright({ s }) {
  return <p className="vow-copy" lang="en" dir="ltr">{s.copyright.replace('{y}', String(new Date().getFullYear()))}</p>;
}
