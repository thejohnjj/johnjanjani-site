'use client';

import { useState } from 'react';
import { useMembership } from './Membership';

export default function ShowingButton({ listingId, label, sentLabel, errorLabel }) {
  const m = useMembership();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function send() {
    setBusy(true);
    try {
      const res = await fetch('/api/showing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
      m.showToast(sentLabel);
    } catch {
      m.showToast(errorLabel);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="btn btn-accent" onClick={send} disabled={busy || done}>
      {done ? sentLabel : label}
    </button>
  );
}
