import { redirect } from 'next/navigation';
import { t as dictFor } from '@/lib/i18n';
import { vowT } from '@/lib/i18n-vow';
import { getMemberId } from '@/lib/session';
import { getMember } from '@/lib/listings';
import { getVowAccess } from '@/lib/vow';
import MembershipProvider from '@/components/Membership';
import { Header, Footer } from '@/components/SiteChrome';
import MobileBar from '@/components/MobileBar';
import VowGate from '@/components/VowGate';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false } };

export default async function AccountPage({ params, searchParams }) {
  const lang = params.lang;
  const t = dictFor(lang);
  const v = vowT(lang);
  const access = await getVowAccess();
  const next = typeof searchParams?.next === 'string' && searchParams.next.startsWith(`/${lang}/`) ? searchParams.next : `/${lang}/sold`;
  if (access.status === 'ok') redirect(next);
  const member = await getMember(getMemberId());
  const initial = access.status === 'expired' || access.status === 'terms' ? 'expired' : searchParams?.mode === 'login' ? 'login' : 'signup';
  return (
    <MembershipProvider lang={lang} t={t}>
      <Header lang={lang} t={t} member={member} path="/account" />
      <main className="wrap" style={{ paddingBlock: '40px 80px' }}>
        {searchParams?.state === 'link-expired' && <p className="vow-note">{v.linkExpired}</p>}
        <VowGate lang={lang} initial={initial} email={access.member?.email || member?.email || ''} next={next} />
      </main>
      <Footer lang={lang} t={t} />
      <MobileBar lang={lang} t={t} member={Boolean(member)} />
    </MembershipProvider>
  );
}
