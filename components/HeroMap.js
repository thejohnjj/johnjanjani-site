'use client';

import { useEffect, useRef, useState } from 'react';
import { digits } from '@/lib/format';
import 'maplibre-gl/dist/maplibre-gl.css';
import 'mapbox-gl/dist/mapbox-gl.css';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const HOLD = 4800; // time spent at each home
const FLY = 5200; // flight between homes
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
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(-1);
  const [code, setCode] = useState('');
  const tours = points.filter((p) => p.code);
  const first = tours[0] || points[0];
  const sep = lang === 'fa' ? ' | ' : ' · ';

  useEffect(() => {
    let map;
    let stop = false;
    let timer;
    const markers = [];
    (async () => {
      const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const start = { center: [-79.43, 43.76], zoom: 10.3, pitch: 35, bearing: -12, interactive: false };
      let maplibregl;
      if (mapboxToken) {
        // High-quality Mapbox map: realistic 3D buildings, trees and dusk lighting, or satellite photos.
        maplibregl = (await import('mapbox-gl')).default;
        maplibregl.accessToken = mapboxToken;
        if (stop || !box.current) return;
        map = new maplibregl.Map({
          container: box.current,
          style: look === 'satellite' ? 'mapbox://styles/mapbox/standard-satellite' : 'mapbox://styles/mapbox/standard',
          config: { basemap: { lightPreset: look === 'day' ? 'day' : 'dusk', showPointOfInterestLabels: false, showTransitLabels: false } },
          ...start,
          attributionControl: true,
          logoPosition: lang === 'fa' ? 'bottom-left' : 'bottom-right',
        });
      } else {
        // Free fallback: OpenFreeMap streets repainted in the brand colours.
        maplibregl = (await import('maplibre-gl')).default;
        const style = brandStyle(await (await fetch(STYLE_URL)).json());
        if (stop || !box.current) return;
        map = new maplibregl.Map({ container: box.current, style, ...start, attributionControl: false, fadeDuration: 0 });
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
      map.on('load', () => {
        if (stop) return;
        setReady(true);
        if (!tours.length) return;
        if (still) {
          map.jumpTo({ center: [tours[0].lng, tours[0].lat], zoom: 14.6, pitch: 55, bearing: -20, padding: pad() });
          setActive(0);
          return;
        }
        let i = 0;
        const visit = () => {
          if (stop) return;
          if (document.hidden) { timer = setTimeout(visit, 1000); return; }
          const p = tours[i];
          setActive(-1);
          tours.forEach((x) => x._el?.classList.remove('on'));
          map.flyTo({ center: [p.lng, p.lat], zoom: 15.4, pitch: 62, bearing: -40 + ((i * 37) % 80), padding: pad(), duration: FLY, curve: 1.5, essential: true });
          map.once('moveend', () => {
            if (stop) return;
            setActive(i);
            p._el?.classList.add('on');
            map.easeTo({ bearing: map.getBearing() + 22, duration: HOLD, easing: (x) => x });
            timer = setTimeout(() => {
              i = (i + 1) % tours.length;
              if (i === 0) {
                setActive(-1);
                map.flyTo({ center: [-79.43, 43.84], zoom: 11.2, pitch: 40, bearing: -10, padding: pad(), duration: 4200 });
                map.once('moveend', () => { timer = setTimeout(visit, 1500); });
              } else visit();
            }, HOLD);
          });
        };
        timer = setTimeout(visit, 900);
      });
    })().catch(() => {});
    return () => {
      stop = true;
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
          {!mapboxToken && <span className="hm-credit">© OpenStreetMap · OpenFreeMap</span>}
        </div>
      </div>
    </section>
  );
}
