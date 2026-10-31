import { t as dictFor } from '@/lib/i18n';
import { getMemberId } from '@/lib/session';
import { getMember } from '@/lib/listings';
import MembershipProvider from '@/components/Membership';
import { Header, Footer } from '@/components/SiteChrome';
import { TERMS_VERSION } from '@/lib/vow';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }) {
  return { title: params.lang === 'fa' ? 'شرایط استفاده از قیمت‌های فروش' : 'Terms of Use: sold prices', robots: { index: false } };
}

// Terms of Use for the members-only MLS® area (PropTx MLS® Rules 8.09–8.11, 8.15.03).
const EN = (
  <>
    <p>Version {TERMS_VERSION}. These terms apply to the password-protected sold prices area of johnjanjani.com (the “VOW”), operated by Purya (John) Janjani, Sales Representative, Century 21 Leading Edge Realty Inc., Brokerage, 1053 McNicoll Ave, Toronto, ON.</p>
    <p>By creating an account and clicking to accept these terms, you agree that:</p>
    <ol>
      <li><b>Our relationship.</b> You are entering into a lawful broker-consumer relationship with Purya (John) Janjani and Century 21 Leading Edge Realty Inc., Brokerage, which lets me provide you with real estate brokerage services, including access to this VOW. This relationship does not by itself make you my client under a representation agreement and does not cost you anything.</li>
      <li><b>Personal use only.</b> All information you get from this VOW is for your personal, non-commercial use.</li>
      <li><b>Genuine interest.</b> You have a bona fide interest in the purchase, sale or lease of real estate of the type offered through this VOW.</li>
      <li><b>No copying or AI.</b> You will not copy, redistribute or retransmit any of the information provided, and you will not enter it into or use it with any artificial intelligence (AI) system or technology, except as reasonably needed in connection with a potential purchase, sale or lease of a specific property you are considering.</li>
      <li><b>No sharing or republishing.</b> You will not display, publish, sell, license or transfer the information to anyone else, including to any AI system.</li>
      <li><b>No scraping.</b> You will not use any robot, spider, scraper, data-mining tool or similar automated or manual process to access, copy, collect or monitor the information.</li>
      <li><b>Ownership.</b> The MLS® information on this VOW is owned by and copyright of the Toronto Regional Real Estate Board (TRREB) and PropTx Innovations Inc. and other contributing boards, and you acknowledge their ownership and the validity of their copyright.</li>
      <li><b>Compliance checks.</b> You expressly authorize the Toronto Regional Real Estate Board, PropTx Innovations Inc. and other MLS® members (or their duly authorized representatives) to access this VOW to verify compliance with the MLS® rules and any other applicable rules or policies.</li>
      <li><b>No cost and no obligation.</b> Accepting these terms does not create any financial obligation and does not create a buyer or seller representation agreement. Any such agreement would be a separate written document.</li>
      <li><b>Your account.</b> Your account is for you only. Do not share your password. Passwords expire every 90 days and can be renewed. I may suspend an account that breaks these terms.</li>
      <li><b>Accuracy.</b> The information is deemed reliable but is not guaranteed accurate by PROPTX. Instant home value estimates are automated and approximate, not appraisals; ask me for a full evaluation before making decisions.</li>
      <li><b>Privacy.</b> Your information is handled as described in the <a href="/en/privacy">privacy policy</a>, which explains that account records and activity logs may be shared with TRREB and PropTx Innovations Inc. for auditing and legal purposes.</li>
    </ol>
    <p>Questions: 437-667-6652.</p>
  </>
);

