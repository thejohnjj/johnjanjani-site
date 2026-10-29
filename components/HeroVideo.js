'use client';

import { useEffect, useRef, useState } from 'react';
import { AREAS, TYPE_KEYS, PRICES_SALE, PRICES_LEASE, shortPrice } from '@/lib/mls-options';
import { digits } from '@/lib/format';
import { mlsT } from '@/lib/i18n-mls';

const toLatin = (s) => String(s || '').replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

function searchUrl(lang, f) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v && !(k === 'deal' && v === 'sale')) p.set(k, v);
  const s = p.toString();
  return `/${lang}/search${s ? `?${s}` : ''}`;
}

// Opening screen: a looping clip from John's own home tours behind a portal-style search.
export default function HeroVideo({ t, lang, stats }) {
  const h = t.hv;
  const types = mlsT(lang).types;
  const video = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [shown, setShown] = useState(false);
  const [tab, setTab] = useState('sale');
  const [more, setMore] = useState(false);
  const [f, setF] = useState({ q: '', type: '', max: '', min: '', beds: '', baths: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const prices = tab === 'lease' ? PRICES_LEASE : PRICES_SALE;

  // Picks the wide or tall clip for the screen, skips video for reduced-motion or data-saver visitors.
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saver = navigator.connection && navigator.connection.saveData;
    if (reduce || saver) {
      setPlaying(false);
      return;
    }
    const tall = window.matchMedia('(max-aspect-ratio: 4/5)').matches;
    v.src = tall ? '/video/hero-tall.mp4' : '/video/hero-wide.mp4';
    v.play().catch(() => setPlaying(false));
    const onVis = () => (document.hidden ? v.pause() : playing && v.play().catch(() => {}));
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle() {
    const v = video.current;
    if (!v) return;
    if (v.paused) {
      if (!v.src) v.src = window.matchMedia('(max-aspect-ratio: 4/5)').matches ? '/video/hero-tall.mp4' : '/video/hero-wide.mp4';
      v.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  function submit(e) {
    e.preventDefault();
    const q = toLatin(f.q).trim().replace(/^#/, '');
    if (/^\d{1,4}$/.test(q)) {
      window.location.href = `/${lang}/c/${encodeURIComponent(q)}`;
      return;
    }
    const typedArea = AREAS.find((a) => a.toLowerCase() === q.toLowerCase());
    window.location.href = searchUrl(lang, {
      deal: tab,
      ...(typedArea ? { area: typedArea } : { q: q.slice(0, 40) }),
      type: f.type, min: f.min, max: f.max, beds: f.beds, baths: f.baths,
    });
  }

  function pickTab(next) {
    setTab(next);
    setF({ ...f, min: '', max: '' });
  }

  return (
    <section className="hv" aria-label={h.eyebrow}>
      <div className="hv-media" aria-hidden="true">
        <picture>
          <source media="(max-aspect-ratio: 4/5)" srcSet="/video/hero-tall.jpg" />
          <img src="/video/hero-wide.jpg" alt="" fetchPriority="high" />
        </picture>
        <video ref={video} muted loop playsInline preload="none" className={shown ? 'on' : ''} onPlaying={() => setShown(true)} />
      </div>
      <div className="hv-shade" aria-hidden="true" />

      <div className="wrap hv-inner">
        <div className="hv-agent">
          <img src="/images/john.jpg" alt="" width="48" height="48" />
          <div>
            <b>{lang === 'fa' ? 'پوریا جان جانی' : 'Purya (John) Janjani'}</b>
            <span>{t.heroAgentRole}</span>
          </div>
        </div>
        <div className="hv-eyebrow">{h.eyebrow}</div>
        <h1>
          {t.heroTitleA}
          <em>{t.heroTitleEm}</em>
          {t.heroTitleB}
          {t.heroTitleEm2 && <em>{t.heroTitleEm2}</em>}
          {t.heroTitleC}
        </h1>
        <p className="hv-lead">{h.lead}</p>

        <div className="hv-card">
          <div className="hv-tabs" role="tablist">
            {[['sale', h.buy], ['lease', h.rent], ['sell', h.sell]].map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => pickTab(k)}>{label}</button>
            ))}
          </div>

          {tab === 'sell' ? (
            <div className="hv-sell">
              <div>
                <b>{h.sellTitle}</b>
                <span>{h.sellText}</span>
              </div>
              <a className="btn btn-accent" href={`/${lang}/home-value`}>{h.sellGo}</a>
            </div>
          ) : (
            <form className="hv-form" onSubmit={submit} role="search">
              <div className="hv-bar">
                <label className="hv-seg hv-where">
                  <span>{h.where}</span>
                  <input type="search" list="hv-areas" autoComplete="off" dir="auto" placeholder={h.wherePh} value={f.q} onChange={set('q')} />
                  <datalist id="hv-areas">
                    {AREAS.map((a) => <option key={a} value={a} />)}
                  </datalist>
                </label>
                <label className="hv-seg">
                  <span>{h.type}</span>
                  <select value={f.type} onChange={set('type')}>
                    <option value="">{h.anyType}</option>
                    {TYPE_KEYS.map((k) => <option key={k} value={k}>{types[k]}</option>)}
                  </select>
                </label>
                <label className="hv-seg">
                  <span>{h.price}</span>
                  <select value={f.max} onChange={set('max')}>
                    <option value="">{h.anyPrice}</option>
                    {prices.map((p) => <option key={p} value={p}>{shortPrice(p)}</option>)}
                  </select>
                </label>
                <label className="hv-seg hv-small">
                  <span>{h.beds}</span>
                  <select value={f.beds} onChange={set('beds')}>
                    <option value="">{h.any}</option>
                    {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}
                  </select>
                </label>
                <button className="btn btn-accent hv-go" type="submit">
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2.2" /><path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
                  <span>{h.go}</span>
                </button>
              </div>
              {more && (
                <div className="hv-more">
                  <label className="hv-seg">
                    <span>{h.minPrice}</span>
                    <select value={f.min} onChange={set('min')}>
                      <option value="">{h.noMin}</option>
                      {prices.map((p) => <option key={p} value={p}>{shortPrice(p)}</option>)}
                    </select>
                  </label>
                  <label className="hv-seg">
                    <span>{h.baths}</span>
                    <select value={f.baths} onChange={set('baths')}>
                      <option value="">{h.any}</option>
                      {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}+</option>)}
                    </select>
                  </label>
                </div>
              )}
              <div className="hv-under">
                <button type="button" className="hv-morebtn" aria-expanded={more} onClick={() => setMore(!more)}>{more ? h.less : h.more}</button>
              </div>
            </form>
          )}
        </div>

        <div className="hv-chips">
          <span>{h.popular}</span>
          {h.chips.map(([label, q]) => (
            <a key={label} href={searchUrl(lang, q)}>{label}</a>
          ))}
        </div>
      </div>

      <div className="hv-trust">
        <div className="wrap">
          <ul>
            {stats.reviews > 0 && (
              <li><b className="star" aria-hidden="true">★</b> {h.reviews.replace('{r}', digits(stats.rating, lang)).replace('{n}', digits(stats.reviews, lang))}</li>
            )}
            <li>{h.years}</li>
            <li>{h.langs}</li>
            {stats.toured > 0 && <li><a href="#listings">{h.toured.replace('{n}', digits(stats.toured, lang))}</a></li>}
            <li className="c21"><img src="/images/c21.png" alt="" width="22" height="22" /> {h.brokerage}</li>
          </ul>
          <button type="button" className="hv-pause" onClick={toggle} aria-label={playing ? h.pause : h.play}>
            {playing ? (
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
