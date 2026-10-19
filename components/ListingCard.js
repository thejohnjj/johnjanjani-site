import LockIcon from './LockIcon';
import { money, digits } from '@/lib/format';

export function Price({ l, t, lang }) {
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
      {l.sqft && <span><b>{digits(l.sqft, lang)}</b> {t.sqft}</span>}
    </div>
  );
}

export default function ListingCard({ l, t, lang }) {
  const photo = l.photos[0];
  return (
    <a className="card" href={`/${lang}/listings/${l.slug}`}>
      <div className="ph">
        {photo ? <img src={photo} alt={`${l.type[lang]} · ${l.city[lang]}`} loading="lazy" /> : <span className="noimg">{l.type[lang]}</span>}
        <span className="tag">{t.status[l.status]}</span>
      </div>
      <div className="body">
        <div className="where">{l.type[lang]} · {l.city[lang]}</div>
        <Price l={l} t={t} lang={lang} />
        {l.address && <div className="where ltr" dir="ltr" style={{ textAlign: 'start' }}>{l.address}</div>}
        <Specs l={l} t={t} lang={lang} />
        {l.brokerage && <div className="broker">{t.brokerage}: <span dir="ltr">{l.brokerage}</span></div>}
      </div>
    </a>
  );
}
