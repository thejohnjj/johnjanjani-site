'use client';

import { useEffect, useState } from 'react';
import { useMembership } from './Membership';
import { Icons } from './ContactIcons';

const Burger = ({ open }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
  </svg>
);

// Menu button for phones: opens a panel under the header with every section of the site.
export default function MobileMenu({ lang, t, member, path = '' }) {
  const [open, setOpen] = useState(false);
  const m = useMembership();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.documentElement.classList.add('menu-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.classList.remove('menu-open');
    };
  }, [open]);

  const close = () => setOpen(false);
  const links = [
    [`/${lang}#listings`, t.nav.listings, Icons.grid],
    [`/${lang}/home-value`, t.navTools.homeValue, Icons.home],
    [`/${lang}/calculator`, t.navTools.calculator, Icons.calc],
    [`/${lang}/guide`, t.navTools.guide, Icons.book],
    [`/${lang}#about`, t.nav.about, Icons.user],
    [`/${lang}#market`, t.nav.market, Icons.chart],
    [`/${lang}#contact`, t.nav.contact, Icons.phone],
  ];

  return (
    <>
      <button
        type="button"
        className="menu-btn"
        aria-expanded={open}
        aria-controls="mmenu"
        aria-label={open ? t.close : t.menu}
        onClick={() => setOpen(!open)}
      >
        <Burger open={open} />
      </button>
      {open && (
        <div className="mmenu-scrim" onClick={close}>
          <nav id="mmenu" className="mmenu" aria-label={t.menu} onClick={(e) => e.stopPropagation()}>
            <ul>
              {links.map(([href, label, icon]) => (
                <li key={href}>
                  <a href={href} onClick={close}>
                    <span className="mi">{icon}</span>
                    <span>{label}</span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="mmenu-foot">
              <a className="btn btn-ghost" href={`/${t.otherLang}${path}`} hrefLang={t.otherLang} lang={t.otherLang}>{t.otherLangLabel}</a>
              {member ? (
                <button type="button" className="btn btn-ghost" onClick={() => { close(); m?.signOut(); }}>{t.signOut}</button>
              ) : (
                <button type="button" className="btn btn-accent" onClick={() => { close(); m?.openJoin(); }}>{t.join}</button>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
