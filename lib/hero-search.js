// Homepage search bar: a short number is a home code from Instagram (/c/60);
// anything else searches the MLS® listings.
const toLatin = (s) => String(s || '').replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

export function heroSearchUrl(lang, value, deal) {
  const v = toLatin(value).trim().replace(/^#/, '');
  if (/^\d{1,4}$/.test(v)) return `/${lang}/c/${encodeURIComponent(v)}`;
  const p = new URLSearchParams();
  if (deal === 'lease') p.set('deal', 'lease');
  if (v) p.set('q', v.slice(0, 40));
  const s = p.toString();
  return `/${lang}/search${s ? `?${s}` : ''}`;
}
