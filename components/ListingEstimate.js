// "Estimated value of this home" on a listing page, for signed-in sold-prices members.
// Plain statistics from comparable sales (lib/estimate.js); honours seller opt-outs (MLS® rule 8.15).
import { estimateValue, readEstimateInput, listingToParams } from '@/lib/estimate';
import { getSuppressed } from '@/lib/vow-data';
import { feedPrice } from '@/components/MlsCard';

export default async function ListingEstimate({ l, e, lang }) {
  const L = e.listing;
  if ((await getSuppressed()).includes(l.key)) return <div className="lest"><b>{L.title}</b><p className="mls-line">{L.off}</p></div>;
  const params = listingToParams(l);
  if (!params) return null;
  const r = await estimateValue(readEstimateInput(params)).catch(() => null);
  if (!r?.ok) return <div className="lest"><b>{L.title}</b><p className="mls-line">{L.none}</p></div>;
  const asking = l.available ? l.listPrice : null;
  const diff = asking ? Math.round(((asking - r.value) / r.value) * 1000) / 10 : null;
  const cmp = diff == null ? null : Math.abs(diff) < 2 ? L.inline : (diff > 0 ? L.above : L.below).replace('{p}', Math.abs(diff));
  const href = `/${lang}/estimate?${new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '')).toString()}`;
  return (
    <div className="lest">
      <span className="est-label">{l.available ? L.title : L.today}</span>
      <div className="lest-row">
        <b className="lest-v" dir="ltr">{feedPrice(r.value)}</b>
        <span className={`est-conf ${r.confidence}`}>{e.conf[r.confidence]}</span>
      </div>
      <span className="mls-line" dir="ltr">{feedPrice(r.low)} – {feedPrice(r.high)}</span>
      {cmp && <span className={`lest-cmp ${diff > 2 ? 'hi' : diff < -2 ? 'lo' : ''}`}>{cmp}</span>}
      <span className="mls-line">{L.based.replace('{n}', r.count)}</span>
      <a className="btn btn-accent" href={href}>{L.full}</a>
    </div>
  );
}

export function ListingEstimateSkeleton({ e }) {
  return (
    <div className="lest" aria-busy="true">
      <span className="est-label">{e.listing.title}</span>
      <div className="lest-skel" />
    </div>
  );
}
