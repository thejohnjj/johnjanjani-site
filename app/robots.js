import { SITE } from '@/lib/site';
export default function robots() {
  const site = SITE;
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }],
    sitemap: `${site}/sitemap.xml`,
  };
}
