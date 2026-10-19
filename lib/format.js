const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function digits(value, lang) {
  const s = String(value ?? '');
  if (lang !== 'fa') return s;
  return s.replace(/[0-9]/g, (d) => FA_DIGITS[d]).replace(/,/g, '٬').replace(/\./g, '٫');
}

export function number(n, lang) {
  return digits(Number(n).toLocaleString('en-US'), lang);
}

export function money(n, lang) {
  const s = Number(n).toLocaleString('en-US');
  return lang === 'fa' ? `${digits(s, 'fa')} دلار` : `$${s}`;
}

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}
