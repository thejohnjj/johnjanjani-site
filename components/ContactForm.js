'use client';

import { useState } from 'react';
import { track } from '@/lib/track';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Short "send me a message" form in the contact section; goes to John by email and to the admin page.
export default function ContactForm({ lang, t }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  async function submit(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    const name = String(f.name || '').trim();
    const phone = String(f.phone || '').trim();
    const email = String(f.email || '').trim();
    if (name.length < 2) return setError(t.errName);
    if (!phone && !email) return setError(t.msgNeedContact);
    if (phone && phone.replace(/\D/g, '').length < 10) return setError(t.errPhone);
    if (email && !EMAIL.test(email)) return setError(t.errEmail);
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, kind: 'message', lang }),
      });
      if (!res.ok) throw new Error();
      track('generate_lead', { lead_type: 'message', intent: f.intent });
      setDone(name.split(' ')[0]);
    } catch {
      setError(t.errServer);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="card-form done msg-form" role="status">
        <div className="done-mark" aria-hidden="true">✓</div>
        <h3 className="cf-title">{t.msgDone.replace('{n}', done)}</h3>
        <p>{t.msgDoneText}</p>
      </div>
    );
  }

  return (
    <form className="card-form msg-form" onSubmit={submit} noValidate>
      <h3 className="cf-title">{t.msgTitle}</h3>
      <fieldset className="field">
        <legend>{t.msgNeed}</legend>
        <div className="chips">
          {Object.entries(t.msgOpts).map(([k, v], i) => (
            <label key={k} className="chip-radio">
              <input type="radio" name="intent" value={k} defaultChecked={i === 0} />
              <span>{v}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="field">
        <label htmlFor="msgName">{t.joinName}</label>
        <input id="msgName" name="name" autoComplete="name" required />
      </div>
      <div className="grid2">
        <div className="field">
          <label htmlFor="msgPhone">{t.joinPhone}</label>
          <input id="msgPhone" name="phone" type="tel" autoComplete="tel" dir="ltr" />
        </div>
        <div className="field">
          <label htmlFor="msgEmail">{t.joinEmail}</label>
          <input id="msgEmail" name="email" type="email" autoComplete="email" dir="ltr" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="msgText">{t.msgText}</label>
        <textarea id="msgText" name="message" rows="3" placeholder={t.msgPh} />
      </div>
      <p className="err" role="alert">{error}</p>
      <button className="btn btn-accent" type="submit" disabled={busy}>{busy ? t.msgSending : t.msgSend}</button>
      <p className="msg-note">{t.msgNote}</p>
    </form>
  );
}
