'use client';

import { useEffect, useRef, useState } from 'react';
import { preconnect } from 'react-dom';
import { digits } from '@/lib/format';
import 'maplibre-gl/dist/maplibre-gl.css';
import 'mapbox-gl/dist/mapbox-gl.css';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const HOLD = 4800; // time spent at each home
const ZOOM = 14.7; // camera height while touring
const PITCH = 60;
const toLatin = (s) => s.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

// Repaints the OpenFreeMap street style in the brand's night teal, with orange highways
// and lit 3D buildings, and hides the clutter (shops, shields, one-way arrows).
function brandStyle(style) {
  const C = { bg: '#0A3338', land: '#0D3A40', park: '#11473C', water: '#04232C', minor: '#2B6369', mid: '#3F8086', major: '#D8C9A0', hwy: '#E07A3F', bld: '#164A50', bld3d: '#22656C', label: '#D8C9A0', halo: '#072F33' };
  style.layers = style.layers
    .filter((l) => !/^poi|shield|one_way|aeroway|hatching|tunnel_|sand|ice|road_area_pattern|pitch|track/.test(l.id))
    .map((l) => {
      const p = { ...(l.paint || {}) };
      const id = l.id;
      if (l.type === 'background') p['background-color'] = C.bg;
      else if (l.type === 'raster') p['raster-opacity'] = 0.15;
      else if (l.type === 'fill') {
        if (id === 'water') p['fill-color'] = C.water;
        else if (/park|wood|grass|wetland/.test(id)) { p['fill-color'] = C.park; p['fill-opacity'] = 0.9; }
        else if (id === 'building') { p['fill-color'] = C.bld; delete p['fill-outline-color']; }
        else { p['fill-color'] = C.land; p['fill-opacity'] = 0.8; delete p['fill-pattern']; }
      } else if (l.type === 'fill-extrusion') {
        p['fill-extrusion-color'] = ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 0], 0, C.bld3d, 20, '#2F7A82', 60, '#4B989E', 150, '#6DB3B6'];
        p['fill-extrusion-vertical-gradient'] = true;
        p['fill-extrusion-opacity'] = 0.92;
      } else if (l.type === 'line') {
        if (/casing|outline/.test(id)) p['line-opacity'] = 0;
        else if (/waterway/.test(id)) p['line-color'] = C.water;
        else if (/motorway/.test(id)) { p['line-color'] = C.hwy; p['line-opacity'] = 0.85; }
        else if (/trunk_primary/.test(id)) { p['line-color'] = C.major; p['line-opacity'] = 0.55; }
        else if (/secondary_tertiary/.test(id)) p['line-color'] = C.mid;
        else if (/rail/.test(id)) { p['line-color'] = '#2A5E64'; p['line-opacity'] = 0.6; }
        else if (/boundary/.test(id)) { p['line-color'] = '#3D6E72'; p['line-opacity'] = 0.6; }
        else p['line-color'] = C.minor;
      } else if (l.type === 'symbol') {
        p['text-color'] = /label_city|label_town/.test(id) ? '#F6F1E7' : C.label;
        p['text-halo-color'] = C.halo;
        p['text-halo-width'] = 1.4;
      }
      return { ...l, paint: p };
    });
  return style;
}

