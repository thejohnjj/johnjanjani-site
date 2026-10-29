import { t as dictFor } from '@/lib/i18n';
import { mlsT, FEED_LIVE } from '@/lib/i18n-mls';
import { getMemberId } from '@/lib/session';
import { getMember } from '@/lib/listings';
import { AREAS, PAGE_SIZE, MAX_RESULTS, readFilters, searchListings } from '@/lib/proptx';
import { guardFeedView } from '@/lib/feed-guard';
import MembershipProvider from '@/components/Membership';
import { Header, Footer } from '@/components/SiteChrome';
import MobileBar from '@/components/MobileBar';
import MlsCard, { MlsDisclaimer } from '@/components/MlsCard';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }) {
  const m = mlsT(params.lang);
  return {
    title: m.title,
    description: m.lead,
    robots: FEED_LIVE ? undefined : { index: false, follow: false },
    alternates: { canonical: `/${params.lang}/search`, languages: { en: '/en/search', fa: '/fa/search' } },
  };
}

const PRICES_SALE = [400000, 500000, 600000, 700000, 800000, 900000, 1000000, 1250000, 1500000, 1750000, 2000000, 2500000, 3000000, 4000000, 5000000];
const PRICES_LEASE = [1500, 2000, 2500, 3000, 3500, 4000, 5000, 6000, 8000, 10000];
const short = (n) => (n >= 1000000 ? `$${n / 1000000}M` : n >= 1000 && n % 1000 === 0 && n >= 100000 ? `$${n / 1000}K` : `$${n.toLocaleString('en-US')}`);

function qs(f, over = {}) {
  const v = { ...f, ...over };
  const p = new URLSearchParams();
  if (v.deal === 'lease') p.set('deal', 'lease');
  for (const k of ['area', 'q', 'type', 'min', 'max', 'beds', 'baths']) if (v[k]) p.set(k, v[k]);
  if (v.sort && v.sort !== 'new') p.set('sort', v.sort);
  if (v.page && v.page > 1) p.set('page', v.page);
  const s = p.toString();
  return s ? `?${s}` : '';
}

export default async function SearchPage({ params, searchParams }) {
  const lang = params.lang;
  const t = dictFor(lang);
  const m = mlsT(lang);
  const member = await getMember(getMemberId());
  const f = readFilters(searchParams);
  const allowed = await guardFeedView({ action: 'search', memberId: member?.id || null });
  const res = allowed ? await searchListings(f) : null;
  const shown = res ? Math.min(res.total, MAX_RESULTS) : 0;
  const pages = Math.ceil(shown / PAGE_SIZE);
  const prices = f.deal === 'lease' ? PRICES_LEASE : PRICES_SALE;

  return (
    <MembershipProvider lang={lang} t={t}>
      <Header lang={lang} t={t} member={member} path={`/search${qs(f)}`} />
      <main>
        <section className="block list-page">
          <div className="wrap">
            <a className="back" href={`/${lang}`}>{t.backHome}</a>
            <h1>{m.title}</h1>
            <p style={{ color: 'var(--muted)', margin: '6px 0 0' }}>{m.lead}</p>

            <form className="mls-search" method="get" action={`/${lang}/search`}>
              <div className="mls-deal" role="radiogroup">
                <label><input type="radio" name="deal" value="sale" defaultChecked={f.deal === 'sale'} /> {m.sale}</label>
                <label><input type="radio" name="deal" value="lease" defaultChecked={f.deal === 'lease'} /> {m.lease}</label>
              </div>
              <label className="wide">
                {m.keyword}
                <input type="search" name="q" defaultValue={f.q} maxLength={40} dir="auto" />
              </label>
              <label>
                {m.area}
                <select name="area" defaultValue={f.area}>
                  <option value="">{m.anyArea}</option>
                  {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </label>
              <label>
                {m.type}
                <select name="type" defaultValue={f.type}>
                  <option value="">{m.anyType}</option>
                  {Object.entries(m.types).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <label>
                {m.minPrice}
                <select name="min" defaultValue={f.min || ''}>
                  <option value="">{m.noMin}</option>
                  {prices.map((p) => <option key={p} value={p}>{short(p)}</option>)}
                </select>
              </label>
              <label>
                {m.maxPrice}
                <select name="max" defaultValue={f.max || ''}>
                  <option value="">{m.noMax}</option>
                  {prices.map((p) => <option key={p} value={p}>{short(p)}</option>)}
                </select>
              </label>
              <label>
                {m.beds}
                <select name="beds" defaultValue={f.beds || ''}>
                  <option value="">{m.any}</option>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}
                </select>
              </label>
              <label>
                {m.baths}
                <select name="baths" defaultValue={f.baths || ''}>
                  <option value="">{m.any}</option>
                  {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}+</option>)}
                </select>
              </label>
              <label>
                {m.sort}
                <select name="sort" defaultValue={f.sort}>
                  {Object.entries(m.sorts).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <div className="actions">
                <button className="btn btn-accent" type="submit">{m.search}</button>
                <a className="btn btn-line" href={`/${lang}/search`}>{m.reset}</a>
              </div>
            </form>

            {!allowed && <p className="mls-count">{m.blocked}</p>}
            {res && !res.ok && <p className="mls-count">{m.error}</p>}
            {res && res.ok && (
              <>
                <p className="mls-count">
                  {res.total ? m.found.replace('{n}', res.total.toLocaleString('en-US')) : m.none}
                  {res.total > MAX_RESULTS ? ` ${m.capped}` : ''}
                </p>
                <div className="mls-grid">
                  {res.items.map((l) => <MlsCard key={l.key} l={l} m={m} lang={lang} />)}
                </div>
                {pages > 1 && (
                  <nav className="mls-pages" aria-label="Pages">
                    {f.page > 1 && <a href={`/${lang}/search${qs(f, { page: f.page - 1 })}`}>{m.prev}</a>}
                    {Array.from({ length: pages }, (_, i) => i + 1).map((p) =>
                      p === f.page ? <span key={p} aria-current="page">{p}</span> : <a key={p} href={`/${lang}/search${qs(f, { page: p })}`}>{p}</a>
                    )}
                    {f.page < pages && <a href={`/${lang}/search${qs(f, { page: f.page + 1 })}`}>{m.next}</a>}
                  </nav>
                )}
              </>
            )}
            <MlsDisclaimer m={m} />
          </div>
        </section>
      </main>
      <Footer lang={lang} t={t} />
      <MobileBar lang={lang} t={t} member={Boolean(member)} />
    </MembershipProvider>
  );
}
