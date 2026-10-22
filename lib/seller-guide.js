// "Selling your home in Ontario" guide, English and Farsi. Rules as of October 2026.

export const SELLER_GUIDE = {
  en: [
    {
      id: 'numbers',
      title: '1. Know what you’ll walk away with',
      intro: 'Before you list, work out your net proceeds: the sale price minus your mortgage balance and selling costs. Start with a realistic price based on recent sales of similar homes nearby, not list prices or online estimates.',
      table: {
        head: ['Selling cost', 'What to expect'],
        rows: [
          ['Real estate commission', 'Negotiable and set in your listing agreement; 13% HST is added'],
          ['Lawyer fees and disbursements', 'Usually about $1,000 to $1,800'],
          ['Mortgage discharge fees', 'Usually a few hundred dollars'],
          ['Mortgage prepayment penalty', 'Only if you break your mortgage early; can be thousands'],
          ['Preparing the home', 'Repairs, paint, cleaning, staging: depends on the home'],
          ['Moving', 'Movers, storage, any overlap between homes'],
        ],
      },
      items: [
        'Sellers in Ontario don’t pay land transfer tax; the buyer does.',
        'Mortgage penalties: on a variable rate it’s often 3 months’ interest; on a fixed rate it’s often the greater of 3 months’ interest or the interest rate differential (IRD), which can be much higher. Ask your lender for a payout statement early.',
        'If you’re moving to another home, ask whether you can port your mortgage to the new property to avoid the penalty.',
      ],
      tip: 'I can prepare a free home value estimate for you based on real recent sales near you, so you know your numbers before deciding anything.',
    },
    {
      id: 'taxes',
      title: '2. Taxes when you sell',
      items: [
        'Your principal residence: if the home was your principal residence for every year you owned it, the gain is generally tax-free. You still have to report the sale on your tax return (Schedule 3 and Form T2091).',
        'Rental or investment property: the profit is usually a capital gain, and generally half of it is taxable.',
        'Owned less than 365 days: under the federal anti-flipping rule, the whole profit is taxed as business income and the principal residence exemption doesn’t apply, unless you sell because of a life event such as a death, separation, a birth or a family member moving in, serious illness, losing your job or relocating for work or school.',
        'Non-residents of Canada: the buyer’s lawyer usually holds back part of the price (commonly 25%) until you get a clearance certificate from the CRA. Start this early with an accountant.',
      ],
      tip: 'If any of these apply to you, talk to an accountant before you list. A short conversation can save a lot of money.',
    },
    {
      id: 'price',
      title: '3. Price it right from day one',
      items: [
        'Most buyer attention comes in the first one to two weeks on the market. A home that sits too long often sells for less.',
        'Two common strategies in the GTA: list at market value and accept offers any time, or set an offer date about a week after listing to invite competing offers. I’ll recommend one based on your home, your area and the market that week.',
        'Pricing too high usually leads to price drops, and buyers notice them.',
        'Look at what similar homes actually sold for, how long they took, and what is competing with you right now.',
      ],
    },
    {
      id: 'prepare',
      title: '4. Prepare your home',
      items: [
        'Declutter, deep clean and fix small things: dripping taps, burned-out bulbs, loose handles, scuffed walls.',
        'Fresh, neutral paint where it’s needed gives the best return for the money.',
        'Consider a pre-listing home inspection. You find problems first and buyers can make firmer offers.',
        'Staging the main rooms (living room, kitchen and primary bedroom) helps buyers picture themselves there.',
        'Selling a condo: order the status certificate early so it’s ready when buyers ask for it.',
      ],
    },
    {
      id: 'marketing',
      title: '5. Marketing and showings',
      items: [
        'Professional photos, video and a floor plan. Most buyers decide from the photos whether to visit.',
        'Your listing goes on MLS® and REALTOR.ca, plus my website and Instagram home tours in English and Farsi.',
        'Showings are booked through a showing system. Keep the home ready and leave during visits so buyers feel comfortable.',
        'Open houses on the first weekends bring the most traffic.',
      ],
    },
    {
      id: 'offers',
      title: '6. Offers, negotiation and closing',
      items: [
        'Compare offers on more than price: the deposit (usually around 5%, due within 24 hours of acceptance), conditions such as financing or inspection, the closing date and what’s included.',
        'A firm offer with no conditions is more certain. A conditional offer can still fall through.',
        'Once the deal is firm, your lawyer prepares the documents, pays off your mortgage from the sale proceeds and sends you the balance on closing day.',
        'Buying and selling at the same time: a bridge loan from your lender can cover the gap if you close on your new home first.',
      ],
    },
    {
      id: 'mistakes',
      title: '7. Mistakes to avoid',
      items: [
        'Overpricing at the start and chasing the market down.',
        'Skipping repairs that the buyer’s inspector will find anyway.',
        'Poor photos, or listing before the home is ready.',
        'Not knowing your mortgage penalty and net proceeds before you list.',
        'Choosing the highest price without checking the deposit, conditions and closing date.',
      ],
    },
  ],

  fa: [
    {
      id: 'numbers',
      title: '۱. بدانید در نهایت چقدر دستتان را می‌گیرد',
      intro: 'پیش از لیست کردن، خالص فروش را حساب کنید: قیمت فروش منهای مانده وام و هزینه‌های فروش. با یک قیمت واقعی شروع کنید، بر اساس فروش‌های اخیر خانه‌های مشابه اطرافتان، نه قیمت‌های پیشنهادی یا تخمین‌های آنلاین.',
      table: {
        head: ['هزینه فروش', 'چه انتظاری داشته باشید'],
        rows: [
          ['کمیسیون املاک', 'قابل مذاکره و در قرارداد لیست تعیین می‌شود؛ ۱۳٪ HST به آن اضافه می‌شود'],
          ['هزینه وکیل و هزینه‌های جانبی', 'معمولاً حدود ۱٬۰۰۰ تا ۱٬۸۰۰ دلار'],
          ['هزینه آزادسازی وام', 'معمولاً چند صد دلار'],
          ['جریمه تسویه زودهنگام وام', 'فقط اگر وام را پیش از موعد ببندید؛ ممکن است چند هزار دلار باشد'],
          ['آماده‌سازی خانه', 'تعمیرات، رنگ، نظافت، چیدمان: بستگی به خانه دارد'],
          ['اسباب‌کشی', 'باربری، انبار و هر هم‌پوشانی بین دو خانه'],
        ],
      },
      items: [
        'در انتاریو فروشنده مالیات انتقال ملک نمی‌پردازد؛ این مالیات با خریدار است.',
        'جریمه وام: در وام با نرخ متغیر معمولاً بهره ۳ ماه است؛ در نرخ ثابت معمولاً بیشترِ بهره ۳ ماه یا «تفاوت نرخ بهره» (IRD) است که می‌تواند خیلی بیشتر باشد. زود از بانک صورت‌حساب تسویه (Payout Statement) بگیرید.',
        'اگر خانه دیگری می‌خرید، بپرسید آیا می‌توانید وام را به خانه جدید منتقل کنید (Port) تا جریمه ندهید.',
      ],
      tip: 'می‌توانم بر اساس فروش‌های واقعی اخیر اطرافتان یک برآورد قیمت رایگان برایتان آماده کنم تا پیش از هر تصمیمی اعدادتان را بدانید.',
    },
    {
      id: 'taxes',
      title: '۲. مالیات هنگام فروش',
      items: [
        'محل سکونت اصلی: اگر خانه در تمام سال‌هایی که مالکش بوده‌اید محل سکونت اصلی‌تان بوده، سود فروش معمولاً معاف از مالیات است. با این حال باید فروش را در اظهارنامه مالیاتی گزارش کنید (Schedule 3 و فرم T2091).',
        'ملک اجاره‌ای یا سرمایه‌گذاری: سود معمولاً «سود سرمایه» است و معمولاً نصف آن مشمول مالیات می‌شود.',
        'مالکیت کمتر از ۳۶۵ روز: طبق قانون فدرال ضدِ خرید و فروش سریع (Anti-flipping)، کل سود به‌عنوان درآمد تجاری مالیات می‌خورد و معافیت محل سکونت اصلی اعمال نمی‌شود؛ مگر اینکه فروش به دلیل یک رویداد زندگی باشد، مثل فوت، جدایی، تولد فرزند یا آمدن یکی از اعضای خانواده، بیماری جدی، از دست دادن کار یا جابه‌جایی برای کار یا تحصیل.',
        'غیرمقیمان کانادا: وکیل خریدار معمولاً بخشی از قیمت (اغلب ۲۵٪) را نگه می‌دارد تا گواهی تسویه (Clearance Certificate) از CRA بگیرید. این کار را زود با یک حسابدار شروع کنید.',
      ],
      tip: 'اگر یکی از این موارد شامل حالتان می‌شود، پیش از لیست کردن با حسابدار صحبت کنید. یک گفت‌وگوی کوتاه می‌تواند پول زیادی برایتان ذخیره کند.',
    },
    {
      id: 'price',
      title: '۳. از روز اول قیمت درست بگذارید',
      items: [
        'بیشترین توجه خریداران در یکی دو هفته اول است. خانه‌ای که زیاد در بازار بماند معمولاً ارزان‌تر فروش می‌رود.',
        'دو روش رایج در تورنتو بزرگ: لیست با قیمت بازار و پذیرش پیشنهاد در هر زمان، یا تعیین «روز پیشنهاد» حدود یک هفته بعد از لیست تا پیشنهادهای رقابتی جمع شود. بر اساس خانه شما، محله و بازار همان هفته روش مناسب را پیشنهاد می‌کنم.',
        'قیمت بالاتر از بازار معمولاً به کاهش قیمت می‌رسد و خریداران آن را می‌بینند.',
        'ببینید خانه‌های مشابه واقعاً چند فروخته شده‌اند، چقدر طول کشیده و الان با چه خانه‌هایی رقابت می‌کنید.',
      ],
    },
    {
      id: 'prepare',
      title: '۴. خانه را آماده کنید',
      items: [
        'وسایل اضافه را جمع کنید، خانه را کامل تمیز کنید و ایرادهای کوچک را رفع کنید: شیر آب چکه‌کن، لامپ سوخته، دستگیره شل، دیوار خط‌افتاده.',
        'رنگ تازه و خنثی در جاهایی که لازم است، بیشترین بازدهی را در برابر هزینه دارد.',
        'بازرسی پیش از فروش را در نظر بگیرید. شما زودتر از مشکلات باخبر می‌شوید و خریداران پیشنهاد محکم‌تری می‌دهند.',
        'چیدمان (Staging) اتاق‌های اصلی، یعنی نشیمن، آشپزخانه و اتاق خواب اصلی، کمک می‌کند خریدار خودش را در خانه تصور کند.',
        'فروش کاندو: Status Certificate را زود سفارش دهید تا وقتی خریدار خواست آماده باشد.',
      ],
    },
    {
      id: 'marketing',
      title: '۵. بازاریابی و بازدیدها',
      items: [
        'عکس، ویدیو و نقشه حرفه‌ای. بیشتر خریداران از روی عکس‌ها تصمیم می‌گیرند بازدید بیایند یا نه.',
        'خانه شما در MLS® و REALTOR.ca، به‌علاوه وب‌سایت من و ویدیوهای بازدید اینستاگرامم به فارسی و انگلیسی معرفی می‌شود.',
        'بازدیدها از طریق سیستم رزرو انجام می‌شود. خانه را آماده نگه دارید و هنگام بازدید بیرون بروید تا خریدار راحت باشد.',
        'اوپن‌هاوس در آخر هفته‌های اول بیشترین بازدیدکننده را دارد.',
      ],
    },
    {
      id: 'offers',
      title: '۶. پیشنهادها، مذاکره و تحویل',
      items: [
        'پیشنهادها را فقط با قیمت مقایسه نکنید: ودیعه (معمولاً حدود ۵٪ که ظرف ۲۴ ساعت پس از قبول پرداخت می‌شود)، شرط‌هایی مثل تأمین وام یا بازرسی، تاریخ تحویل و اقلامی که همراه خانه است.',
        'پیشنهاد قطعی بدون شرط مطمئن‌تر است. پیشنهاد مشروط هنوز ممکن است به هم بخورد.',
        'وقتی معامله قطعی شد، وکیل شما مدارک را آماده می‌کند، وامتان را از پول فروش تسویه می‌کند و در روز تحویل باقی‌مانده را برایتان می‌فرستد.',
        'خرید و فروش هم‌زمان: اگر خانه جدید زودتر تحویل شود، وام کوتاه‌مدت (Bridge Loan) از بانک فاصله بین دو تاریخ را پوشش می‌دهد.',
      ],
    },
    {
      id: 'mistakes',
      title: '۷. اشتباه‌هایی که باید از آن‌ها دوری کنید',
      items: [
        'قیمت بالا در شروع و دنبال کردن بازار با کاهش‌های پشت‌سرهم.',
        'نادیده گرفتن تعمیراتی که بازرس خریدار به هر حال پیدا می‌کند.',
        'عکس‌های ضعیف، یا لیست کردن پیش از آماده شدن خانه.',
        'ندانستن جریمه وام و خالص فروش پیش از لیست کردن.',
        'انتخاب بالاترین قیمت بدون بررسی ودیعه، شرط‌ها و تاریخ تحویل.',
      ],
    },
  ],
};
