import { t as dictFor } from '@/lib/i18n';
import { getMemberId } from '@/lib/session';
import { getMember } from '@/lib/listings';
import MembershipProvider from '@/components/Membership';
import { Header, Footer } from '@/components/SiteChrome';
import MobileBar from '@/components/MobileBar';
import { WHATSAPP } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

const COPY = {
  en: {
    title: 'Thanks, got it!',
    unsubTitle: 'You’re unsubscribed',
    unsubText: 'You won’t get any more emails from me. You can still use the website anytime.',
    unsubFail: 'This link didn’t work. Reply to any of my emails and I’ll remove you right away.',
    text: {
      buy: 'Here’s where to start. When you see something you like, message me and I’ll set up a showing.',
      sell: 'A free home value estimate is the best first step. I’ll review it personally and get back to you.',
      rent: 'Here are the rentals across the GTA. Message me with your move-in date and budget and I’ll help you find one.',
      browse: 'No rush at all. Browse anytime, and I’ll send you homes I tour so you can get a feel for the market.',
    },
    cta: { buy: ['Search homes for sale', '/search'], sell: ['Get my home value', '/home-value'], rent: ['Search rentals', '/search?deal=lease'], browse: ['See homes I toured', '/listings'] },
    wa: 'WhatsApp me',
  },
  fa: {
    title: 'ممنون، دریافت شد!',
    unsubTitle: 'اشتراک شما لغو شد',
    unsubText: 'دیگر ایمیلی از من دریافت نمی‌کنید. هر وقت بخواهید می‌توانید از وب‌سایت استفاده کنید.',
    unsubFail: 'این لینک کار نکرد. به یکی از ایمیل‌های من جواب بدهید تا فوراً حذفتان کنم.',
    text: {
      buy: 'از اینجا شروع کنید. هر خانه‌ای که پسندیدید پیام بدهید تا بازدید را هماهنگ کنم.',
      sell: 'برآورد رایگان قیمت خانه بهترین قدم اول است. خودم بررسی می‌کنم و با شما تماس می‌گیرم.',
      rent: 'اینها خانه‌های اجاره‌ای سراسر GTA هستند. تاریخ نقل مکان و بودجه‌تان را برایم بفرستید تا کمکتان کنم.',
      browse: 'هیچ عجله‌ای نیست. هر وقت خواستید نگاه کنید؛ خانه‌هایی را که بازدید می‌کنم برایتان می‌فرستم تا با بازار آشنا شوید.',
    },
    cta: { buy: ['جستجوی خانه‌های فروشی', '/search'], sell: ['برآورد قیمت خانه من', '/home-value'], rent: ['جستجوی اجاره‌ای‌ها', '/search?deal=lease'], browse: ['خانه‌هایی که بازدید کرده‌ام', '/listings'] },
    wa: 'پیام در واتساپ',
  },
};

export default async function ThanksPage({ params, searchParams }) {
  const lang = params.lang;
  const t = dictFor(lang);
  const c = COPY[lang] || COPY.en;
  const member = await getMember(getMemberId());
  const unsub = searchParams?.u != null;
  const i = c.text[searchParams?.i] ? searchParams.i : 'browse';
  return (
    <MembershipProvider lang={lang} t={t}>
      <Header lang={lang} t={t} member={member} path="" />
      <main className="wrap" style={{ padding: '64px 16px 96px', maxWidth: 680 }}>
        {unsub ? (
          <>
            <h1>{searchParams.u === '1' ? c.unsubTitle : c.unsubFail}</h1>
            {searchParams.u === '1' && <p style={{ color: 'var(--muted)' }}>{c.unsubText}</p>}
          </>
        ) : (
          <>
            <h1>{c.title}</h1>
            <p style={{ color: 'var(--muted)', fontSize: 18 }}>{c.text[i]}</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
              <a className="btn btn-accent" href={`/${lang}${c.cta[i][1]}`}>{c.cta[i][0]}</a>
              <a className="btn btn-line" href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer">{c.wa}</a>
            </div>
          </>
        )}
      </main>
      <Footer lang={lang} t={t} />
      <MobileBar lang={lang} t={t} member={Boolean(member)} />
    </MembershipProvider>
  );
}