// Homepage opening (map version): a camera flies over the real GTA streets in 3D and
// stops at each home John toured, showing its photo and code.
export default function HeroMap({ points, t, lang, mapboxToken = '', look = 'standard' }) {
  const box = useRef(null);
  const onScreen = useRef(true);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(-1);
  const [code, setCode] = useState('');
  const [usingMapbox, setUsingMapbox] = useState(Boolean(mapboxToken));
  const tours = points.filter((p) => p.code);
  const first = tours[0] || points[0];
  const sep = lang === 'fa' ? ' | ' : ' · ';
  // Open the connection to the map servers while the page is still loading.
  if (mapboxToken) { preconnect('https://api.mapbox.com', { crossOrigin: 'anonymous' }); }

  useEffect(() => {
    let map;
    let stop = false;
    let timer;
    const markers = [];
    // Only fly while the opening is on screen, so the map isn't downloading for nobody.
    const io = new IntersectionObserver(([e]) => { onScreen.current = e.isIntersecting; }, { threshold: 0.25 });
    if (box.current) io.observe(box.current);
    (async () => {
      const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      // Start close to the first home, so the first flight is short and needs fewer map tiles.
      const f0 = tours[0] || points[0];
      const start = { center: f0 ? [f0.lng, f0.lat] : [-79.43, 43.86], zoom: f0 ? ZOOM : 12.5, pitch: PITCH, bearing: -30, interactive: false };
      const dpr = window.devicePixelRatio || 1;
      const sharp = Math.min(dpr, window.innerWidth < 760 ? 1.5 : 2);
      let maplibregl;
      let styleReady = false;
      // Free fallback: OpenFreeMap streets repainted in the brand colours.
      const freeMap = async () => {
        maplibregl = (await import('maplibre-gl')).default;
        const style = brandStyle(await (await fetch(STYLE_URL)).json());
        if (stop || !box.current) return null;
        return new maplibregl.Map({ container: box.current, style, ...start, pixelRatio: sharp, attributionControl: false, fadeDuration: 0 });
      };
      if (mapboxToken) {
        // High-quality Mapbox map: realistic 3D buildings, trees and dusk lighting, or satellite photos.
        maplibregl = (await import('mapbox-gl')).default;
        maplibregl.accessToken = mapboxToken;
        if (stop || !box.current) return;
        const mb = new maplibregl.Map({
          container: box.current,
          style: look === 'satellite' ? 'mapbox://styles/mapbox/standard-satellite' : 'mapbox://styles/mapbox/standard',
          config: { basemap: { lightPreset: look === 'standard' ? 'dusk' : 'day', showPointOfInterestLabels: false, showTransitLabels: false } },
          ...start,
          pixelRatio: sharp,
          antialias: false,
          attributionControl: true,
          logoPosition: lang === 'fa' ? 'bottom-left' : 'bottom-right',
        });
        // If Mapbox refuses (free views used up, bad token), switch to the free map instead.
        map = await new Promise((resolve) => {
          let settled = false;
          mb.once('style.load', () => { if (!settled) { settled = true; styleReady = true; resolve(mb); } });
          mb.on('error', (e) => {
            const st = e?.error?.status;
            if (!settled && (st === 401 || st === 403 || st === 429 || !mb.isStyleLoaded())) {
              settled = true;
              try { mb.remove(); } catch {}
              setUsingMapbox(false);
              freeMap().then(resolve);
            }
          });
          setTimeout(() => { if (!settled) { settled = true; try { mb.remove(); } catch {} setUsingMapbox(false); freeMap().then(resolve); } }, 12000);
        });
        if (!map || stop) return;
      } else {
        map = await freeMap();
        if (!map) return;
      }
      points.forEach((p, k) => {
        const el = document.createElement('a');
        el.href = p.href;
        el.className = p.code ? 'hm-pin tour' : 'hm-pin pick';
        el.setAttribute('aria-label', p.code ? `${t.code} ${p.code}` : p.type);
        // Styling lives on the inner span: MapLibre positions the outer element with transform.
        el.innerHTML = p.code ? `<span class="hm-tag">${digits(p.code, lang)}</span>` : '<span class="hm-dot"></span>';
        markers.push(new maplibregl.Marker({ element: el, anchor: p.code ? 'bottom' : 'center' }).setLngLat([p.lng, p.lat]).addTo(map));
        p._el = el;
      });
      // Aim the camera at the open part of the screen, clear of the text and the card.
      const pad = () => {
        const host = box.current;
        const w = host?.clientWidth || 1200;
        const h = host?.clientHeight || 800;
        const top0 = host?.getBoundingClientRect().top || 0;
        const copy = host?.closest('.heromap')?.querySelector('.h2-copy')?.getBoundingClientRect();
        const foot = host?.closest('.heromap')?.querySelector('.h2-foot')?.getBoundingClientRect();
        if (w < 760) {
          const top = copy ? Math.min(copy.bottom - top0 + 20, h * 0.6) : 60;
          const bottom = foot ? Math.max(h - (foot.top - top0) + 20, 40) : h * 0.3;
          return { top, bottom: Math.min(bottom, h - top - 80), left: 20, right: 20 };
        }
        const side = copy ? Math.min(lang === 'fa' ? w - (copy.left) + 40 : copy.right + 40, w * 0.6) : w * 0.5;
        return lang === 'fa' ? { left: 40, right: side, top: 80, bottom: 140 } : { left: side, right: 40, top: 80, bottom: 140 };
      };
      const arrive = (k) => {
        setActive(k);
        tours.forEach((x) => x._el?.classList.remove('on'));
        tours[k]._el?.classList.add('on');
      };
      const onReady = () => {
        if (stop) return;
        setReady(true);
        if (!tours.length) return;
        arrive(0);
        if (still) return;
        let i = 0;
        // Slow orbit at the current home, then glide (same height) to the next one.
        const orbit = () => {
          if (stop) return;
          map.easeTo({ bearing: map.getBearing() + 24, duration: HOLD, easing: (x) => x });
          timer = setTimeout(next, HOLD);
        };
        const next = () => {
          if (stop) return;
          if (document.hidden || !onScreen.current) { timer = setTimeout(next, 1000); return; }
          i += 1;
          if (i >= tours.length) {
            // One full tour, then rest on an overview of every pin (no more downloading).
            setActive(-1);
            tours.forEach((x) => x._el?.classList.remove('on'));
            const b = new maplibregl.LngLatBounds();
            points.forEach((x) => b.extend([x.lng, x.lat]));
            map.fitBounds(b, { padding: pad(), pitch: 45, bearing: -15, duration: 4500, maxZoom: 13.5 });
            return;
          }
          const p = tours[i];
          const from = map.getCenter();
          const km = Math.hypot((p.lat - from.lat) * 111, (p.lng - from.lng) * 80);
          setActive(-1);
          map.easeTo({ center: [p.lng, p.lat], zoom: ZOOM, pitch: PITCH, bearing: map.getBearing() + 30, padding: pad(), duration: Math.min(7000, Math.max(3200, km * 900)), easing: (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2) });
          map.once('moveend', () => { if (!stop) { arrive(i); orbit(); } });
        };
        timer = setTimeout(orbit, 400);
      };
      // Put the camera on the newest home right away, and fade the map in once that view is
      // fully drawn (at most 5 s), so visitors never see a half-drawn map.
      if (f0) map.jumpTo({ center: [f0.lng, f0.lat], zoom: ZOOM, pitch: PITCH, bearing: -30, padding: pad() });
      let fired = false;
      const go = () => { if (!fired) { fired = true; onReady(); } };
      map.once('idle', go);
      setTimeout(go, 5000);
    })().catch(() => {});
    return () => {
      stop = true;
      io.disconnect();
      clearTimeout(timer);
      markers.forEach((m) => m.remove());
      map?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function find(e) {
    e.preventDefault();
    const c = toLatin(code).trim().replace(/^#/, '');
    if (c) window.location.href = `/${lang}/c/${encodeURIComponent(c)}`;
  }

  const s = active >= 0 ? tours[active] : null;
  return (
    <section className={`hero2 heromap${ready ? ' is-ready' : ''}`} aria-label={t.heroToured}>
      <div className="h2-media" aria-hidden="true">
        {first && <img src={first.img} alt="" className="on hm-poster" fetchPriority="high" />}
        <div ref={box} className="hm-map" />
      </div>
      <div className="h2-shade" aria-hidden="true" />
      <div className="wrap h2-inner">
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
          <form className="h2-code" onSubmit={find}>
            <label htmlFor="hero-code">{t.heroCodeLabel}</label>
            <div>
              <input id="hero-code" inputMode="numeric" autoComplete="off" dir="ltr" placeholder={t.heroCodePh} value={code} onChange={(e) => setCode(e.target.value)} />
              <button type="submit" className="btn btn-accent">{t.findCodeGo}</button>
            </div>
          </form>
        </div>
        <div className="h2-foot">
          <a className={`h2-slide hm-card${s ? ' show' : ''}`} href={s ? s.href : '#listings'} aria-live="polite" tabIndex={s ? 0 : -1}>
            {s && <img src={s.img} alt="" />}
            <span className="hm-txt">
              <span className="k">{t.heroToured}</span>
              <b>{t.code} <span dir="ltr">{s ? digits(s.code, lang) : ''}</span></b>
              <span className="w">{s ? `${s.type}${sep}${s.city}` : ''}</span>
              <span className="v">{t.heroView} <span aria-hidden="true">{lang === 'fa' ? '←' : '→'}</span></span>
            </span>
          </a>
          {!usingMapbox && <span className="hm-credit">© OpenStreetMap · OpenFreeMap</span>}
        </div>
      </div>
    </section>
  );
}
