'use client';

import { useState } from 'react';
import ListingCard from './ListingCard';
import { JoinButton } from './Membership';

// Turns Persian/Arabic digits into 0-9 so codes typed on a Farsi keyboard still match.
const toLatin = (s) => s.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

export default function ListingsGrid({ listings, t, lang, isMember }) {
  const [filter, setFilter] = useState('all');
  const [code, setCode] = useState('');
  const [codeMsg, setCodeMsg] = useState('');
  const norm = (c) => toLatin(String(c || '')).trim().replace(/^#/, '').toLowerCase();
  function findCode(e) {
    e.preventDefault();
    const c = norm(code);
    if (!c) return;
    const hit = listings.find((l) => norm(l.code) === c);
    if (hit) window.location.href = `/${lang}/listings/${hit.slug}`;
    else setCodeMsg(t.codeNotFound.replace('{c}', code));
  }
  const shown = listings.filter((l) => {
    if (filter === 'all') return true;
    if (filter === 'rent') return l.status === 'rent';
    if (filter === 'house') return l.status === 'sale' && (l.kind === 'house' || l.kind === 'townhouse');
    return l.status === 'sale' && l.kind === filter;
  });

  return (
    <>
      <div className="sec-head">
        <div>
          <div className="eyebrow">{t.listEyebrow}</div>
          <h2>{t.listTitle}</h2>
        </div>
        {listings.length > 0 && (
          <div className="chips" role="group" aria-label={t.nav.listings}>
            {['all', 'house', 'condo', 'rent'].map((f) => (
              <button key={f} type="button" className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                {t.filters[f]}
              </button>
            ))}
          </div>
        )}
      </div>
      {listings.some((l) => l.code) && (
        <form className="codefind" onSubmit={findCode}>
          <label htmlFor="codefind">{t.findCode}</label>
          <div>
            <input id="codefind" inputMode="numeric" autoComplete="off" placeholder={t.findCodePh} value={code} onChange={(e) => { setCode(e.target.value); setCodeMsg(''); }} dir="ltr" />
            <button type="submit" className="btn btn-accent">{t.findCodeGo}</button>
          </div>
          {codeMsg && <p role="alert">{codeMsg}</p>}
        </form>
      )}
      {!isMember && (
        <div className="banner">
          <p>
            <strong>{t.bannerTitle}</strong>
            <br />
            <span>{t.bannerText}</span>
          </p>
          <JoinButton className="btn btn-ink" label={t.join} />
        </div>
      )}
      {listings.length === 0 ? (
        <div className="empty">
          <h3>{t.emptyTitle}</h3>
          <p>{t.emptyText}</p>
        </div>
      ) : (
        <div className="grid">
          {shown.map((l) => (
            <ListingCard key={l.id} l={l} t={t} lang={lang} />
          ))}
        </div>
      )}
    </>
  );
}
