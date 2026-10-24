import Script from 'next/script';
import { GA_ID, META_PIXEL_ID } from '@/lib/site';

// Google Analytics 4 and the Meta Pixel. They load only on the live site (Vercel production),
// so test runs and preview builds don't count as visitors.
// Opening any page with ?notrack=1 turns tracking off for that browser (John's own devices);
// ?notrack=0 turns it back on.
export default function Analytics() {
  if (process.env.VERCEL_ENV !== 'production') return null;
  const ga = process.env.NEXT_PUBLIC_GA_ID || GA_ID;
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID || META_PIXEL_ID;
  const gaOk = ga && /^G-[A-Z0-9]+$/i.test(ga) ? ga : '';
  const pixelOk = pixel && /^\d+$/.test(pixel) ? pixel : '';
  if (!gaOk && !pixelOk) return null;
  const code = `(function(){
var K='jj_notrack',off=false;
try{var q=new URLSearchParams(location.search).get('notrack');
if(q==='1'){localStorage.setItem(K,'1');note('This browser is no longer counted in Analytics.');}
else if(q==='0'){localStorage.removeItem(K);note('This browser is counted in Analytics again.');}
off=localStorage.getItem(K)==='1';}catch(e){}
function note(t){document.addEventListener('DOMContentLoaded',show);if(document.readyState!=='loading')show();
function show(){if(document.getElementById('jj-note'))return;var d=document.createElement('div');d.id='jj-note';d.textContent=t;
d.style.cssText='position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:9999;background:#0B2226;color:#F6F1E7;padding:12px 18px;border-radius:12px;font:15px sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25)';
document.body.appendChild(d);setTimeout(function(){d.remove();},4000);}}
if(off)return;
${gaOk ? `var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=${gaOk}';document.head.appendChild(s);
window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments);};gtag('js',new Date());gtag('config','${gaOk}');` : ''}
${pixelOk ? `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelOk}');fbq('track','PageView');` : ''}
})();`;
  return <Script id="analytics" strategy="afterInteractive">{code}</Script>;
}
