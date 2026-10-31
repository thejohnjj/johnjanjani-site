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
    <p>Last updated: October 31, 2026</p>
    <p>
      This website is run by Purya (John) Janjani, Sales Representative with Century 21 Leading Edge Realty Inc., Brokerage,
      1053 McNicoll Ave, Toronto, ON. This policy explains what personal information I collect on johnjanjani.com and how I use it.
    </p>
    <h2>What I collect</h2>
    <ul>
      <li>When you become a member: your name, email address, phone number, preferred language, and the date you agreed to be contacted.</li>
      <li>While you are signed in: which listings you view and any showing requests you send.</li>
      <li>When you ask for a home value estimate: your property’s address and details, your timeline, and your name, email and phone number.</li>
      <li>When you open the buyer guide: your name, email, and optionally your phone number and where you are in your home search.</li>
      <li>When you create a sold-prices account: your name, email, phone, a password (stored only in scrambled, one-way form, never readable), the dates you confirmed your email, accepted the Terms of Use and last set your password, and a log of the searches and listing pages you open while signed in.</li>
      <li>Small cookies that keep you signed in and remember that you unlocked the guide.</li>
      <li>Analytics and advertising cookies: this website uses Google Analytics to understand which pages are useful, and the Meta Pixel to measure and show ads on Facebook and Instagram to people who visited. They collect information such as the pages you view and your device type, not your name. You can block them in your browser settings or with an ad blocker.</li>
      <li>Listing pages may show Instagram videos. Instagram (Meta) may set its own cookies when you play them.</li>
    </ul>
    <h2>Why I collect it</h2>
    <ul>
      <li>To show members the price and address of my listings.</li>
      <li>To contact you about listings, showings and real estate services you asked about.</li>
      <li>To send you new listings and market updates, if you agreed to receive them.</li>
      <li>To prepare and send the home value estimate you asked for.</li>
    </ul>
    <h2>Who can see it</h2>
    <p>
      Only I can see your information. It is stored with my service providers (Supabase for the database, Vercel for hosting, Resend for
      sending emails and Zoho CRM for keeping track of my clients), who keep it on my behalf. I never sell or rent your information. I may share it with my brokerage when the law or my professional
      obligations require it.
    </p>
    <div className="vow-privacy">
      <h2>Sold prices account (MLS® Virtual Office Website)</h2>
      <p>
        <b>
          Sold prices and other MLS® information on this website come from the MLS® System of the Toronto Regional Real Estate Board (TRREB),
          delivered by PropTx Innovations Inc. To meet the MLS® rules, your account information (name, email, username and password records)
          and the log of your activity on the sold-prices pages may be shared with TRREB and PropTx Innovations Inc. for auditing, compliance
          or legal purposes.
        </b>
      </p>
      <p>
        <b>
          The MLS® rules also require me to keep these account records for at least 180 days after your password expires. By creating an
          account you consent to this.
        </b>
      </p>
    </div>
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
    <p>آخرین به‌روزرسانی: ۳۱ اکتبر ۲۰۲۶</p>
    <p>
      این وب‌سایت توسط پوریا جان جانی، مشاور املاک در Century 21 Leading Edge Realty Inc., Brokerage به آدرس 1053 McNicoll Ave, Toronto, ON
      اداره می‌شود. در این صفحه توضیح می‌دهم چه اطلاعاتی در johnjanjani.com جمع می‌کنم و چطور از آن استفاده می‌کنم.
    </p>
    <h2>چه اطلاعاتی جمع می‌کنم</h2>
    <ul>
      <li>هنگام عضویت: نام، ایمیل، شماره تلفن، زبان دلخواه و تاریخی که با تماس من موافقت کردید.</li>
      <li>وقتی وارد حساب هستید: لیستینگ‌هایی که می‌بینید و درخواست‌های بازدیدی که می‌فرستید.</li>
      <li>هنگام درخواست برآورد قیمت خانه: آدرس و مشخصات ملک، زمان‌بندی فروش و نام، ایمیل و شماره تلفن شما.</li>
      <li>هنگام باز کردن راهنمای خرید: نام و ایمیل، و در صورت تمایل شماره تلفن و مرحله‌ای که در خرید خانه هستید.</li>
      <li>هنگام ساخت حساب قیمت‌های فروش: نام، ایمیل، تلفن، رمز عبور (فقط به شکل رمزگذاری‌شده یک‌طرفه و غیرقابل خواندن)، تاریخ تأیید ایمیل، پذیرش شرایط استفاده و آخرین تغییر رمز، و سابقه جستجوها و صفحه‌هایی که هنگام ورود باز می‌کنید.</li>
      <li>کوکی‌های کوچکی که شما را وارد نگه می‌دارند و به یاد می‌سپارند که راهنما را باز کرده‌اید.</li>
      <li>کوکی‌های آماری و تبلیغاتی: این سایت از Google Analytics برای فهمیدن اینکه کدام صفحه‌ها مفیدند، و از Meta Pixel برای سنجش و نمایش تبلیغ در فیس‌بوک و اینستاگرام به کسانی که از سایت بازدید کرده‌اند استفاده می‌کند. این ابزارها اطلاعاتی مثل صفحه‌های دیده‌شده و نوع دستگاه را جمع می‌کنند، نه نام شما را. می‌توانید آن‌ها را در تنظیمات مرورگر یا با مسدودکننده تبلیغات غیرفعال کنید.</li>
      <li>صفحه لیستینگ‌ها ممکن است ویدیوی اینستاگرام نشان دهد. اینستاگرام (Meta) هنگام پخش ممکن است کوکی‌های خودش را ذخیره کند.</li>
    </ul>
    <h2>چرا جمع می‌کنم</h2>
    <ul>
      <li>برای نمایش قیمت و آدرس لیستینگ‌ها به اعضا.</li>
      <li>برای تماس با شما درباره لیستینگ‌ها، بازدیدها و خدماتی که درخواست کرده‌اید.</li>
      <li>برای فرستادن لیستینگ‌های جدید و خبرهای بازار، اگر با آن موافقت کرده باشید.</li>
      <li>برای آماده کردن و فرستادن برآورد قیمتی که درخواست کرده‌اید.</li>
    </ul>
    <h2>چه کسی به آن دسترسی دارد</h2>
    <p>
      فقط من اطلاعات شما را می‌بینم. این اطلاعات نزد ارائه‌دهندگان خدمات من (Supabase برای پایگاه داده، Vercel برای میزبانی، Resend برای ارسال ایمیل و Zoho CRM برای پیگیری مشتریان) نگهداری می‌شود.
      اطلاعات شما را هرگز نمی‌فروشم و اجاره نمی‌دهم. فقط در صورتی که قانون یا تعهدات حرفه‌ای‌ام لازم بداند، ممکن است با کارگزاری‌ام در میان بگذارم.
    </p>
    <div className="vow-privacy">
      <h2>حساب قیمت‌های فروش (وب‌سایت دفتر مجازی MLS®)</h2>
      <p>
        <b>
          قیمت‌های فروش و سایر اطلاعات MLS® در این سایت از سیستم MLS® هیئت املاک منطقه‌ای تورنتو (TRREB) و از طریق PropTx Innovations Inc. ارائه می‌شود.
          طبق قوانین MLS®، اطلاعات حساب شما (نام، ایمیل، نام کاربری و سوابق رمز عبور) و سابقه فعالیت شما در صفحه‌های قیمت فروش ممکن است برای حسابرسی،
          بررسی رعایت قوانین یا مقاصد قانونی در اختیار TRREB و PropTx Innovations Inc. قرار گیرد.
        </b>
      </p>
      <p>
        <b>قوانین MLS® همچنین من را ملزم می‌کند این سوابق را تا حداقل ۱۸۰ روز پس از انقضای رمز عبور شما نگه دارم. با ساخت حساب با این موضوع موافقت می‌کنید.</b>
      </p>
    </div>
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
