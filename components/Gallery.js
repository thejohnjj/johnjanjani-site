'use client';

import { useState } from 'react';

export default function Gallery({ photos, alt }) {
  const [i, setI] = useState(0);
  if (!photos.length) return <div className="main" style={{ aspectRatio: '4 / 3', borderRadius: 20, background: 'var(--teal-deep)' }} />;
  return (
    <div className="gallery">
      <img className="main" src={photos[i]} alt={`${alt} — ${i + 1}/${photos.length}`} />
      {photos.length > 1 && (
        <div className="thumbs">
          {photos.map((p, n) => (
            <button key={p} type="button" aria-current={n === i} aria-label={`${n + 1}`} onClick={() => setI(n)}>
              <img src={p} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
