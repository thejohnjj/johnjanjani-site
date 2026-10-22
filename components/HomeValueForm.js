'use client';

import { useState } from 'react';
import { track } from '@/lib/track';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function HomeValueForm({ lang, t }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  async function submit(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    if (String(f.address || '').trim().length < 5) return setError(t.errAddress);
    if (String(f.name || '').trim().length < 2) return setError(t.errName);
    if (!EMAIL.test(String(f.email || '').trim())) return setError(t.errEmail);
    if (String(f.phone || '').replace(/\D/g, '').length < 10) return setError(t.errPhone);
    if (f.consent !== 'on') return setError(t.errConsent);
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, kind: 'valuation', lang, consent: true }),
      });
      if (!res.ok) throw new Error();
      track('generate_lead', { lead_type: 'home_value' });
      setDone(String(f.name).trim().split(' ')[0]);
    } catch {
      setError(t.errServer);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="card-form done" role="status">
        <div className="done-mark" aria-hidden="true">✓</div>
        <h2>{t.hvDoneTitle.replace('{n}', done)}</h2>
        <p>{t.hvDoneText}</p>
        <a className="btn btn-accent" href="tel:+14376676652" dir="ltr">437-667-6652</a>
      </div>
    );
  }

  return (
    <form className="card-form" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="hvAddress">{t.hvAddress}</label>
        <input id="hvAddress" name="address" autoComplete="street-address" required />
      </div>
      <div className="grid2">
        <div className="field">
          <label htmlFor="hvCity">{t.hvCity}</label>
          <input id="hvCity" name="city" autoComplete="address-level2" />
        </div>
        <div className="field">
          <label htmlFor="hvType">{t.hvType}</label>
          <select id="hvType" name="type" defaultValue="detached">
            {Object.entries(t.hvTypes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="hvBeds">{t.hvBeds}</label>
          <input id="hvBeds" name="beds" inputMode="numeric" dir="ltr" />
        </div>
        <div className="field">
          <label htmlFor="hvBaths">{t.hvBaths}</label>
          <input id="hvBaths" name="baths" inputMode="decimal" dir="ltr" />
        </div>
      </div>
      <fieldset className="field">
        <legend>{t.hvTimeline}</legend>
        <div className="chips">
          {Object.entries(t.hvTimelines).map(([k, v], i) => (
            <label key={k} className="chip-radio">
              <input type="radio" name="timeline" value={k} defaultChecked={i === 3} />
              <span>{v}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="field">
        <label htmlFor="hvNote">{t.hvNote}</label>
        <textarea id="hvNote" name="note" rows="2" placeholder={t.hvNotePh} />
      </div>
      <div className="form-sep">{t.hvYou}</div>
      <div className="field">
        <label htmlFor="hvName">{t.joinName}</label>
        <input id="hvName" name="name" autoComplete="name" required />
      </div>
      <div className="grid2">
        <div className="field">
          <label htmlFor="hvEmail">{t.joinEmail}</label>
          <input id="hvEmail" name="email" type="email" autoComplete="email" dir="ltr" required />
        </div>
        <div className="field">
          <label htmlFor="hvPhone">{t.joinPhone}</label>
          <input id="hvPhone" name="phone" type="tel" autoComplete="tel" dir="ltr" required />
        </div>
      </div>
      <label className="check" htmlFor="hvConsent">
        <input id="hvConsent" name="consent" type="checkbox" required />
        <span>{t.hvConsent} <a href={`/${lang}/privacy`} target="_blank" rel="noopener">{t.footerPrivacy}</a></span>
      </label>
      <p className="err" role="alert">{error}</p>
      <button className="btn btn-accent" type="submit" disabled={busy}>{t.hvSubmit}</button>
    </form>
  );
}
