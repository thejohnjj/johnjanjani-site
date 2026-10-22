'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { track } from '@/lib/track';

const Ctx = createContext(null);

export function useMembership() {
  return useContext(Ctx);
}

// Holds the join / sign-in dialog and the small toast message for the whole page.
export default function MembershipProvider({ lang, t, children }) {
  const router = useRouter();
  const [mode, setMode] = useState(null); // 'join' | 'signin' | null
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const firstListing = useRef(null);
  const dialogRef = useRef(null);

  const openJoin = useCallback((listingLabel) => {
    if (listingLabel) firstListing.current = listingLabel;
    setError('');
    setMode('join');
  }, []);
  const openSignIn = useCallback(() => {
    setError('');
    setMode('signin');
  }, []);
  const close = useCallback(() => setMode(null), []);
  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  }, []);

  useEffect(() => {
    if (!mode) return;
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    const first = dialogRef.current?.querySelector('input');
    first?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [mode, close]);

  async function submitJoin(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get('name') || '').trim();
    const email = String(f.get('email') || '').trim();
    const phone = String(f.get('phone') || '').trim();
    const consent = f.get('consent') === 'on';
    if (name.length < 2) return setError(t.errName);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return setError(t.errEmail);
    if (phone.replace(/\D/g, '').length < 10) return setError(t.errPhone);
    if (!consent) return setError(t.errConsent);
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, consent, lang, firstListing: firstListing.current }),
      });
      if (!res.ok) throw new Error();
      track('sign_up', { method: 'member' });
      close();
      showToast(t.welcome.replace('{n}', name.split(' ')[0]));
      router.refresh();
    } catch {
      setError(t.errServer);
    } finally {
      setBusy(false);
    }
  }

  async function submitSignIn(e) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get('email') || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return setError(t.errEmail);
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.status === 404) return setError(t.errNotFound);
      if (!res.ok) throw new Error();
      const data = await res.json();
      close();
      showToast(t.welcome.replace('{n}', String(data.name || '').split(' ')[0]));
      router.refresh();
    } catch {
      setError(t.errServer);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await fetch('/api/logout', { method: 'POST' });
    router.refresh();
  }

  return (
    <Ctx.Provider value={{ openJoin, openSignIn, signOut, showToast }}>
      {children}
      {mode && (
        <div className="scrim" onClick={(e) => e.target === e.currentTarget && close()}>
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dlgTitle" ref={dialogRef}>
            <button className="x" type="button" onClick={close} aria-label={t.close}>×</button>
            {mode === 'join' ? (
              <form className="form" onSubmit={submitJoin} noValidate>
                <div className="eyebrow">{t.joinEyebrow}</div>
                <h3 id="dlgTitle">{t.joinTitle}</h3>
                <p>{t.joinText}</p>
                <div className="field">
                  <label htmlFor="jName">{t.joinName}</label>
                  <input id="jName" name="name" autoComplete="name" required />
                </div>
                <div className="field">
                  <label htmlFor="jEmail">{t.joinEmail}</label>
                  <input id="jEmail" name="email" type="email" autoComplete="email" dir="ltr" required />
                </div>
                <div className="field">
                  <label htmlFor="jPhone">{t.joinPhone}</label>
                  <input id="jPhone" name="phone" type="tel" autoComplete="tel" dir="ltr" required />
                </div>
                <label className="check" htmlFor="jConsent">
                  <input id="jConsent" name="consent" type="checkbox" required />
                  <span>
                    {t.joinConsent} <a href={`/${lang}/privacy`} target="_blank" rel="noopener">{t.footerPrivacy}</a>
                  </span>
                </label>
                <p className="err" role="alert">{error}</p>
                <button className="btn btn-accent" type="submit" disabled={busy}>{t.joinSubmit}</button>
                <button className="linkbtn" type="button" onClick={openSignIn}>{t.joinHaveAccount}</button>
              </form>
            ) : (
              <form className="form" onSubmit={submitSignIn} noValidate>
                <div className="eyebrow">{t.signIn}</div>
                <h3 id="dlgTitle">{t.signInTitle}</h3>
                <p>{t.signInText}</p>
                <div className="field">
                  <label htmlFor="sEmail">{t.joinEmail}</label>
                  <input id="sEmail" name="email" type="email" autoComplete="email" dir="ltr" required />
                </div>
                <p className="err" role="alert">{error}</p>
                <button className="btn btn-accent" type="submit" disabled={busy}>{t.signInSubmit}</button>
                <button className="linkbtn" type="button" onClick={() => openJoin()}>{t.signInNew}</button>
              </form>
            )}
          </div>
        </div>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </Ctx.Provider>
  );
}

export function JoinButton({ className = 'btn btn-accent', label, listingLabel }) {
  const m = useMembership();
  return (
    <button type="button" className={className} onClick={() => m.openJoin(listingLabel)}>
      {label}
    </button>
  );
}

export function SignOutButton({ label }) {
  const m = useMembership();
  return (
    <button type="button" className="btn btn-ghost" onClick={m.signOut}>
      {label}
    </button>
  );
}
