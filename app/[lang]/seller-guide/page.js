import { t as dictFor } from '@/lib/i18n';
import GuideView from '@/components/GuideView';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }) {
  const t = dictFor(params.lang);
  return {
    title: t.sgTitle,
    description: t.sgLead,
    alternates: { canonical: `/${params.lang}/seller-guide`, languages: { en: '/en/seller-guide', fa: '/fa/seller-guide' } },
  };
}

export default function SellerGuide({ params }) {
  return <GuideView lang={params.lang} which="seller" />;
}
