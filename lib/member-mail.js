// Emails to members (welcome series). Sent through Resend from a verified johnjanjani.com address.
// Every email carries John's name, brokerage address and an unsubscribe link (CASL).
// Listings from the PropTx IDX/VOW feed are never put in emails — only John's own toured homes and links to the site.
import 'server-only';
import crypto from 'crypto';
import { SITE, PHONE, WHATSAPP, OFFICE } from '@/lib/site';

export const INTERESTS = ['buy', 'sell', 'rent', 'browse'];

function secret() {
  return process.env.SESSION_SECRET || '';
}

// Short signature so links in emails can't be forged for other members.
export function signLink(memberId, action, value = '') {
  return crypto.createHmac('sha256', secret()).update(`${memberId}|${action}|${value}`).digest('base64url').slice(0, 22);
}

export function checkLink(memberId, action, value, sig) {
  if (!memberId || !sig) return false;
  const a = Buffer.from(signLink(memberId, action, value));
  const b = Buffer.from(String(sig));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function interestUrl(memberId, value) {
  return `${SITE}/api/member/interest?m=${memberId}&v=${value}&s=${signLink(memberId, 'interest', value)}`;
}

export function unsubscribeUrl(memberId) {
  return `${SITE}/api/member/unsubscribe?m=${memberId}&s=${signLink(memberId, 'unsub')}`;
}

export function memberFrom() {
  return process.env.MEMBER_FROM || process.env.NOTIFY_FROM || '';
}

// Sends one email. Returns false (and sends nothing) until a verified sender address is set,
// because Resend's test sender can only email the account owner.
// replyTo: where replies go. A reply address on a different domain (e.g. Gmail) is a junk-filter signal, so
// account emails (confirm / reset) set none, and others use MEMBER_REPLY_TO (an @johnjanjani.com address) when set.
export async function sendMemberEmail({ to, subject, html, text, memberId, replyTo }) {
  const key = process.env.RESEND_API_KEY;
  const from = memberFrom();
  if (!key || !from || /resend\.dev/i.test(from)) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        text,
        reply_to: replyTo === null ? undefined : replyTo || process.env.MEMBER_REPLY_TO || process.env.LEAD_NOTIFY_EMAIL || undefined,
        headers: memberId ? { 'List-Unsubscribe': `<${unsubscribeUrl(memberId)}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } : undefined,
      }),
    });
    return res.ok;
  } catch (e) {
    console.error('member email failed', e?.message);
    return false;
  }
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const COPY = {
  en: {
    subject: (n) => `Welcome, ${n}! Here’s what you get as a member`,
    preview: 'Full prices, my home tour videos, and a quick question so I can help you better.',
    hi: (n) => `Hi ${n},`,
    intro: 'Thanks for joining my website. I’m Purya (John) Janjani, a Sales Representative with Century 21 Leading Edge. I help families buy, sell and rent across Toronto and the GTA, in English and Farsi.',
    nowYouCan: 'As a member you can now:',
    perks: ['See full prices and addresses of the homes I tour and pick', 'Watch my video tours before you visit', 'Search homes for sale and rent across the GTA'],
    search: 'Search homes',
    value: 'What’s my home worth?',
    qTitle: 'Quick question, so I can help you better:',
    q: 'What are you looking for right now?',
    answers: { buy: 'Buying', sell: 'Selling', rent: 'Renting', browse: 'Just looking' },
    oneTap: 'One tap is enough, no need to write anything.',
    callTitle: 'Free 15-minute call',
    callText: 'Not sure where to start? Book a free 15-minute call with me. We’ll talk about what you’re looking for, your budget and the areas that fit you. No pressure, no obligation.',
    whatsapp: 'Text me on WhatsApp',
    waText: 'Hi John, I just joined your website and I’d like to book my free 15-minute call.',
    orReply: 'Or simply reply to this email.',
    sign: 'John',
    role: 'Sales Representative',
    footer: 'You’re receiving this email because you joined johnjanjani.com.',
    unsub: 'Unsubscribe',
  },
  fa: {
    subject: (n) => `${n} عزیز، خوش آمدید`,
    preview: 'قیمت‌های کامل، ویدیوی بازدید خانه‌ها، و یک سؤال کوتاه تا بهتر کمکتان کنم.',
    hi: (n) => `سلام ${n} عزیز،`,
    intro: 'ممنون که عضو وب‌سایت من شدید. من پوریا جان جانی هستم، مشاور املاک در Century 21 Leading Edge. به خانواده‌ها در تورنتو و سراسر GTA برای خرید، فروش و اجاره خانه کمک می‌کنم، به فارسی و انگلیسی.',
    nowYouCan: 'حالا به عنوان عضو می‌توانید:',
    perks: ['قیمت و آدرس کامل خانه‌هایی را که بازدید و انتخاب می‌کنم ببینید', 'ویدیوی بازدید خانه‌ها را قبل از دیدن حضوری تماشا کنید', 'خانه‌های فروشی و اجاره‌ای سراسر GTA را جستجو کنید'],
    search: 'جستجوی خانه',
    value: 'خانه من چقدر می‌ارزد؟',
    qTitle: 'یک سؤال کوتاه، تا بهتر کمکتان کنم:',
    q: 'الان دنبال چه هستید؟',
    answers: { buy: 'خرید', sell: 'فروش', rent: 'اجاره', browse: 'فعلاً فقط نگاه می‌کنم' },
    oneTap: 'فقط یک کلیک کافی است، لازم نیست چیزی بنویسید.',
    callTitle: 'تماس رایگان ۱۵ دقیقه‌ای',
    callText: 'نمی‌دانید از کجا شروع کنید؟ یک تماس رایگان ۱۵ دقیقه‌ای با من رزرو کنید. درباره چیزی که دنبالش هستید، بودجه‌تان و مناطقی که به شما می‌خورد صحبت می‌کنیم. بدون هیچ فشار و تعهدی.',
    whatsapp: 'پیام در واتساپ',
    waText: 'سلام پوریا، تازه در وب‌سایتتان عضو شدم و می‌خواهم تماس رایگان ۱۵ دقیقه‌ای را رزرو کنم.',
    orReply: 'یا خیلی ساده به همین ایمیل جواب بدهید.',
    sign: 'پوریا',
    role: 'مشاور املاک',
    footer: 'این ایمیل را دریافت می‌کنید چون در johnjanjani.com عضو شده‌اید.',
    unsub: 'لغو اشتراک',
  },
};

export function welcomeEmail({ id, name, lang }) {
  const L = lang === 'fa' ? 'fa' : 'en';
  const c = COPY[L];
  const rtl = L === 'fa';
  const first = String(name || '').trim().split(/\s+/)[0] || (rtl ? 'دوست' : 'there');
  const dir = rtl ? 'rtl' : 'ltr';
  const align = rtl ? 'right' : 'left';
  // Brand fonts load in Apple Mail, iOS Mail and Outlook; Gmail falls back to the clean system font after them.
  const font = rtl ? "Samim, 'Segoe UI', 'Noto Sans Arabic', 'Noto Naskh Arabic', Arial, sans-serif" : "Jost, 'Helvetica Neue', Arial, sans-serif";
  const head = rtl ? "Shabnam, Samim, 'Segoe UI', 'Noto Sans Arabic', Arial, sans-serif" : "'Bodoni Moda', Georgia, 'Times New Roman', serif";
  const fullName = rtl ? 'پوریا جان جانی' : 'Purya (John) Janjani';
  const wa = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(c.waText)}`;
  const btn = (href, label, primary) =>
    `<a href="${href}" style="display:inline-block;margin:4px;padding:13px 22px;border-radius:999px;font-family:${font};font-size:15px;font-weight:600;text-decoration:none;${primary ? 'background:#E8864C;color:#0B2226;' : 'background:#FFFDF8;color:#0D4A50;border:1px solid #0D4A50;'}">${esc(label)}</a>`;
  const answer = (v) =>
    `<a href="${interestUrl(id, v)}" style="display:inline-block;margin:4px;padding:11px 18px;border-radius:12px;background:#0D4A50;color:#FFFDF8;font-family:${font};font-size:15px;text-decoration:none;">${esc(c.answers[v])}</a>`;

  const html = `<!doctype html><html lang="${L}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(c.subject(first))}</title>
<style>
@font-face { font-family: 'Shabnam'; src: url('${SITE}/fonts/Shabnam-Bold.woff2') format('woff2'); font-weight: 700; }
@font-face { font-family: 'Samim'; src: url('${SITE}/fonts/Samim.woff2') format('woff2'); font-weight: 400; }
@font-face { font-family: 'Samim'; src: url('${SITE}/fonts/Samim-Medium.woff2') format('woff2'); font-weight: 600; }
@font-face { font-family: 'Jost'; src: url('${SITE}/fonts/Jost-400.woff2') format('woff2'); font-weight: 400; }
@font-face { font-family: 'Jost'; src: url('${SITE}/fonts/Jost-600.woff2') format('woff2'); font-weight: 600; }
@font-face { font-family: 'Bodoni Moda'; src: url('${SITE}/fonts/BodoniModa-600.woff2') format('woff2'); font-weight: 600; }
</style></head>
<body style="margin:0;padding:0;background:#F6F1E7;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(c.preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F1E7;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFDF8;border-radius:20px;overflow:hidden;" dir="${dir}">
  <tr><td style="background:#072F33;padding:22px 28px;text-align:${align};">
    <span style="font-family:${head};font-size:18px;letter-spacing:${rtl ? '0' : '3px'};color:#F6F1E7;">${rtl ? 'پوریا جان جانی' : 'JOHN JANJANI'}</span>
    <span style="font-family:${font};font-size:12px;color:#C9BB94;display:block;margin-top:4px;">Century 21 Leading Edge</span>
  </td></tr>
  <tr><td style="padding:30px 28px 8px;text-align:${align};font-family:${font};color:#12282B;font-size:16px;line-height:1.65;">
    <table role="presentation" cellpadding="0" cellspacing="0" dir="${dir}"><tr>
      <td style="padding-${rtl ? 'left' : 'right'}:14px;vertical-align:middle;"><img src="${SITE}/images/john.jpg" width="72" height="72" alt="${esc(fullName)}" style="display:block;border-radius:50%;border:3px solid #E8864C;"></td>
      <td style="vertical-align:middle;font-family:${head};font-size:24px;color:#072F33;">${esc(c.hi(first))}</td>
    </tr></table>
    <p style="margin:18px 0 0;">${esc(c.intro)}</p>
    <p style="margin:18px 0 6px;font-weight:600;">${esc(c.nowYouCan)}</p>
    <ul style="margin:0;padding-${rtl ? 'right' : 'left'}:20px;">${c.perks.map((p) => `<li style="margin:4px 0;">${esc(p)}</li>`).join('')}</ul>
  </td></tr>
  <tr><td style="padding:14px 24px 6px;text-align:center;">
    ${btn(`${SITE}/${L}/search`, c.search, true)}${btn(`${SITE}/${L}/home-value`, c.value, false)}
  </td></tr>
  <tr><td style="padding:22px 28px 6px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4EEE2;border-radius:16px;"><tr><td style="padding:20px;text-align:center;font-family:${font};color:#12282B;">
      <div style="font-size:14px;color:#4A5A5C;">${esc(c.qTitle)}</div>
      <div style="font-family:${head};font-size:21px;color:#072F33;margin:6px 0 12px;">${esc(c.q)}</div>
      ${INTERESTS.map(answer).join('')}
      <div style="font-size:13px;color:#4A5A5C;margin-top:10px;">${esc(c.oneTap)}</div>
    </td></tr></table>
  </td></tr>
  <tr><td style="padding:22px 28px 26px;text-align:${align};font-family:${font};color:#12282B;font-size:16px;line-height:1.65;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#072F33;border-radius:16px;"><tr><td style="padding:22px 20px;text-align:center;font-family:${font};color:#F6F1E7;">
      <div style="font-family:${head};font-size:22px;color:#FFFDF8;">${esc(c.callTitle)}</div>
      <div style="font-size:15px;line-height:1.6;color:#E6E0D2;margin:8px 0 16px;">${esc(c.callText)}</div>
      <a href="${wa}" style="display:inline-block;padding:14px 26px;border-radius:999px;background:#25D366;color:#073B1E;font-family:${font};font-size:16px;font-weight:700;text-decoration:none;">${esc(c.whatsapp)}</a>
      <div style="font-size:13px;color:#C9BB94;margin-top:12px;">${esc(c.orReply)}</div>
    </td></tr></table>
    <p style="margin:20px 0 0;font-family:${head};font-size:20px;color:#072F33;">${esc(c.sign)}</p>
    <p style="margin:4px 0 0;font-size:13px;color:#4A5A5C;line-height:1.5;">${esc(fullName)} · ${esc(c.role)}<br>Century 21 Leading Edge Realty Inc., Brokerage<br><span dir="ltr">${esc(OFFICE)} · ${esc(PHONE)}</span><br><a href="${SITE}/${L}" style="color:#0D4A50;">johnjanjani.com</a></p>
  </td></tr>
  <tr><td style="background:#EFE8DA;padding:16px 28px;text-align:center;font-family:${font};font-size:12px;color:#6B7A7C;line-height:1.5;">
    ${esc(c.footer)} <a href="${unsubscribeUrl(id)}" style="color:#6B7A7C;">${esc(c.unsub)}</a><br>
    <span dir="ltr">Purya (John) Janjani, Century 21 Leading Edge Realty Inc., Brokerage · ${esc(OFFICE)}</span>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = [
    c.hi(first),
    '',
    c.intro,
    '',
    c.nowYouCan,
    ...c.perks.map((p) => `- ${p}`),
    '',
    `${c.search}: ${SITE}/${L}/search`,
    `${c.value}: ${SITE}/${L}/home-value`,
    '',
    `${c.qTitle} ${c.q}`,
    ...INTERESTS.map((v) => `${c.answers[v]}: ${interestUrl(id, v)}`),
    '',
    `${c.callTitle}: ${c.callText}`,
    `${c.whatsapp}: ${wa}`,
    c.orReply,
    '',
    c.sign,
    `${fullName} · ${c.role}`,
    `Century 21 Leading Edge Realty Inc., Brokerage · ${OFFICE} · ${PHONE}`,
    '',
    `${c.footer} ${c.unsub}: ${unsubscribeUrl(id)}`,
  ].join('\n');

  return { subject: c.subject(first), html, text };
}

// Short account emails (confirm email, reset password) in the member's language.
const ACCOUNT = {
  en: {
    verify: { subject: 'Confirm your email to see sold prices', title: 'One click to unlock sold prices', text: 'Please confirm your email address to finish creating your account. Then you can see sold prices, price history and your instant home value on johnjanjani.com.', button: 'Confirm my email', note: 'This link works for 48 hours. If you didn’t sign up, you can ignore this email.' },
    reset: { subject: 'Reset your johnjanjani.com password', title: 'Reset your password', text: 'Someone (hopefully you) asked to reset the password for your johnjanjani.com account. Click below to choose a new one.', button: 'Choose a new password', note: 'This link works for 1 hour. If you didn’t ask for this, you can ignore this email.' },
    hi: (n) => `Hi ${n},`,
  },
  fa: {
    verify: { subject: 'ایمیل خود را تأیید کنید تا قیمت‌های فروش را ببینید', title: 'فقط یک کلیک تا دیدن قیمت‌های فروش', text: 'لطفاً ایمیل خود را تأیید کنید تا ساخت حسابتان کامل شود. بعد از آن می‌توانید قیمت‌های فروش، سابقه قیمت و برآورد فوری ارزش خانه‌تان را در johnjanjani.com ببینید.', button: 'تأیید ایمیل من', note: 'این لینک تا ۴۸ ساعت معتبر است. اگر ثبت‌نام نکرده‌اید، این ایمیل را نادیده بگیرید.' },
    reset: { subject: 'تغییر رمز عبور johnjanjani.com', title: 'تغییر رمز عبور', text: 'درخواستی برای تغییر رمز عبور حساب شما در johnjanjani.com ثبت شده است. برای انتخاب رمز جدید روی دکمه زیر بزنید.', button: 'انتخاب رمز جدید', note: 'این لینک تا ۱ ساعت معتبر است. اگر این درخواست از طرف شما نبوده، این ایمیل را نادیده بگیرید.' },
    hi: (n) => `سلام ${n} عزیز،`,
  },
};

export function accountEmail({ kind, name, lang, url }) {
  const L = lang === 'fa' ? 'fa' : 'en';
  const c = ACCOUNT[L][kind];
  const rtl = L === 'fa';
  const dir = rtl ? 'rtl' : 'ltr';
  const align = rtl ? 'right' : 'left';
  const font = rtl ? "Samim, 'Segoe UI', 'Noto Sans Arabic', Arial, sans-serif" : "Jost, 'Helvetica Neue', Arial, sans-serif";
  const head = rtl ? "Shabnam, Samim, 'Segoe UI', Arial, sans-serif" : "'Bodoni Moda', Georgia, serif";
  const first = String(name || '').trim().split(/\s+/)[0] || '';
  const html = `<!doctype html><html lang="${L}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(c.subject)}</title>
<style>@font-face{font-family:'Shabnam';src:url('${SITE}/fonts/Shabnam-Bold.woff2') format('woff2');font-weight:700}@font-face{font-family:'Samim';src:url('${SITE}/fonts/Samim.woff2') format('woff2')}@font-face{font-family:'Jost';src:url('${SITE}/fonts/Jost-400.woff2') format('woff2')}@font-face{font-family:'Bodoni Moda';src:url('${SITE}/fonts/BodoniModa-600.woff2') format('woff2');font-weight:600}</style></head>
<body style="margin:0;background:#F6F1E7;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F1E7;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFDF8;border-radius:20px;overflow:hidden;" dir="${dir}">
<tr><td style="background:#072F33;padding:20px 28px;text-align:${align};font-family:${head};font-size:17px;letter-spacing:${rtl ? '0' : '3px'};color:#F6F1E7;">${rtl ? 'پوریا جان جانی' : 'JOHN JANJANI'}</td></tr>
<tr><td style="padding:28px;text-align:${align};font-family:${font};font-size:16px;line-height:1.65;color:#12282B;">
<p style="margin:0 0 6px;">${esc(ACCOUNT[L].hi(first))}</p>
<h1 style="margin:0 0 12px;font-family:${head};font-size:24px;color:#072F33;font-weight:600;">${esc(c.title)}</h1>
<p style="margin:0 0 22px;">${esc(c.text)}</p>
<p style="margin:0 0 22px;text-align:center;"><a href="${url}" style="display:inline-block;padding:14px 28px;border-radius:999px;background:#E8864C;color:#0B2226;font-family:${font};font-size:16px;font-weight:600;text-decoration:none;">${esc(c.button)}</a></p>
<p style="margin:0;font-size:13px;color:#4A5A5C;">${esc(c.note)}</p>
</td></tr>
<tr><td style="background:#EFE8DA;padding:14px 28px;text-align:center;font-family:${font};font-size:12px;color:#6B7A7C;" dir="ltr">Purya (John) Janjani, Century 21 Leading Edge Realty Inc., Brokerage · ${esc(OFFICE)}</td></tr>
</table></td></tr></table></body></html>`;
  const text = [ACCOUNT[L].hi(first), '', c.title, '', c.text, '', `${c.button}: ${url}`, '', c.note].join('\n');
  return { subject: c.subject, html, text };
}
