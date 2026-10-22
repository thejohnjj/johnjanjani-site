// "Buying your first home in Canada" guide, English and Farsi. Rules as of October 2026.
// Each section: id, title, intro (optional), items (bullets), table (optional), tip (optional).

export const GUIDE = {
  en: [
    {
      id: 'budget',
      title: '1. Know your budget and get pre-approved',
      intro: 'Before you look at homes, find out what a lender will actually approve. A pre-approval tells you your price range and usually holds an interest rate for 90 to 120 days.',
      items: [
        'Lenders look at your income, debts, credit score and how long you have worked in Canada.',
        'Everyone has to pass the “stress test”: you must qualify at your contract rate plus 2%, or 5.25%, whichever is higher.',
        'For insured mortgages, housing costs (mortgage, property tax, heating, half of condo fees) should stay under about 39% of your gross income, and all your debts under about 44%.',
        'Bring recent pay stubs, an employment letter, two years of tax assessments (if you have them), bank statements showing your down payment, and photo ID.',
      ],
      tip: 'A mortgage broker can compare many lenders at once, including lenders with programs for newcomers. I can introduce you to specialists who speak Farsi.',
    },
    {
      id: 'down',
      title: '2. How much down payment you need',
      table: {
        head: ['Purchase price', 'Minimum down payment'],
        rows: [
          ['Up to $500,000', '5%'],
          ['$500,000 to $1,499,999', '5% of the first $500,000 + 10% of the rest'],
          ['$1,500,000 or more', '20%'],
        ],
      },
      items: [
        'Example: on a $900,000 home, the minimum is $25,000 + $40,000 = $65,000.',
        'With less than 20% down, you pay mortgage default insurance (CMHC or another insurer): 2.80% to 4.00% of the mortgage, added to your loan. In Ontario, 8% sales tax on that premium is paid in cash at closing.',
        'First-time buyers and buyers of new builds can choose a 30-year amortization on an insured mortgage (the premium is 0.20% higher). Otherwise the maximum is 25 years.',
        'Your down payment must come from your own savings, a gift from close family (with a signed gift letter) or approved programs. Lenders usually want to see 90 days of bank history.',
      ],
    },
    {
      id: 'programs',
      title: '3. Programs that save first-time buyers money',
      items: [
        'First Home Savings Account (FHSA): save up to $8,000 a year, up to $40,000 in total. Contributions are tax-deductible and the withdrawal for your first home is tax-free.',
        'RRSP Home Buyers’ Plan: withdraw up to $60,000 from your RRSP tax-free for your first home, and repay it over 15 years. A couple can each use it.',
        'Ontario land transfer tax refund: up to $4,000.',
        'Toronto land transfer tax rebate: up to $4,475 if the home is in the City of Toronto.',
        'To get the land transfer tax refunds you generally must be a Canadian citizen or permanent resident (or become one within 18 months), never have owned a home anywhere in the world, and live in the home within 9 months.',
        'New homes: first-time buyers may get up to $50,000 of GST relief on a newly built home up to $1 million, reduced gradually to zero at $1.5 million (agreements signed on or after May 27, 2025).',
      ],
      tip: 'A couple can combine programs: two FHSAs and two Home Buyers’ Plans can add up to $200,000 toward a down payment.',
    },
    {
      id: 'newcomers',
      title: '4. If you’re new to Canada',
      items: [
        'Start building Canadian credit early: a credit card (even a secured one) and a phone plan in your name, paid in full every month.',
        'Many lenders and insurers have newcomer programs for permanent residents and recent arrivals with a short credit history. Requirements and down payment vary, so get pre-approved early.',
        'Permanent residents can buy like citizens. The federal ban on purchases by non-Canadians runs until January 1, 2027. Work-permit holders are generally exempt if their permit has at least 183 days left and they buy only one home; international students have stricter conditions.',
        'Ontario charges a 25% Non-Resident Speculation Tax to foreign nationals buying residential property. Some exemptions and refunds exist, so talk to a real estate lawyer before you make an offer.',
        'Keep your job stable and avoid new loans or big purchases until after closing. Lenders check again before the funds are released.',
      ],
    },
    {
      id: 'costs',
      title: '5. Closing costs: budget 1.5% to 4% on top of the down payment',
      intro: 'Land transfer tax is the biggest closing cost. Inside the City of Toronto you pay it twice: once to Ontario and once to the city.',
      table: {
        head: ['Portion of the price', 'Ontario rate', 'Toronto rate'],
        rows: [
          ['Up to $55,000', '0.5%', '0.5%'],
          ['$55,000 to $250,000', '1.0%', '1.0%'],
          ['$250,000 to $400,000', '1.5%', '1.5%'],
          ['$400,000 to $2,000,000', '2.0%', '2.0%'],
          ['Over $2,000,000', '2.5%', '2.5% up to $3M, then higher tiers'],
        ],
      },
      items: [
        'Example, $1,000,000 home in Toronto: Ontario tax $16,475 + Toronto tax $16,475 = $32,950. A first-time buyer gets back up to $8,475, so about $24,475.',
        'The same home outside Toronto (for example Richmond Hill or Vaughan) pays only the Ontario tax: $16,475, or $12,475 for a first-time buyer.',
        'Lawyer fees and disbursements: usually $1,500 to $2,500.',
        'Title insurance: about $300 to $600. Home inspection: about $400 to $700.',
        'Adjustments: you repay the seller for property tax or condo fees they prepaid past the closing date.',
        'Also plan for moving, utility set-up and home insurance (your lender needs proof before closing).',
      ],
      tip: 'Use the calculator on my website to see your exact land transfer tax and cash needed at closing.',
    },
    {
      id: 'steps',
      title: '6. Step by step: from search to keys',
      items: [
        'Get pre-approved and decide your must-haves: area, schools, commute, size.',
        'Tour homes with me. I check comparable sales so you know what a fair price is.',
        'Make an offer. In Ontario the deposit is usually around 5% of the price, due within 24 hours of acceptance.',
        'Conditions protect you: financing, home inspection, and for condos a lawyer’s review of the status certificate. In competitive situations buyers sometimes skip them, so we’ll weigh the risk together.',
        'Once the deal is firm, your lawyer handles the title search and paperwork and your lender finalizes the mortgage.',
        'Final walk-through, closing day, and your lawyer gives you the keys.',
      ],
    },
    {
      id: 'mistakes',
      title: '7. Mistakes to avoid',
      items: [
        'Shopping before you’re pre-approved.',
        'Forgetting closing costs and only saving for the down payment.',
        'Changing jobs, financing a car or opening new credit before closing.',
        'Skipping the inspection or the status certificate review without understanding the risk.',
        'Looking only at price per square foot and not at the area, layout, condition and future costs.',
      ],
    },
  ],

  fa: [
    {
      id: 'budget',
      title: '۱. بودجه‌تان را بشناسید و پیش‌تأیید وام بگیرید',
      intro: 'پیش از دیدن خانه‌ها، ببینید وام‌دهنده واقعاً چقدر به شما وام می‌دهد. پیش‌تأیید وام (Pre-approval) محدوده قیمت شما را مشخص می‌کند و معمولاً نرخ بهره را ۹۰ تا ۱۲۰ روز برایتان نگه می‌دارد.',
      items: [
        'وام‌دهنده‌ها درآمد، بدهی‌ها، امتیاز اعتباری (Credit Score) و سابقه کار شما در کانادا را بررسی می‌کنند.',
        'همه باید «تست استرس» را بگذرانند: باید با نرخ قرارداد به‌علاوه ۲٪، یا ۵٫۲۵٪ (هر کدام بیشتر بود)، توان پرداخت داشته باشید.',
        'برای وام‌های بیمه‌شده، هزینه‌های مسکن (قسط، مالیات ملک، گرمایش، نصف شارژ کاندو) باید زیر حدود ۳۹٪ درآمد ناخالص شما بماند و مجموع بدهی‌ها زیر حدود ۴۴٪.',
        'فیش‌های حقوق اخیر، نامه اشتغال، دو سال برگه ارزیابی مالیاتی (اگر دارید)، صورت‌حساب بانکی که پیش‌پرداخت را نشان دهد و کارت شناسایی عکس‌دار همراه داشته باشید.',
      ],
      tip: 'کارگزار وام (Mortgage Broker) می‌تواند هم‌زمان چند وام‌دهنده را مقایسه کند، از جمله وام‌دهنده‌هایی که برنامه ویژه تازه‌واردها دارند. می‌توانم شما را به متخصصان فارسی‌زبان معرفی کنم.',
    },
    {
      id: 'down',
      title: '۲. چقدر پیش‌پرداخت لازم دارید',
      table: {
        head: ['قیمت خرید', 'حداقل پیش‌پرداخت'],
        rows: [
          ['تا ۵۰۰٬۰۰۰ دلار', '۵٪'],
          ['۵۰۰٬۰۰۰ تا ۱٬۴۹۹٬۹۹۹ دلار', '۵٪ از ۵۰۰٬۰۰۰ دلار اول + ۱۰٪ از باقی'],
          ['۱٬۵۰۰٬۰۰۰ دلار و بیشتر', '۲۰٪'],
        ],
      },
      items: [
        'مثال: برای خانه ۹۰۰٬۰۰۰ دلاری، حداقل پیش‌پرداخت ۲۵٬۰۰۰ + ۴۰٬۰۰۰ = ۶۵٬۰۰۰ دلار است.',
        'اگر کمتر از ۲۰٪ پیش‌پرداخت بدهید، بیمه وام مسکن (CMHC یا بیمه‌گر دیگر) می‌پردازید: ۲٫۸۰٪ تا ۴٫۰۰٪ مبلغ وام که به وام اضافه می‌شود. در انتاریو ۸٪ مالیات این بیمه را باید در روز تحویل به‌صورت نقد بپردازید.',
        'خریداران خانه اول و خریداران خانه نوساز می‌توانند وام بیمه‌شده را ۳۰ ساله بگیرند (بیمه ۰٫۲۰٪ گران‌تر است). در غیر این صورت حداکثر ۲۵ سال است.',
        'پیش‌پرداخت باید از پس‌انداز خودتان، هدیه از خانواده نزدیک (با نامه هدیه امضاشده) یا برنامه‌های مجاز باشد. وام‌دهنده‌ها معمولاً سابقه ۹۰ روزه حساب بانکی را می‌خواهند.',
      ],
    },
    {
      id: 'programs',
      title: '۳. برنامه‌هایی که برای خریدار خانه اول پول ذخیره می‌کنند',
      items: [
        'حساب پس‌انداز خانه اول (FHSA): سالی تا ۸٬۰۰۰ دلار و در مجموع تا ۴۰٬۰۰۰ دلار. واریزها از مالیات کسر می‌شود و برداشت برای خرید خانه اول معاف از مالیات است.',
        'برنامه خرید خانه از RRSP (Home Buyers’ Plan): تا ۶۰٬۰۰۰ دلار را بدون مالیات از RRSP برای خانه اول برداشت کنید و ظرف ۱۵ سال برگردانید. زن و شوهر هر کدام جداگانه می‌توانند استفاده کنند.',
        'بازپرداخت مالیات انتقال ملک انتاریو: تا ۴٬۰۰۰ دلار.',
        'بازپرداخت مالیات انتقال ملک تورنتو: تا ۴٬۴۷۵ دلار، اگر خانه در شهر تورنتو باشد.',
        'برای گرفتن این بازپرداخت‌ها معمولاً باید شهروند یا مقیم دائم کانادا باشید (یا ظرف ۱۸ ماه بشوید)، هرگز در هیچ کشوری خانه نداشته باشید و ظرف ۹ ماه در خانه ساکن شوید.',
        'خانه نوساز: خریداران خانه اول ممکن است تا ۵۰٬۰۰۰ دلار تخفیف GST برای خانه نوساز تا ۱ میلیون دلار بگیرند که تا ۱٫۵ میلیون دلار به‌تدریج به صفر می‌رسد (قراردادهای امضاشده از ۲۷ مه ۲۰۲۵ به بعد).',
      ],
      tip: 'زوج‌ها می‌توانند برنامه‌ها را با هم ترکیب کنند: دو FHSA و دو Home Buyers’ Plan می‌تواند تا ۲۰۰٬۰۰۰ دلار برای پیش‌پرداخت فراهم کند.',
    },
    {
      id: 'newcomers',
      title: '۴. اگر تازه به کانادا آمده‌اید',
      items: [
        'ساختن سابقه اعتباری را زود شروع کنید: یک کارت اعتباری (حتی از نوع Secured) و خط تلفن به نام خودتان، و هر ماه کامل پرداخت کنید.',
        'بسیاری از وام‌دهنده‌ها و بیمه‌گرها برنامه ویژه تازه‌واردها برای مقیمان دائم و افراد تازه‌وارد با سابقه اعتباری کوتاه دارند. شرایط و پیش‌پرداخت متفاوت است، پس زود پیش‌تأیید بگیرید.',
        'مقیمان دائم مثل شهروندان می‌توانند خانه بخرند. ممنوعیت فدرال خرید ملک مسکونی برای غیرکانادایی‌ها تا ۱ ژانویه ۲۰۲۷ ادامه دارد. دارندگان ویزای کار معمولاً معاف‌اند، اگر حداقل ۱۸۳ روز از اعتبار ویزایشان مانده باشد و فقط یک خانه بخرند؛ دانشجویان بین‌المللی شرایط سخت‌تری دارند.',
        'انتاریو از اتباع خارجی که ملک مسکونی می‌خرند ۲۵٪ مالیات غیرمقیم (NRST) می‌گیرد. برخی معافیت‌ها و بازپرداخت‌ها وجود دارد؛ پیش از پیشنهاد خرید با وکیل املاک صحبت کنید.',
        'تا روز تحویل کارتان را ثابت نگه دارید و وام جدید یا خرید بزرگ نکنید. وام‌دهنده پیش از پرداخت وام دوباره بررسی می‌کند.',
      ],
    },
    {
      id: 'costs',
      title: '۵. هزینه‌های خرید: ۱٫۵٪ تا ۴٪ علاوه بر پیش‌پرداخت',
      intro: 'مالیات انتقال ملک بزرگ‌ترین هزینه خرید است. در شهر تورنتو آن را دو بار می‌پردازید: یک بار به انتاریو و یک بار به شهر.',
      table: {
        head: ['بخشی از قیمت', 'نرخ انتاریو', 'نرخ تورنتو'],
        rows: [
          ['تا ۵۵٬۰۰۰ دلار', '۰٫۵٪', '۰٫۵٪'],
          ['۵۵٬۰۰۰ تا ۲۵۰٬۰۰۰ دلار', '۱٪', '۱٪'],
          ['۲۵۰٬۰۰۰ تا ۴۰۰٬۰۰۰ دلار', '۱٫۵٪', '۱٫۵٪'],
          ['۴۰۰٬۰۰۰ تا ۲٬۰۰۰٬۰۰۰ دلار', '۲٪', '۲٪'],
          ['بیش از ۲٬۰۰۰٬۰۰۰ دلار', '۲٫۵٪', '۲٫۵٪ تا ۳ میلیون، بعد نرخ‌های بالاتر'],
        ],
      },
      items: [
        'مثال، خانه ۱٬۰۰۰٬۰۰۰ دلاری در تورنتو: مالیات انتاریو ۱۶٬۴۷۵ + مالیات تورنتو ۱۶٬۴۷۵ = ۳۲٬۹۵۰ دلار. خریدار خانه اول تا ۸٬۴۷۵ دلار پس می‌گیرد، یعنی حدود ۲۴٬۴۷۵ دلار.',
        'همین خانه بیرون از تورنتو (مثلاً ریچموند هیل یا وان) فقط مالیات انتاریو دارد: ۱۶٬۴۷۵ دلار، یا ۱۲٬۴۷۵ دلار برای خریدار خانه اول.',
        'هزینه وکیل و هزینه‌های جانبی: معمولاً ۱٬۵۰۰ تا ۲٬۵۰۰ دلار.',
        'بیمه سند (Title Insurance): حدود ۳۰۰ تا ۶۰۰ دلار. بازرسی خانه: حدود ۴۰۰ تا ۷۰۰ دلار.',
        'تسویه‌ها (Adjustments): مالیات ملک یا شارژ کاندویی را که فروشنده برای بعد از روز تحویل پیش‌پرداخت کرده، به او برمی‌گردانید.',
        'هزینه اسباب‌کشی، راه‌اندازی آب و برق و بیمه خانه را هم در نظر بگیرید (وام‌دهنده پیش از تحویل مدرک بیمه می‌خواهد).',
      ],
      tip: 'با ماشین حساب هزینه‌ها در وب‌سایت من، مالیات انتقال ملک و پول نقد لازم در روز تحویل را دقیق ببینید.',
    },
    {
      id: 'steps',
      title: '۶. قدم‌به‌قدم: از جستجو تا گرفتن کلید',
      items: [
        'پیش‌تأیید وام بگیرید و اولویت‌هایتان را مشخص کنید: محله، مدرسه، مسیر رفت‌وآمد، اندازه.',
        'با من خانه‌ها را ببینید. فروش‌های مشابه را بررسی می‌کنم تا بدانید قیمت منصفانه چیست.',
        'پیشنهاد خرید بدهید. در انتاریو ودیعه (Deposit) معمولاً حدود ۵٪ قیمت است و ظرف ۲۴ ساعت پس از قبول پیشنهاد پرداخت می‌شود.',
        'شرط‌ها از شما محافظت می‌کنند: تأمین وام، بازرسی خانه و در کاندو، بررسی Status Certificate توسط وکیل. در رقابت‌ها گاهی خریداران بدون شرط پیشنهاد می‌دهند؛ ریسک آن را با هم می‌سنجیم.',
        'وقتی معامله قطعی شد، وکیل شما بررسی سند و کارهای اداری را انجام می‌دهد و وام‌دهنده وام را نهایی می‌کند.',
        'بازدید نهایی، روز تحویل، و وکیل کلید را به شما می‌دهد.',
      ],
    },
    {
      id: 'mistakes',
      title: '۷. اشتباه‌هایی که باید از آن‌ها دوری کنید',
      items: [
        'گشتن دنبال خانه پیش از گرفتن پیش‌تأیید وام.',
        'فراموش کردن هزینه‌های خرید و پس‌انداز فقط برای پیش‌پرداخت.',
        'عوض کردن کار، خرید قسطی ماشین یا گرفتن کارت و وام جدید پیش از روز تحویل.',
        'حذف بازرسی خانه یا بررسی Status Certificate بدون دانستن ریسک آن.',
        'توجه فقط به قیمت هر فوت مربع و نادیده گرفتن محله، نقشه، وضعیت ساختمان و هزینه‌های آینده.',
      ],
    },
  ],
};
