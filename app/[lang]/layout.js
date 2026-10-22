import { SITE } from '@/lib/site';
import '../globals.css';
import { notFound } from 'next/navigation';
import Analytics from '@/components/Analytics';
import { t as dictFor, isLang } from '@/lib/i18n';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0D4A50',
};

export function generateMetadata({ params }) {
  const t = dictFor(params.lang);
  const site = SITE;
  return {
    metadataBase: new URL(site),
    title: { default: t.metaTitle, template: `%s | ${t.brandName}` },
    description: t.metaDescription,
    alternates: { canonical: `/${params.lang}`, languages: { en: '/en', fa: '/fa' } },
    openGraph: {
      title: t.metaTitle,
      description: t.metaDescription,
      url: `/${params.lang}`,
      siteName: 'John Janjani',
      locale: params.lang === 'fa' ? 'fa_IR' : 'en_CA',
      images: ['/images/john.jpg'],
      type: 'website',
    },
  };
}

export default function LangLayout({ children, params }) {
  if (!isLang(params.lang)) notFound();
  const t = dictFor(params.lang);
  return (
    <html lang={params.lang} dir={t.dir}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
