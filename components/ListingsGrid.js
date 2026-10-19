'use client';

import { useState } from 'react';
import ListingCard from './ListingCard';
import { JoinButton } from './Membership';

export default function ListingsGrid({ listings, t, lang, isMember }) {
  const [filter, setFilter] = useState('all');
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
