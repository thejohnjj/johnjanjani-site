const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const Icons = {
  phone: (
    <svg viewBox="0 0 24 24" {...P} aria-hidden="true"><path d="M5 3.5h3.2l1.6 4.2-2 1.3a11 11 0 0 0 5.2 5.2l1.3-2 4.2 1.6V17a2.5 2.5 0 0 1-2.7 2.5C9.6 19 5 14.4 4.5 6.2A2.5 2.5 0 0 1 5 3.5z" /></svg>
  ),
  sms: (
    <svg viewBox="0 0 24 24" {...P} aria-hidden="true"><path d="M4 5.5h16v10.5H9l-5 4z" /><path d="M8 10h.01M12 10h.01M16 10h.01" strokeWidth="2.6" /></svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" {...P} aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.2 6.8h.01" strokeWidth="2.6" /></svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" {...P} aria-hidden="true"><path d="M14.5 8.5H17V5h-2.5A3.5 3.5 0 0 0 11 8.5V11H8.5v3.5H11V21h3.5v-6.5H17l.5-3.5h-3V8.8a.3.3 0 0 1 0-.3z" /></svg>
  ),
  pin: (
    <svg viewBox="0 0 24 24" {...P} aria-hidden="true"><path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z" /><circle cx="12" cy="9.8" r="2.4" /></svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" {...P} aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.3 2.4 3.4 5.2 3.4 8.5s-1.1 6.1-3.4 8.5c-2.3-2.4-3.4-5.2-3.4-8.5S9.7 5.9 12 3.5z" /></svg>
  ),
};
