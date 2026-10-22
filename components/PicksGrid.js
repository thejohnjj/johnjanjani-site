'use client';

import { useState } from 'react';
import ListingCard from './ListingCard';
import { digits } from '@/lib/format';

const STEP = 9;
// "Richmond Hill (South Richvale)" → "Richmond Hill", so each city gets one tab.
const cityOf = (p, lang) => p.city[lang].replace(/\s*[(（].*$/, '').trim();

// Daily picks with area tabs; areas come from the picks themselves, busiest first.
export default function PicksGrid({ picks, t, lang, preview = false, heading = 'h2' }) {
  const H = heading;
  const [area, setArea] = useState('all');
  const [limit, setLimit] = useState(preview ? 3 : STEP);
  const counts = {};
  for (const p of picks) counts[cityOf(p, lang)] = (counts[cityOf(p, lang)] || 0) + 1;
  const areas = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b, lang));
  const shown = picks.filter((p) => area === 'all' || cityOf(p, lang) === area);

  return (
    <>
      <div className="sec-head">
        <div>
          <div className="eyebrow">{t.pkEyebrow}</div>
          <H>{t.pkTitle}</H>
          <p className="sec-lead">{t.pkLead}</p>
        </div>
      </div>
      {!preview && areas.length > 1 && (
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
      {preview && picks.length > limit && (
        <div className="more">
          <a className="btn btn-accent" href={`/${lang}/picks`}>{t.pkSeeAll.replace('{n}', digits(picks.length, lang))} <span aria-hidden="true">{lang === 'fa' ? '←' : '→'}</span></a>
        </div>
      )}
      {!preview && shown.length > limit && (
        <div className="more">
          <button type="button" className="btn btn-ghost-ink" onClick={() => setLimit(limit + STEP)}>{t.pkMore}</button>
        </div>
      )}
    </>
  );
}
