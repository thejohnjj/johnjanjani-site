'use client';

import { useState } from 'react';
import { vowT } from '@/lib/i18n-vow';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function post(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, ...data };
}

// Sign-up / sign-in panel for the sold-prices area. After success the page reloads with access.
// initial: 'signup' | 'login' | 'expired' | 'unverified'
export default function VowGate({ lang, initial = 'signup', compact = false, email: knownEmail = '', next }) {
  const v = vowT(lang);
  const [mode, setMode] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [sentTo, setSentTo] = useState(initial === 'unverified' ? knownEmail || '—' : '');
  const [note, setNote] = useState(initial === 'unverified' ? v.unverified : '');
  const E = (k) => v.errors[k] || v.errors.server;

  function done() {
    if (next) window.location.href = next;
    else window.location.reload();
  }

  async function signup(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    if (String(f.name || '').trim().length < 2) return setErr(E('name'));
    if (!EMAIL.test(String(f.email || '').trim())) return setErr(E('email'));
    if (String(f.phone || '').replace(/\D/g, '').length < 10) return setErr(E('phone'));
    setBusy(true);
    setErr('');
    const r = await post('/api/vow/register', { ...f, terms: f.terms === 'on', consent: f.consent === 'on', lang });
    setBusy(false);
    if (!r.ok) {
      if (r.error === 'exists') setMode('login');
      return setErr(E(r.error));
    }
    if (window.gtag) window.gtag('event', 'sign_up', { method: 'sold_prices' });
    setSentTo(String(f.email).trim());
    setMode('check');
  }

  async function login(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    setErr('');
    const r = await post('/api/vow/login', { ...f, lang });
    setBusy(false);
    if (r.ok) return done();
    if (r.error === 'unverified') {
      setSentTo(String(f.email).trim());
      setNote(v.unverified);
      return setMode('check');
    }
    if (r.error === 'expired') return setMode('expired');
    if (r.error === 'no_password') setMode('signup');
    setErr(E(r.error));
  }

  async function renew(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    setErr('');
    const r = await post('/api/vow/renew', { ...f, terms: f.terms === 'on', lang });
    setBusy(false);
    if (r.ok) return done();
    setErr(E(r.error));
  }

  async function forgot(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    if (!EMAIL.test(String(f.email || '').trim())) return setErr(E('email'));
    setBusy(true);
    setErr('');
    await post('/api/vow/forgot', { ...f, lang });
    setBusy(false);
    setNote(v.resetSent);
    setMode('login');
  }

  const termsBox = (
    <label className="check">
      <input name="terms" type="checkbox" required />
      <span>
        {v.terms.split('{link}')[0]}
        <a href={`/${lang}/vow-terms`} target="_blank" rel="noopener">{v.termsLink}</a>
        {v.terms.split('{link}')[1]}
      </span>
    </label>
  );

  return (
    <div className={`vow-gate${compact ? ' compact' : ''}`}>
      {!compact && (
        <div className="vow-pitch">
          <div className="eyebrow">{v.gateEyebrow}</div>
          <h2>{v.gateTitle}</h2>
          <p>{v.gateText}</p>
          <ul>{v.perks.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
      )}
      <div className="vow-box">
        {(mode === 'signup' || mode === 'login') && (
          <div className="vow-tabs" role="tablist">
            {['signup', 'login'].map((k) => (
              <button key={k} type="button" role="tab" aria-selected={mode === k} onClick={() => { setMode(k); setErr(''); }}>{v.tabs[k]}</button>
            ))}
          </div>
        )}
        {note && mode === 'login' && <p className="vow-note">{note}</p>}

        {mode === 'signup' && (
          <form className="form" onSubmit={signup} noValidate>
            <div className="field"><label htmlFor="vName">{v.name}</label><input id="vName" name="name" autoComplete="name" required /></div>
            <div className="field"><label htmlFor="vEmail">{v.email}</label><input id="vEmail" name="email" type="email" autoComplete="email" dir="ltr" defaultValue={knownEmail} required /></div>
            <div className="field"><label htmlFor="vPhone">{v.phone}</label><input id="vPhone" name="phone" type="tel" autoComplete="tel" dir="ltr" required /></div>
            <div className="field">
              <label htmlFor="vPw">{v.password}</label>
              <input id="vPw" name="password" type="password" autoComplete="new-password" dir="ltr" minLength={8} required />
              <small>{v.passwordHint}</small>
            </div>
            {termsBox}
            <label className="check">
              <input name="consent" type="checkbox" required />
              <span>{v.consent} <a href={`/${lang}/privacy`} target="_blank" rel="noopener">{v.privacy}</a></span>
            </label>
            <p className="err" role="alert">{err}</p>
            <button className="btn btn-accent" type="submit" disabled={busy}>{v.signup}</button>
          </form>
        )}

        {mode === 'login' && (
          <form className="form" onSubmit={login} noValidate>
            <div className="field"><label htmlFor="lEmail">{v.email}</label><input id="lEmail" name="email" type="email" autoComplete="email" dir="ltr" defaultValue={knownEmail} required /></div>
            <div className="field"><label htmlFor="lPw">{v.password}</label><input id="lPw" name="password" type="password" autoComplete="current-password" dir="ltr" required /></div>
            <p className="err" role="alert">{err}</p>
            <button className="btn btn-accent" type="submit" disabled={busy}>{v.login}</button>
            <button className="linkbtn" type="button" onClick={() => { setMode('forgot'); setErr(''); }}>{v.forgot}</button>
          </form>
        )}

        {mode === 'forgot' && (
          <form className="form" onSubmit={forgot} noValidate>
            <h3>{v.forgot}</h3>
            <div className="field"><label htmlFor="fEmail">{v.email}</label><input id="fEmail" name="email" type="email" autoComplete="email" dir="ltr" required /></div>
            <p className="err" role="alert">{err}</p>
            <button className="btn btn-accent" type="submit" disabled={busy}>{v.send}</button>
            <button className="linkbtn" type="button" onClick={() => setMode('login')}>{v.back}</button>
          </form>
        )}

        {mode === 'expired' && (
          <form className="form" onSubmit={renew} noValidate>
            <h3>{v.expiredTitle}</h3>
            <p>{v.expired}</p>
            <div className="field"><label htmlFor="rEmail">{v.email}</label><input id="rEmail" name="email" type="email" autoComplete="email" dir="ltr" defaultValue={knownEmail} required /></div>
            <div className="field"><label htmlFor="rPw">{v.currentPassword}</label><input id="rPw" name="password" type="password" autoComplete="current-password" dir="ltr" required /></div>
            <div className="field">
              <label htmlFor="rNew">{v.newPassword}</label>
              <input id="rNew" name="newPassword" type="password" autoComplete="new-password" dir="ltr" minLength={8} required />
              <small>{v.passwordHint}</small>
            </div>
            {termsBox}
            <p className="err" role="alert">{err}</p>
            <button className="btn btn-accent" type="submit" disabled={busy}>{v.renew}</button>
          </form>
        )}

        {mode === 'check' && (
          <div className="form">
            <h3>{v.checkEmailTitle}</h3>
            {note && <p>{note}</p>}
            <p>{v.checkEmail.split('{e}')[0]}<b dir="ltr">{sentTo}</b>{v.checkEmail.split('{e}')[1]}</p>
            <button className="linkbtn" type="button" onClick={() => { setMode('login'); setNote(''); }}>{v.back}</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ResetForm({ lang, m, e, s }) {
  const v = vowT(lang);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function submit(ev) {
    ev.preventDefault();
    const f = Object.fromEntries(new FormData(ev.currentTarget));
    setBusy(true);
    setErr('');
    const r = await post('/api/vow/reset', { m, e, s, password: f.password, terms: f.terms === 'on' });
    setBusy(false);
    if (r.ok) window.location.href = `/${lang}/sold`;
    else setErr(v.errors[r.error] || v.errors.server);
  }
  return (
    <form className="form vow-box" onSubmit={submit} noValidate>
      <h3>{v.resetTitle}</h3>
      <div className="field">
        <label htmlFor="xPw">{v.newPassword}</label>
        <input id="xPw" name="password" type="password" autoComplete="new-password" dir="ltr" minLength={8} required />
        <small>{v.passwordHint}</small>
      </div>
      <label className="check">
        <input name="terms" type="checkbox" required />
        <span>{v.terms.split('{link}')[0]}<a href={`/${lang}/vow-terms`} target="_blank" rel="noopener">{v.termsLink}</a>{v.terms.split('{link}')[1]}</span>
      </label>
      <p className="err" role="alert">{err}</p>
      <button className="btn btn-accent" type="submit" disabled={busy}>{v.reset}</button>
    </form>
  );
}
