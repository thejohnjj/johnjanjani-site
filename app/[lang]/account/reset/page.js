import { t as dictFor } from '@/lib/i18n';
import MembershipProvider from '@/components/Membership';
import { Header, Footer } from '@/components/SiteChrome';
import { ResetForm } from '@/components/VowGate';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false } };

export default function ResetPage({ params, searchParams }) {
  const lang = params.lang;
  const t = dictFor(lang);
  return (
    <MembershipProvider lang={lang} t={t}>
      <Header lang={lang} t={t} member={null} path="/account" />
      <main className="wrap" style={{ paddingBlock: '48px 80px', maxWidth: 520 }}>
        <ResetForm lang={lang} m={String(searchParams?.m || '')} e={String(searchParams?.e || '')} s={String(searchParams?.s || '')} />
      </main>
      <Footer lang={lang} t={t} />
    </MembershipProvider>
  );
}
