'use client';

import { useState } from 'react';
import ListingCard from './ListingCard';

const STEP = 6;

// Daily picks with area tabs; areas come from the picks themselves, busiest first.
export default function PicksGrid({ picks, t, lang }) {
  const [area, setArea] = useState('all');
  const [limit, setLimit] = useState(STEP);
  const counts = {};
  for (const p of picks) counts[p.city[lang]] = (counts[p.city[lang]] || 0) + 1;
  const areas = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b, lang));
  const shown = picks.filter((p) => area === 'all' || p.city[lang] === area);

  return (
    <>
      <div className="sec-head">
        <div>
          <div className="eyebrow">{t.pkEyebrow}</div>
          <h2>{t.pkTitle}</h2>
          <p className="sec-lead">{t.pkLead}</p>
        </div>
      </div>
      {areas.length > 1 && (
        <div className="chips area-tabs" role="group" aria-label={t.pkAll}>
          {['all', ...areas].map((a) => (
            <button key={a} type="button" className="chip" aria-pressed={area === a} onClick={() => { setArea(a); setLimit(STEP); }}>
              {a === 'all' ? t.pkAll : a}
            </button>
          ))}
        </div>
      )}
      <div className="grid">
        {shown.slice(0, limit).map((l) => (
          <ListingCard key={l.id} l={l} t={t} lang={lang} />
        ))}
      </div>
      {shown.length > limit && (
        <div className="more">
          <button type="button" className="btn btn-ghost-ink" onClick={() => setLimit(limit + STEP)}>{t.pkMore}</button>
        </div>
      )}
    </>
  );
}
