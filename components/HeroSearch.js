'use client';

import { useState } from 'react';
import { mlsT } from '@/lib/i18n-mls';
import { AREAS, TYPE_KEYS, PRICES_SALE, PRICES_LEASE, shortPrice } from '@/lib/mls-options';

const toLatin = (s) => String(s || '').replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

// Homepage search with all main filters. A short number in the text box is a home code
// from Instagram and opens that toured home (/c/60).
export default function HeroSearch({ lang, t, onFocus, onBlur }) {
  const m = mlsT(lang);
  const [deal, setDeal] = useState('sale');
  const [v, setV] = useState({ q: '', area: '', type: '', min: '', max: '', beds: '', baths: '' });
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const prices = deal === 'lease' ? PRICES_LEASE : PRICES_SALE;

  function submit(e) {
    e.preventDefault();
    const q = toLatin(v.q).trim().replace(/^#/, '');
    if (/^\d{1,4}$/.test(q)) {
      window.location.href = `/${lang}/c/${encodeURIComponent(q)}`;
      return;
    }
    const p = new URLSearchParams();
    if (deal === 'lease') p.set('deal', 'lease');
    if (q) p.set('q', q.slice(0, 40));
    for (const k of ['area', 'type', 'min', 'max', 'beds', 'baths']) if (v[k]) p.set(k, v[k]);
    const s = p.toString();
    window.location.href = `/${lang}/search${s ? `?${s}` : ''}`;
  }

  function switchDeal(d) {
    setDeal(d);
    setV({ ...v, min: '', max: '' });
  }

  return (
    <form className="h2-code h2-search" onSubmit={submit} role="search" onFocus={onFocus} onBlur={onBlur}>
      <div className="h2-top">
        <span className="h2-label">{t.heroSearchLabel}</span>
        <div className="h2-deal" role="radiogroup">
          <button type="button" aria-pressed={deal === 'sale'} onClick={() => switchDeal('sale')}>{t.heroBuy}</button>
          <button type="button" aria-pressed={deal === 'lease'} onClick={() => switchDeal('lease')}>{t.heroRent}</button>
        </div>
      </div>
      <div className="h2-row">
        <input aria-label={m.keyword} type="search" autoComplete="off" dir="auto" placeholder={t.heroSearchPh} value={v.q} onChange={set('q')} />
      </div>
      <div className="h2-grid">
        <select aria-label={m.area} value={v.area} onChange={set('area')}>
          <option value="">{m.area}: {m.anyArea}</option>
          {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select aria-label={m.type} value={v.type} onChange={set('type')}>
          <option value="">{m.type}: {m.anyType}</option>
          {TYPE_KEYS.map((k) => <option key={k} value={k}>{m.types[k]}</option>)}
        </select>
        <select aria-label={m.minPrice} value={v.min} onChange={set('min')}>
          <option value="">{m.minPrice}</option>
          {prices.map((p) => <option key={p} value={p}>{shortPrice(p)}</option>)}
        </select>
        <select aria-label={m.maxPrice} value={v.max} onChange={set('max')}>
          <option value="">{m.maxPrice}</option>
          {prices.map((p) => <option key={p} value={p}>{shortPrice(p)}</option>)}
        </select>
        <select aria-label={m.beds} value={v.beds} onChange={set('beds')}>
          <option value="">{m.beds}: {m.any}</option>
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+ {m.beds}</option>)}
        </select>
        <select aria-label={m.baths} value={v.baths} onChange={set('baths')}>
          <option value="">{m.baths}: {m.any}</option>
          {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}+ {m.baths}</option>)}
        </select>
      </div>
      <button type="submit" className="btn btn-accent h2-go">{t.heroSearchGo}</button>
    </form>
  );
}
