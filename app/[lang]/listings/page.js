import { t as dictFor } from '@/lib/i18n';
import { getMemberId } from '@/lib/session';
import { getListings, getMember, splitListings } from '@/lib/listings';
import MembershipProvider from '@/components/Membership';
import ListingsGrid from '@/components/ListingsGrid';
import { Header, Footer } from '@/components/SiteChrome';
import MobileBar from '@/components/MobileBar';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }) {
  const t = dictFor(params.lang);
  return {
    title: t.seo.tours,
    alternates: { canonical: `/${params.lang}/listings`, languages: { en: '/en/listings', fa: '/fa/listings' } },
  };
}

// All toured homes (with codes), with filters and code search.
export default async function ToursPage({ params }) {
  const lang = params.lang;
  const t = dictFor(lang);
  const member = await getMember(getMemberId());
  const { tours } = splitListings(await getListings(Boolean(member)), lang);
  return (
    <MembershipProvider lang={lang} t={t}>
      <Header lang={lang} t={t} member={member} path="/listings" />
      <main>
        <section className="block list-page" id="listings">
          <div className="wrap">
            <a className="back" href={`/${lang}`}>{t.backHome}</a>
            <ListingsGrid listings={tours} t={t} lang={lang} isMember={Boolean(member)} heading="h1" />
          </div>
        </section>
      </main>
      <Footer lang={lang} t={t} />
      <MobileBar lang={lang} t={t} member={Boolean(member)} />
    </MembershipProvider>
  );
}
