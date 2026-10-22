import { t as dictFor } from '@/lib/i18n';
import { getMemberId } from '@/lib/session';
import { getListings, getMember, splitListings } from '@/lib/listings';
import MembershipProvider, { JoinButton } from '@/components/Membership';
import PicksGrid from '@/components/PicksGrid';
import { Header, Footer } from '@/components/SiteChrome';
import MobileBar from '@/components/MobileBar';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }) {
  const t = dictFor(params.lang);
  return {
    title: t.seo.picks,
    description: t.pkLead,
    alternates: { canonical: `/${params.lang}/picks`, languages: { en: '/en/picks', fa: '/fa/picks' } },
  };
}

// All daily picks, with area tabs.
export default async function PicksPage({ params }) {
  const lang = params.lang;
  const t = dictFor(lang);
  const member = await getMember(getMemberId());
  const { picks } = splitListings(await getListings(Boolean(member)), lang);
  return (
    <MembershipProvider lang={lang} t={t}>
      <Header lang={lang} t={t} member={member} path="/picks" />
      <main>
        <section className="block picks list-page" id="picks">
          <div className="wrap">
            <a className="back light" href={`/${lang}`}>{t.backHome}</a>
            {!member && (
              <div className="banner">
                <p>
                  <strong>{t.bannerTitle}</strong>
                  <br />
                  <span>{t.bannerText}</span>
                </p>
                <JoinButton className="btn btn-ink" label={t.join} />
              </div>
            )}
            {picks.length ? (
              <PicksGrid picks={picks} t={t} lang={lang} heading="h1" />
            ) : (
              <div className="empty"><h1>{t.pkTitle}</h1><p>{t.emptyText}</p></div>
            )}
          </div>
        </section>
      </main>
      <Footer lang={lang} t={t} />
      <MobileBar lang={lang} t={t} member={Boolean(member)} />
    </MembershipProvider>
  );
}