const FA = (
  <>
    <p>نسخه {TERMS_VERSION}. نسخه انگلیسی این شرایط نسخه رسمی است و متن زیر ترجمه آن برای راحتی شماست. این شرایط برای بخش قیمت‌های فروش johnjanjani.com (وب‌سایت دفتر مجازی یا VOW) است که پوریا جان جانی، مشاور املاک در Century 21 Leading Edge Realty Inc., Brokerage به آدرس 1053 McNicoll Ave, Toronto, ON آن را اداره می‌کند.</p>
    <p>با ساخت حساب و پذیرش این شرایط، موافقت می‌کنید که:</p>
    <ol>
      <li><b>رابطه ما.</b> یک رابطه قانونی مشاور و مصرف‌کننده با پوریا جان جانی و Century 21 Leading Edge Realty Inc., Brokerage برقرار می‌کنید که به من امکان می‌دهد خدمات املاک، از جمله دسترسی به این بخش، را به شما ارائه کنم. این رابطه به تنهایی شما را مشتری تحت قرارداد نمایندگی نمی‌کند و هزینه‌ای ندارد.</li>
      <li><b>فقط استفاده شخصی.</b> همه اطلاعاتی که از این بخش می‌گیرید فقط برای استفاده شخصی و غیرتجاری شماست.</li>
      <li><b>قصد واقعی.</b> قصد واقعی خرید، فروش یا اجاره ملکی از نوعی که در این بخش ارائه می‌شود دارید.</li>
      <li><b>بدون کپی و هوش مصنوعی.</b> اطلاعات را کپی، بازنشر یا ارسال نمی‌کنید و آن را وارد هیچ سیستم یا فناوری هوش مصنوعی نمی‌کنید، مگر به اندازه لازم برای بررسی خرید، فروش یا اجاره یک ملک مشخص.</li>
      <li><b>بدون انتشار.</b> اطلاعات را به هیچ کس دیگری، از جمله هیچ سیستم هوش مصنوعی، نمایش، انتشار، فروش یا انتقال نمی‌دهید.</li>
      <li><b>بدون استخراج داده.</b> از هیچ ربات، اسکرپر یا ابزار استخراج داده خودکار یا دستی برای دسترسی، کپی یا جمع‌آوری اطلاعات استفاده نمی‌کنید.</li>
      <li><b>مالکیت.</b> اطلاعات MLS® این بخش متعلق به هیئت املاک منطقه‌ای تورنتو (TRREB) و PropTx Innovations Inc. و سایر هیئت‌هاست و حق کپی‌رایت آن را به رسمیت می‌شناسید.</li>
      <li><b>بررسی رعایت قوانین.</b> به TRREB، PropTx Innovations Inc. و سایر اعضای MLS® (یا نمایندگان مجاز آن‌ها) اجازه می‌دهید برای بررسی رعایت قوانین MLS® به این بخش دسترسی داشته باشند.</li>
      <li><b>بدون هزینه و تعهد.</b> پذیرش این شرایط هیچ تعهد مالی و هیچ قرارداد نمایندگی خرید یا فروش ایجاد نمی‌کند. چنین قراردادی یک سند کتبی جداگانه خواهد بود.</li>
      <li><b>حساب شما.</b> حساب فقط برای خود شماست. رمز عبور را به کسی ندهید. رمزها هر ۹۰ روز منقضی می‌شوند و قابل تمدیدند. حسابی که این شرایط را رعایت نکند ممکن است تعلیق شود.</li>
      <li><b>دقت اطلاعات.</b> این اطلاعات قابل اعتماد تلقی می‌شود اما صحت آن از طرف PROPTX تضمین نمی‌شود. برآورد فوری ارزش خانه خودکار و تقریبی است و ارزیابی رسمی نیست؛ پیش از تصمیم‌گیری از من ارزیابی کامل بخواهید.</li>
      <li><b>حریم خصوصی.</b> اطلاعات شما طبق <a href="/fa/privacy">سیاست حریم خصوصی</a> نگهداری می‌شود که توضیح می‌دهد سوابق حساب و فعالیت ممکن است برای حسابرسی و مقاصد قانونی در اختیار TRREB و PropTx Innovations Inc. قرار گیرد.</li>
    </ol>
    <p>پرسش‌ها: <span className="ltr">437-667-6652</span></p>
  </>
);

export default async function VowTerms({ params }) {
  const lang = params.lang;
  const t = dictFor(lang);
  const member = await getMember(getMemberId());
  return (
    <MembershipProvider lang={lang} t={t}>
      <Header lang={lang} t={t} member={member} path="/vow-terms" />
      <main className="wrap legal">
        <h1>{lang === 'fa' ? 'شرایط استفاده از بخش قیمت‌های فروش' : 'Terms of Use: sold prices area'}</h1>
        {lang === 'fa' ? FA : EN}
      </main>
      <Footer lang={lang} t={t} />
    </MembershipProvider>
  );
}
