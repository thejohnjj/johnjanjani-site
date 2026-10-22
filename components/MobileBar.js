'use client';

import { useMembership } from './Membership';
import { Icons } from './ContactIcons';
import { PHONE_TEL, WHATSAPP } from '@/lib/site';
import { track } from '@/lib/track';

const WA = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 20l1.3-4A8 8 0 1 1 8.3 19z" />
    <path d="M9 8.5c0 3.6 2.9 6.5 6.5 6.5l1-1.6-2-1-1 .9a5 5 0 0 1-2.8-2.8l.9-1-1-2z" />
  </svg>
);

// A contact bar fixed to the bottom of the screen on phones: Call, Text (or WhatsApp), and Join / Home value.
export default function MobileBar({ lang, t, member }) {
  const m = useMembership();
  return (
    <nav className="mbar" aria-label={t.nav.contact}>
      <a href={`tel:${PHONE_TEL}`} onClick={() => track('contact', { method: 'call' })}>
        <span className="ci">{Icons.phone}</span>
        <span>{t.mbCall}</span>
      </a>
      {WHATSAPP ? (
        <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" onClick={() => track('contact', { method: 'whatsapp' })}>
          <span className="ci">{WA}</span>
          <span>{t.mbWhatsApp}</span>
        </a>
      ) : (
        <a href={`sms:${PHONE_TEL}`} onClick={() => track('contact', { method: 'sms' })}>
          <span className="ci">{Icons.sms}</span>
          <span>{t.mbText}</span>
        </a>
      )}
      {member ? (
        <a className="accent" href={`/${lang}/home-value`}>
          <span className="ci">{Icons.home}</span>
          <span>{t.mbValue}</span>
        </a>
      ) : (
        <button type="button" className="accent" onClick={() => m?.openJoin()}>
          <span className="ci">{Icons.user}</span>
          <span>{t.join}</span>
        </button>
      )}
    </nav>
  );
}
