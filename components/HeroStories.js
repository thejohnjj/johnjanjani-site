'use client';

import { useEffect, useRef, useState } from 'react';
import { heroSearchUrl } from '@/lib/hero-search';
import { digits } from '@/lib/format';

const DURATION = 6500;
// Persian/Arabic digits → 0-9, so codes typed on a Farsi keyboard still work.
const toLatin = (s) => s.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

// Homepage opening: the homes John toured, shown full-screen like Instagram stories,
// with the Instagram code search right on top.
export default function HeroStories({ slides, t, lang }) {
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [still, setStill] = useState(false);
  const [code, setCode] = useState('');
  const [deal, setDeal] = useState('sale');
  const touch = useRef(null);
  const n = slides.length;
  const paused = hold || hidden || still || n < 2;
  const sep = lang === 'fa' ? ' | ' : ' · ';

  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    setStill(m.matches);
    const onVis = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setTimeout(() => setI((x) => (x + 1) % n), DURATION);
    return () => clearTimeout(id);
  }, [i, paused, n]);

  const go = (d) => setI((x) => (x + d + n) % n);
  const fwd = lang === 'fa' ? -1 : 1;

  function find(e) {
    e.preventDefault();
    window.location.href = heroSearchUrl(lang, code, deal);
  }

  const s = slides[i];
  return (
    <section
      className={`hero2${paused ? ' is-paused' : ''}`}
      aria-roledescription="carousel"
      aria-label={t.heroToured}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current == null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        touch.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? fwd : -fwd);
      }}
    >
      <div className="h2-media" aria-hidden="true">
        {slides.map((sl, k) => (
          <img
            key={sl.href}
            src={sl.img}
            alt=""
            className={k === i ? 'on' : ''}
            loading={k === 0 ? 'eager' : 'lazy'}
            fetchPriority={k === 0 ? 'high' : 'auto'}
            decoding="async"
          />
        ))}
      </div>
      <div className="h2-shade" aria-hidden="true" />

      <div className="wrap h2-inner">
        {n > 1 && (
          <div className="h2-bars" aria-hidden="true">
            {slides.map((sl, k) => (
              <span key={sl.href} className={k < i ? 'done' : k === i ? 'now' : ''}>
                <i key={k === i ? `on-${i}` : 'off'} style={{ animationDuration: `${DURATION}ms` }} />
              </span>
            ))}
          </div>
        )}

        <div className="h2-agent">
          <img src="/images/john.jpg" alt="" width="56" height="56" />
          <div>
            <b>{lang === 'fa' ? 'پوریا جان جانی' : 'Purya (John) Janjani'}</b>
            <span>{t.heroAgentRole}</span>
          </div>
        </div>

        <div className="h2-copy">
          <h1>
            {t.heroTitleA}
            <em>{t.heroTitleEm}</em>
            {t.heroTitleB}
            {t.heroTitleEm2 && <em>{t.heroTitleEm2}</em>}
            {t.heroTitleC}
          </h1>
          <p className="lead">{t.heroLead}</p>
          <form className="h2-code h2-search" onSubmit={find} role="search">
            <label htmlFor="hero-code">{t.heroSearchLabel}</label>
            <div className="h2-deal" role="radiogroup">
              <button type="button" aria-pressed={deal === 'sale'} onClick={() => setDeal('sale')}>{t.heroBuy}</button>
              <button type="button" aria-pressed={deal === 'lease'} onClick={() => setDeal('lease')}>{t.heroRent}</button>
            </div>
            <div>
              <input id="hero-code" type="search" autoComplete="off" dir="auto" placeholder={t.heroSearchPh} value={code} onChange={(e) => setCode(e.target.value)} onFocus={() => setHold(true)} onBlur={() => setHold(false)} />
              <button type="submit" className="btn btn-accent">{t.heroSearchGo}</button>
            </div>
          </form>
        </div>

        {s && (
          <div className="h2-foot">
            <a className="h2-slide" href={s.href} aria-live="polite">
              <span className="k">{t.heroToured}</span>
              <b>
                {t.code} <span dir="ltr">{digits(s.code, lang)}</span>
              </b>
              <span className="w">{s.type}{sep}{s.city}</span>
              <span className="v">{t.heroView} <span aria-hidden="true">{lang === 'fa' ? '←' : '→'}</span></span>
            </a>
            {n > 1 && (
              <div className="h2-nav">
                <button type="button" onClick={() => go(-1)} aria-label={t.heroPrev}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
                </button>
                <button type="button" onClick={() => setHold((h) => !h)} aria-label={hold ? t.heroPlay : t.heroPause} aria-pressed={hold}>
                  {hold ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z" className="fill" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5v14M15 5v14" /></svg>
                  )}
                </button>
                <button type="button" onClick={() => go(1)} aria-label={t.heroNext}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
