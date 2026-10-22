import Logo from './Logo';
import { JoinButton, SignOutButton } from './Membership';
import MobileMenu from './MobileMenu';

export function Header({ lang, t, member, path = '' }) {
  return (
    <header className="top">
      <div className="wrap">
        <a className="brand" href={`/${lang}`} aria-label={t.brandName}>
          <Logo />
          <b>{t.brandName}</b>
        </a>
        <nav className="links" aria-label="Main">
          <a href={`/${lang}#listings`}>{t.nav.listings}</a>
          <a href={`/${lang}/home-value`}>{t.navTools.homeValue}</a>
          <a href={`/${lang}/calculator`}>{t.navTools.calculator}</a>
          <a href={`/${lang}/guide`}>{t.navTools.guide}</a>
          <a href={`/${lang}/seller-guide`}>{t.navTools.sellerGuide}</a>
          <a href={`/${lang}#contact`}>{t.nav.contact}</a>
        </nav>
        {member && <span className="member-pill">{t.memberAs.replace('{n}', member.name.split(' ')[0])}</span>}
        <a className="lang" href={`/${t.otherLang}${path}`} hrefLang={t.otherLang} lang={t.otherLang}>
          {t.otherLangLabel}
        </a>
        <span className="head-join">{member ? <SignOutButton label={t.signOut} /> : <JoinButton label={t.join} />}</span>
        <MobileMenu lang={lang} t={t} member={Boolean(member)} path={path} />
      </div>
    </header>
  );
}

export function Footer({ lang, t }) {
  return (
    <footer>
      <div className="wrap">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/images/c21.png" alt="Century 21" width="44" height="44" />
          <span>{t.footerBrokerage}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px' }}>
          <a href={`/${lang}/home-value`}>{t.navTools.homeValue}</a>
          <a href={`/${lang}/calculator`}>{t.navTools.calculator}</a>
          <a href={`/${lang}/guide`}>{t.navTools.guide}</a>
          <a href={`/${lang}/seller-guide`}>{t.navTools.sellerGuide}</a>
          <a href={`/${lang}/privacy`}>{t.footerPrivacy}</a>
          <span>© {new Date().getFullYear()} johnjanjani.com</span>
        </div>
        <p style={{ margin: 0, flexBasis: '100%', opacity: 0.8 }}>{t.footerNote}</p>
      </div>
    </footer>
  );
}
