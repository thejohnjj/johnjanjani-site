import { t as dictFor } from '@/lib/i18n';
import { getMemberId } from '@/lib/session';
import { getMember } from '@/lib/listings';
import MembershipProvider from '@/components/Membership';
import { Header, Footer } from '@/components/SiteChrome';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }) {
  return { title: dictFor(params.lang).privacyTitle, alternates: { canonical: `/${params.lang}/privacy` } };
}

const EN = (
  <>
    <p>Last updated: October 2026</p>
    <p>
      This website is run by Purya (John) Janjani, Sales Representative with Century 21 Leading Edge Realty Inc., Brokerage,
      1053 McNicoll Ave, Toronto, ON. This policy explains what personal information I collect on johnjanjani.com and how I use it.
    </p>
    <h2>What I collect</h2>
    <ul>
      <li>When you become a member: your name, email address, phone number, preferred language, and the date you agreed to be contacted.</li>
      <li>While you are signed in: which listings you view and any showing requests you send.</li>
      <li>A small cookie that keeps you signed in on this device. I do not use advertising cookies.</li>
    </ul>
    <h2>Why I collect it</h2>
    <ul>
      <li>To show members the price and address of my listings.</li>
      <li>To contact you about listings, showings and real estate services you asked about.</li>
      <li>To send you new listings and market updates, if you agreed to receive them.</li>
    </ul>
    <h2>Who can see it</h2>
    <p>
      Only I can see your information. It is stored with my service providers (Supabase for the database and Vercel for hosting), who
      keep it on my behalf. I never sell or rent your information. I may share it with my brokerage when the law or my professional
      obligations require it.
    </p>
    <h2>Your choices</h2>
    <ul>
      <li>You can stop emails or calls at any time by replying “unsubscribe” or telling me by phone.</li>
      <li>You can ask to see, correct or delete your information. Call or text 437-667-6652 and I will respond within 30 days.</li>
      <li>You can sign out at any time, which removes the sign-in cookie from your device.</li>
    </ul>
    <h2>Keeping it safe</h2>
    <p>
      Your information is sent over an encrypted connection and stored in a database that only this website’s server can access. I keep
      member information while you remain interested in buying, selling or renting, and delete it on request.
    </p>
    <h2>Questions or complaints</h2>
    <p>
      Contact me at 437-667-6652. If you are not satisfied with my answer, you can contact the Office of the Privacy Commissioner of Canada
      at priv.gc.ca.
    </p>
  </>
);

const FA = (
  <>
    <p>آخرین به‌روزرسانی: اکتبر ۲۰۲۶</p>
    <p>
      این وب‌سایت توسط پوریا جانجانی، مشاور املاک در Century 21 Leading Edge Realty Inc., Brokerage به آدرس 1053 McNicoll Ave, Toronto, ON
      اداره می‌شود. در این صفحه توضیح می‌دهم چه اطلاعاتی در johnjanjani.com جمع می‌کنم و چطور از آن استفاده می‌کنم.
    </p>
    <h2>چه اطلاعاتی جمع می‌کنم</h2>
    <ul>
      <li>هنگام عضویت: نام، ایمیل، شماره تلفن، زبان دلخواه و تاریخی که با تماس من موافقت کردید.</li>
      <li>وقتی وارد حساب هستید: لیستینگ‌هایی که می‌بینید و درخواست‌های بازدیدی که می‌فرستید.</li>
      <li>یک کوکی کوچک که شما را روی همین دستگاه وارد نگه می‌دارد. از کوکی تبلیغاتی استفاده نمی‌کنم.</li>
    </ul>
    <h2>چرا جمع می‌کنم</h2>
    <ul>
      <li>برای نمایش قیمت و آدرس لیستینگ‌ها به اعضا.</li>
      <li>برای تماس با شما درباره لیستینگ‌ها، بازدیدها و خدماتی که درخواست کرده‌اید.</li>
      <li>برای فرستادن لیستینگ‌های جدید و خبرهای بازار، اگر با آن موافقت کرده باشید.</li>
    </ul>
    <h2>چه کسی به آن دسترسی دارد</h2>
    <p>
      فقط من اطلاعات شما را می‌بینم. این اطلاعات نزد ارائه‌دهندگان خدمات من (Supabase برای پایگاه داده و Vercel برای میزبانی) نگهداری می‌شود.
      اطلاعات شما را هرگز نمی‌فروشم و اجاره نمی‌دهم. فقط در صورتی که قانون یا تعهدات حرفه‌ای‌ام لازم بداند، ممکن است با کارگزاری‌ام در میان بگذارم.
    </p>
    <h2>اختیار با شماست</h2>
    <ul>
      <li>هر زمان بخواهید می‌توانید دریافت ایمیل یا تماس را لغو کنید؛ کافی است «لغو» را جواب بدهید یا تلفنی بگویید.</li>
      <li>می‌توانید دیدن، اصلاح یا حذف اطلاعاتتان را درخواست کنید. با <span className="ltr">437-667-6652</span> تماس بگیرید یا پیام بدهید؛ ظرف ۳۰ روز پاسخ می‌دهم.</li>
      <li>هر زمان بخواهید می‌توانید از حساب خارج شوید تا کوکی ورود از دستگاه شما پاک شود.</li>
    </ul>
    <h2>امنیت اطلاعات</h2>
    <p>
      اطلاعات شما از طریق اتصال رمزگذاری‌شده ارسال و در پایگاه داده‌ای نگهداری می‌شود که فقط سرور این سایت به آن دسترسی دارد. اطلاعات اعضا را تا زمانی
      که به خرید، فروش یا اجاره علاقه دارید نگه می‌دارم و در صورت درخواست حذف می‌کنم.
    </p>
    <h2>پرسش یا شکایت</h2>
    <p>
      با شماره <span className="ltr">437-667-6652</span> با من تماس بگیرید. اگر از پاسخ من راضی نبودید، می‌توانید با دفتر کمیسیونر حریم خصوصی کانادا
      (priv.gc.ca) تماس بگیرید.
    </p>
  </>
);

export default async function Privacy({ params }) {
  const lang = params.lang;
  const t = dictFor(lang);
  const member = await getMember(getMemberId());
  return (
    <MembershipProvider lang={lang} t={t}>
      <Header lang={lang} t={t} member={member} path="/privacy" />
      <main className="wrap legal">
        <h1>{t.privacyTitle}</h1>
        {lang === 'fa' ? FA : EN}
      </main>
      <Footer lang={lang} t={t} />
    </MembershipProvider>
  );
}
