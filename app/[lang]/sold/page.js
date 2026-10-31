import { t as dictFor } from '@/lib/i18n';
import { mlsT } from '@/lib/i18n-mls';
import { vowT } from '@/lib/i18n-vow';
import { getMemberId } from '@/lib/session';
import { getMember } from '@/lib/listings';
import { getVowAccess } from '@/lib/vow';
import { readSoldFilters, searchSold, marketSnapshot } from '@/lib/vow-data';
import { PAGE_SIZE, MAX_RESULTS } from '@/lib/proptx';
import { AREAS } from '@/lib/mls-options';
import { guardFeedView } from '@/lib/feed-guard';
import MembershipProvider from '@/components/Membership';
import { Header, Footer } from '@/components/SiteChrome';
import MobileBar from '@/components/MobileBar';
import { MlsDisclaimer } from '@/components/MlsCard';
import SoldCard, { Snapshot, VowCopyright } from '@/components/SoldCard';
import VowGate from '@/components/VowGate';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }) {
  const s = vowT(params.lang).sold;
  // Members-only content: never indexed.
  return { title: s.title, description: s.lead, robots: { index: false, follow: false } };
}

function qs(f, over = {}) {
  const v = { ...f, ...over };
  const p = new URLSearchParams();
  if (v.deal === 'lease') p.set('deal', 'lease');
  for (const k of ['area', 'q', 'type', 'beds', 'baths']) if (v[k]) p.set(k, v[k]);
  if (v.months && v.months !== 6) p.set('months', v.months);
  if (v.sort && v.sort !== 'recent') p.set('sort', v.sort);
  if (v.page && v.page > 1) p.set('page', v.page);
  const s = p.toString();
  return s ? `?${s}` : '';
}

export default async function SoldPage({ params, searchParams }) {
  const lang = params.lang;
  const t = dictFor(lang);
  const m = mlsT(lang);
  const v = vowT(lang);
  const s = v.sold;
  const member = await getMember(getMemberId());
  const access = await getVowAccess();
  const f = readSoldFilters(searchParams);
  const ok = access.status === 'ok';
  const allowed = ok ? await guardFeedView({ action: 'sold_search', kind: 'vow', memberId: access.member?.id || null }) : true;
  const [res, snap] = ok && allowed ? await Promise.all([searchSold(f), marketSnapshot(f)]) : [null, null];
  const shown = res ? Math.min(res.total, MAX_RESULTS) : 0;
  const pages = Math.ceil(shown / PAGE_SIZE);
  const typeLabel = f.type ? m.types[f.type] : '';

  return (
    <MembershipProvider lang={lang} t={t}>
      <Header lang={lang} t={t} member={member} path={`/sold${qs(f)}`} />
      <main>
        <section className="block list-page">
          <div className="wrap">
            <a className="back" href={`/${lang}`}>{t.backHome}</a>
            <h1>{s.title}</h1>
            <p style={{ color: 'var(--muted)', margin: '6px 0 18px' }}>{s.lead}</p>

            {!ok ? (
              <VowGate lang={lang} initial={access.status === 'expired' || access.status === 'terms' ? 'expired' : access.status === 'unverified' ? 'unverified' : 'signup'} email={access.member?.email || member?.email || ''} />
            ) : (
              <>
                {searchParams?.welcome && <p className="vow-note">{s.welcome}</p>}
                <form className="mls-search" method="get" action={`/${lang}/sold`}>
                  <div className="mls-deal" role="radiogroup">
                    <label><input type="radio" name="deal" value="sale" defaultChecked={f.deal === 'sale'} /> {s.sale}</label>
                    <label><input type="radio" name="deal" value="lease" defaultChecked={f.deal === 'lease'} /> {s.lease}</label>
                  </div>
                  <label className="wide">{m.keyword}<input type="search" name="q" defaultValue={f.q} maxLength={40} dir="auto" /></label>
                  <label>{m.area}
                    <select name="area" defaultValue={f.area}>
                      <option value="">{m.anyArea}</option>
                      {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </label>
                  <label>{m.type}
                    <select name="type" defaultValue={f.type}>
                      <option value="">{m.anyType}</option>
                      {Object.entries(m.types).map(([k, val]) => <option key={k} value={k}>{val}</option>)}
                    </select>
                  </label>
                  <label>{s.months}
                    <select name="months" defaultValue={f.months}>
                      {Object.entries(s.monthOpts).map(([k, val]) => <option key={k} value={k}>{val}</option>)}
                    </select>
                  </label>
                  <label>{m.beds}
                    <select name="beds" defaultValue={f.beds || ''}>
                      <option value="">{m.any}</option>
                      {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}
                    </select>
                  </label>
                  <label>{m.baths}
                    <select name="baths" defaultValue={f.baths || ''}>
                      <option value="">{m.any}</option>
                      {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}+</option>)}
                    </select>
                  </label>
                  <label>{m.sort}
                    <select name="sort" defaultValue={f.sort}>
                      {Object.entries(s.sorts).map(([k, val]) => <option key={k} value={k}>{val}</option>)}
                    </select>
                  </label>
                  <div className="actions">
                    <button className="btn btn-accent" type="submit">{m.search}</button>
                    <a className="btn btn-line" href={`/${lang}/sold`}>{m.reset}</a>
                  </div>
                </form>

                {!allowed && <p className="mls-count">{m.blocked}</p>}
                {res && !res.ok && <p className="mls-count">{m.error}</p>}
                {res?.ok && (
                  <>
                    <Snapshot snap={snap} s={s} lang={lang} where={f.area || s.anyArea} typeLabel={typeLabel} />
                    <a className="est-cta" href={`/${lang}/estimate${f.area ? `?area=${encodeURIComponent(f.area)}` : ''}`}>
                      <b>{s.estimateCta}</b><span>{s.estimateCtaText}</span><span aria-hidden="true">{lang === 'fa' ? '←' : '→'}</span>
                    </a>
                    <p className="mls-count">
                      {res.total ? s.found.replace('{n}', res.total.toLocaleString('en-US')).replace('{s}', f.deal === 'lease' ? s.lease.toLowerCase() : s.sale.toLowerCase()) : s.none}
                      {res.total > MAX_RESULTS ? ` ${s.capped}` : ''}
                    </p>
                    <div className="mls-grid">
                      {res.items.map((l) => <SoldCard key={l.key} l={l} s={s} m={m} lang={lang} />)}
                    </div>
                    {pages > 1 && (
                      <nav className="mls-pages" aria-label="Pages">
                        {f.page > 1 && <a href={`/${lang}/sold${qs(f, { page: f.page - 1 })}`}>{m.prev}</a>}
                        {Array.from({ length: pages }, (_, i) => i + 1).map((p) =>
                          p === f.page ? <span key={p} aria-current="page">{p}</span> : <a key={p} href={`/${lang}/sold${qs(f, { page: p })}`}>{p}</a>
                        )}
                        {f.page < pages && <a href={`/${lang}/sold${qs(f, { page: f.page + 1 })}`}>{m.next}</a>}
                      </nav>
                    )}
                  </>
                )}
              </>
            )}
            <MlsDisclaimer m={m} />
            <VowCopyright s={s} />
          </div>
        </section>
      </main>
      <Footer lang={lang} t={t} />
      <MobileBar lang={lang} t={t} member={Boolean(member)} />
    </MembershipProvider>
  );
}
