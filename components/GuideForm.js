'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { track } from '@/lib/track';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function GuideForm({ lang, t }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    if (String(f.name || '').trim().length < 2) return setError(t.errName);
    if (!EMAIL.test(String(f.email || '').trim())) return setError(t.errEmail);
    const digits = String(f.phone || '').replace(/\D/g, '');
    if (digits && digits.length < 10) return setError(t.errPhone);
    if (f.consent !== 'on') return setError(t.errConsent);
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, kind: 'guide', lang, consent: true }),
      });
      if (!res.ok) throw new Error();
      track('generate_lead', { lead_type: 'guide' });
      router.refresh();
    } catch {
      setError(t.errServer);
      setBusy(false);
    }
  }

  return (
    <form className="card-form" onSubmit={submit} noValidate>
      <h2 className="cf-title">{t.gFormTitle}</h2>
      <p className="cf-text">{t.gFormText}</p>
      <div className="field">
        <label htmlFor="gName">{t.joinName}</label>
        <input id="gName" name="name" autoComplete="name" required />
      </div>
      <div className="field">
        <label htmlFor="gEmail">{t.joinEmail}</label>
        <input id="gEmail" name="email" type="email" autoComplete="email" dir="ltr" required />
      </div>
      <div className="field">
        <label htmlFor="gPhone">{t.gPhoneOpt}</label>
        <input id="gPhone" name="phone" type="tel" autoComplete="tel" dir="ltr" />
      </div>
      <div className="field">
        <label htmlFor="gStage">{t.gStage}</label>
        <select id="gStage" name="stage" defaultValue={t.gStages[0]}>
          {t.gStages.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <label className="check" htmlFor="gConsent">
        <input id="gConsent" name="consent" type="checkbox" required />
        <span>{t.gConsent} <a href={`/${lang}/privacy`} target="_blank" rel="noopener">{t.footerPrivacy}</a></span>
      </label>
      <p className="err" role="alert">{error}</p>
      <button className="btn btn-accent" type="submit" disabled={busy}>{t.gSubmit}</button>
    </form>
  );
}
