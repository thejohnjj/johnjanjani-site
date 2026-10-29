'use client';

import { useEffect, useRef, useState } from 'react';
import HeroSearch from '@/components/HeroSearch';
import { preconnect } from 'react-dom';
import { digits } from '@/lib/format';
import 'maplibre-gl/dist/maplibre-gl.css';
import 'mapbox-gl/dist/mapbox-gl.css';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
// Start downloading the map engine as soon as this file loads in the browser, not after the page settles.
let enginePromise = null;
const loadEngine = () => (enginePromise ||= import('mapbox-gl').then((m) => m.default));
if (typeof window !== 'undefined') loadEngine();
const HOLD = 4800; // time spent at each home
// Camera height while touring: close enough for 3D houses, a little higher on phones (less to download).
const zoomFor = () => (typeof window !== 'undefined' && window.innerWidth < 760 ? 14.8 : 15.1);
const PITCH = 60;

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

// Mapbox's own detailed street map (fast to load), repainted in the brand colours with 3D buildings.
function brandMapbox(style) {
  const C = { bg: '#0A3338', land: '#0D3A40', park: '#11473C', water: '#04232C', minor: '#2B6369', mid: '#3F8086', major: '#D8C9A0', hwy: '#E07A3F', label: '#D8C9A0', halo: '#072F33' };
  const layers = [];
  for (const l of style.layers) {
    const id = l.id;
    if (l.type === 'symbol' && /poi|transit|airport|ferry|natural-point|water-point|road-number|road-exit|settlement-subdivision|golf/.test(id)) continue;
    const p = { ...(l.paint || {}) };
    if (l.type === 'background') p['background-color'] = C.bg;
    else if (l.type === 'fill') {
      if (/water/.test(id)) p['fill-color'] = C.water;
      else if (/park|landcover|national|pitch|golf|grass|wood/.test(id)) { p['fill-color'] = C.park; p['fill-opacity'] = 0.9; }
      else if (/building/.test(id)) { p['fill-color'] = '#164A50'; delete p['fill-outline-color']; }
      else { p['fill-color'] = C.land; delete p['fill-pattern']; }
    } else if (l.type === 'line') {
      if (/case|shadow/.test(id)) p['line-opacity'] = 0;
      else if (/water/.test(id)) p['line-color'] = C.water;
      else if (/motorway/.test(id)) { p['line-color'] = C.hwy; p['line-opacity'] = 0.85; }
      else if (/trunk|primary/.test(id)) { p['line-color'] = C.major; p['line-opacity'] = 0.6; }
      else if (/secondary|tertiary/.test(id)) p['line-color'] = C.mid;
      else if (/admin|boundary/.test(id)) { p['line-color'] = '#3D6E72'; p['line-opacity'] = 0.5; }
      else if (/rail/.test(id)) { p['line-color'] = '#2A5E64'; p['line-opacity'] = 0.6; }
      else p['line-color'] = C.minor;
    } else if (l.type === 'symbol') {
      p['text-color'] = /settlement|place/.test(id) ? '#F6F1E7' : C.label;
      p['text-halo-color'] = C.halo;
      p['text-halo-width'] = 1.3;
    }
    layers.push({ ...l, paint: p });
  }
  const firstSymbol = layers.findIndex((l) => l.type === 'symbol');
  const extrude = {
    id: 'jj-3d-buildings',
    type: 'fill-extrusion',
    source: 'composite',
    'source-layer': 'building',
    minzoom: 13,
    filter: ['==', ['get', 'extrude'], 'true'],
    paint: {
      'fill-extrusion-color': ['interpolate', ['linear'], ['get', 'height'], 0, '#22656C', 20, '#2F7A82', 60, '#4B989E', 150, '#6DB3B6'],
      'fill-extrusion-height': ['get', 'height'],
      'fill-extrusion-base': ['get', 'min_height'],
      'fill-extrusion-opacity': 0.92,
      'fill-extrusion-vertical-gradient': true,
    },
  };
  layers.splice(firstSymbol < 0 ? layers.length : firstSymbol, 0, extrude);
  return { ...style, layers };
}

// Homepage opening (map version): a camera flies over the real GTA streets in 3D and
// stops at each home John toured, showing its photo and code.
export default function HeroMap({ points, t, lang, mapboxToken = '', look = 'standard' }) {
  const box = useRef(null);
  const onScreen = useRef(true);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(-1);
  const [usingMapbox, setUsingMapbox] = useState(Boolean(mapboxToken));
  const tours = points.filter((p) => p.code);
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
      const start = { center: f0 ? [f0.lng, f0.lat] : [-79.43, 43.86], zoom: f0 ? zoomFor() : 12.5, pitch: PITCH, bearing: -30, interactive: false };
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
        // 'fast' = Mapbox's detailed street map in brand colours (appears in about a second);
        // otherwise the realistic 3D style (or satellite photos). Engine and style download together.
        const [engine, fastStyle] = await Promise.all([
          loadEngine(),
          look === 'fast'
            ? fetch(`https://api.mapbox.com/styles/v1/mapbox/dark-v11?access_token=${mapboxToken}`).then((r) => r.json()).then(brandMapbox)
            : null,
        ]);
        maplibregl = engine;
        maplibregl.accessToken = mapboxToken;
        if (stop || !box.current) return;
        const mb = new maplibregl.Map({
          container: box.current,
          style: fastStyle || (look === 'satellite' ? 'mapbox://styles/mapbox/standard-satellite' : 'mapbox://styles/mapbox/standard'),
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
            if (!settled && (st === 401 || st === 403 || st === 429)) {
              settled = true;
              try { mb.remove(); } catch {}
              setUsingMapbox(false);
              freeMap().then(resolve);
            }
          });
          // Last resort: if Mapbox still hasn't answered after 15 s of the page actually being on screen.
          let waited = 0;
          const watchdog = () => {
            if (settled || stop) return;
            if (!document.hidden) waited += 1000;
            if (waited >= 15000) { settled = true; try { mb.remove(); } catch {} setUsingMapbox(false); freeMap().then(resolve); return; }
            setTimeout(watchdog, 1000);
          };
          setTimeout(watchdog, 1000);
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
          if (km > 6) {
            // Far away (e.g. Richmond Hill to downtown): rise up, travel, come back down.
            map.flyTo({ center: [p.lng, p.lat], zoom: zoomFor(), pitch: PITCH, bearing: map.getBearing() + 30, padding: pad(), duration: 6500, curve: 1.6, essential: true });
          } else {
            map.easeTo({ center: [p.lng, p.lat], zoom: zoomFor(), pitch: PITCH, bearing: map.getBearing() + 30, padding: pad(), duration: Math.min(7000, Math.max(3200, km * 900)), easing: (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2) });
          }
          map.once('moveend', () => { if (!stop) { arrive(i); orbit(); } });
        };
        timer = setTimeout(orbit, 400);
      };
      // Put the camera on the newest home right away, and fade the map in once that view is
      // fully drawn (at most 9 s; the home's photo shows until then), so visitors never see a half-drawn map.
      if (f0) map.jumpTo({ center: [f0.lng, f0.lat], zoom: zoomFor(), pitch: PITCH, bearing: -30, padding: pad() });
      let fired = false;
      const go = () => { if (!fired) { fired = true; onReady(); } };
      map.once('idle', go);
      setTimeout(go, 9000);
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


  const s = active >= 0 ? tours[active] : null;
  return (
    <section className={`hero2 heromap${ready ? ' is-ready' : ''}`} aria-label={t.heroToured}>
      <div className="h2-media" aria-hidden="true">
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
          <HeroSearch lang={lang} t={t} />
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
