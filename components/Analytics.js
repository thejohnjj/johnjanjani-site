import Script from 'next/script';
import { GA_ID, META_PIXEL_ID } from '@/lib/site';

// Google Analytics 4 and the Meta Pixel. They load only on the live site (Vercel production),
// so test runs and preview builds don't count as visitors.
export default function Analytics() {
  if (process.env.VERCEL_ENV !== 'production') return null;
  const ga = process.env.NEXT_PUBLIC_GA_ID || GA_ID;
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID || META_PIXEL_ID;
  return (
    <>
      {ga && /^G-[A-Z0-9]+$/i.test(ga) && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="ga" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${ga}');`}
          </Script>
        </>
      )}
      {pixel && /^\d+$/.test(pixel) && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
