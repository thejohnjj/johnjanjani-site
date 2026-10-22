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
  home: (
    <svg viewBox="0 0 24 24" {...P} aria-hidden="true"><path d="M3.5 11.2L12 4l8.5 7.2" /><path d="M5.5 9.6V20h13V9.6" /><path d="M10 20v-5.5h4V20" /></svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" {...P} aria-hidden="true"><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20c.9-3.8 3.9-5.8 7.5-5.8s6.6 2 7.5 5.8" /></svg>
  ),
  calc: (
    <svg viewBox="0 0 24 24" {...P} aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2.5" /><path d="M8.5 7h7" /><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01M8.5 15h.01M12 15h.01M15.5 15h.01M8.5 18h.01M12 18h.01M15.5 18h.01" strokeWidth="2.4" /></svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" {...P} aria-hidden="true"><path d="M4 5.5C6.8 4.4 9.6 4.5 12 6.3c2.4-1.8 5.2-1.9 8-.8V19c-2.8-1.1-5.6-1-8 .8-2.4-1.8-5.2-1.9-8-.8z" /><path d="M12 6.3v13.5" /></svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3.2l2.6 5.5 6 .7-4.4 4.1 1.2 5.9L12 16.5l-5.4 2.9 1.2-5.9L3.4 9.4l6-.7z" /></svg>
  ),
  play: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" /></svg>
  ),
  sign: (
    <svg viewBox="0 0 24 24" {...P} aria-hidden="true"><path d="M5 21V3.5" /><path d="M5 5h13.5v8H5" /><path d="M9 9h6" /></svg>
  ),
  grid: (
    <svg viewBox="0 0 24 24" {...P} aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" {...P} aria-hidden="true"><path d="M4 20h16" /><path d="M7 16v-4M12 16V8M17 16v-7" /></svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" {...P} aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.3 2.4 3.4 5.2 3.4 8.5s-1.1 6.1-3.4 8.5c-2.3-2.4-3.4-5.2-3.4-8.5S9.7 5.9 12 3.5z" /></svg>
  ),
};
