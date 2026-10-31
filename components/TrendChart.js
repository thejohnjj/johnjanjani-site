'use client';

import { useMemo, useState } from 'react';

const fmt = (n) => (n >= 1000000 ? `$${(n / 1000000).toFixed(n >= 10000000 ? 0 : 2)}M` : `$${Math.round(n / 1000)}K`);
const full = (n) => `$${Math.round(n).toLocaleString('en-US')}`;

// One series: median sold price per month. Thin 2px line, recessive grid, crosshair + tooltip on hover,
// table view for screen readers and anyone who prefers numbers.
export default function TrendChart({ points, title, labels }) {
  const W = 680;
  const H = 240;
  const pad = { l: 56, r: 16, t: 14, b: 30 };
  const [hover, setHover] = useState(null);
  const valid = points.filter((p) => p.median);
  const { ys, yMin, yMax } = useMemo(() => {
    const v = valid.map((p) => p.median);
    const lo = Math.min(...v);
    const hi = Math.max(...v);
    const span = hi - lo || hi * 0.1;
    const yMin = Math.max(0, lo - span * 0.15);
    const yMax = hi + span * 0.15;
    const step = (yMax - yMin) / 3;
    return { ys: [0, 1, 2, 3].map((k) => yMin + step * k), yMin, yMax };
  }, [valid]);
  if (valid.length < 4) return null;
  const x = (idx) => pad.l + (idx / (points.length - 1)) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - (v - yMin) / (yMax - yMin)) * (H - pad.t - pad.b);
  let d = '';
  points.forEach((p, idx) => {
    if (!p.median) return;
    d += `${d && points[idx - 1]?.median ? 'L' : 'M'}${x(idx).toFixed(1)},${y(p.median).toFixed(1)} `;
  });
  const h = hover != null ? points[hover] : null;

  return (
    <figure className="trend" aria-label={title}>
      <div className="trend-plot" dir="ltr">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} onMouseLeave={() => setHover(null)}>
          {ys.map((v) => (
            <g key={v}>
              <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} className="grid" />
              <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" className="axis">{fmt(v)}</text>
            </g>
          ))}
          {points.map((p, idx) => (idx % 3 === 0 || idx === points.length - 1 ? (
            <text key={p.month} x={x(idx)} y={H - 8} textAnchor="middle" className="axis">{p.month.slice(2).replace('-', '/')}</text>
          ) : null))}
          <path d={d} className="line" />
          {h?.median && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} className="cross" />
              <circle cx={x(hover)} cy={y(h.median)} r="5" className="dot" />
            </g>
          )}
          {points.map((p, idx) => (
            <rect key={p.month} x={x(idx) - (W - pad.l - pad.r) / points.length / 2} y={pad.t} width={(W - pad.l - pad.r) / points.length} height={H - pad.t - pad.b}
              fill="transparent" onMouseEnter={() => setHover(idx)} onTouchStart={() => setHover(idx)} />
          ))}
        </svg>
        {h && (
          <div className="tip" style={{ left: `${(x(hover) / W) * 100}%` }}>
            <b>{h.month}</b>
            <span>{h.median ? full(h.median) : '—'}</span>
            <small>{labels.sales}: {h.count}</small>
          </div>
        )}
      </div>
      <details className="trend-table">
        <summary>{labels.tableView}</summary>
        <table>
          <thead><tr><th>{labels.month}</th><th>{labels.median}</th><th>{labels.sales}</th></tr></thead>
          <tbody>
            {points.map((p) => <tr key={p.month}><td dir="ltr">{p.month}</td><td dir="ltr">{p.median ? full(p.median) : '—'}</td><td>{p.count}</td></tr>)}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
