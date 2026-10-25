import LockIcon from './LockIcon';
import { money, digits } from '@/lib/format';

export function Price({ l, t, lang }) {
  if (l.status === 'sold') return <div className="sold-note">{t.soldNote}</div>;
  if (l.price == null) {
    return (
      <div className="locked">
        <LockIcon />
        <span>{t.lockPrice}</span>
      </div>
    );
  }
  return (
    <div className="price">
      {money(l.price, lang)}
      {l.status === 'rent' && <small> {t.perMonth}</small>}
    </div>
  );
}

export function Specs({ l, t, lang }) {
  return (
    <div className="specs">
      <span><b>{digits(l.beds, lang)}</b> {t.beds}</span>
      <span><b>{digits(l.baths, lang)}</b> {t.baths}</span>
      <span><b>{digits(l.parking, lang)}</b> {t.parking}</span>
      {l.sqft && <span><b dir="ltr">{digits(l.sqft, lang)}</b> {t.sqft}</span>}
    </div>
  );
}

export default function ListingCard({ l, t, lang }) {
  const photo = l.photos[0];
  return (
    <a className="card" href={`/${lang}/listings/${l.slug}`}>
      <div className="ph">
        {photo ? <img src={photo} alt={`${l.type[lang]} · ${l.city[lang]}`} loading="lazy" /> : <span className="noimg">{l.type[lang]}</span>}
        <span className={`tag${l.status === 'sold' ? ' sold' : ''}`}>{t.status[l.status]}</span>
      </div>
      <div className="body">
        <div className="where">
          {l.code ? <b className="code">{t.code}: <span dir="ltr">{digits(l.code, lang)}</span></b> : l.type[lang]} · {l.city[lang]}
        </div>
        <Price l={l} t={t} lang={lang} />
        {l.address && <div className="where ltr" dir="ltr" style={{ textAlign: 'start' }}>{l.address}</div>}
        <Specs l={l} t={t} lang={lang} />
        {l.section === 'pick' && l.note?.[lang] && <p className="pick-note">“{l.note[lang]}”</p>}
        {l.brokerage && <div className="broker">{t.brokerage}: <span dir="ltr">{l.brokerage}</span></div>}
        {l.section === 'pick' && l.pickedLabel && <div className="picked">{t.pkPicked.replace('{d}', l.pickedLabel)}</div>}
      </div>
    </a>
  );
}
