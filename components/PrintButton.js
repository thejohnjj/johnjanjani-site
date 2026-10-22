'use client';

export default function PrintButton({ label }) {
  return (
    <button type="button" className="btn btn-ghost-ink no-print" onClick={() => window.print()}>
      {label}
    </button>
  );
}
