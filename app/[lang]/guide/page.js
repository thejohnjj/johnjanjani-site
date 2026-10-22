import { t as dictFor } from '@/lib/i18n';
import GuideView from '@/components/GuideView';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }) {
  const t = dictFor(params.lang);
  return {
    title: t.seo.guide,
    description: t.gLead,
    alternates: { canonical: `/${params.lang}/guide`, languages: { en: '/en/guide', fa: '/fa/guide' } },
  };
}

export default function Guide({ params }) {
  return <GuideView lang={params.lang} which="buyer" />;
}
