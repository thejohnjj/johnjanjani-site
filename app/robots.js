export default function robots() {
  const site = process.env.SITE_URL || 'https://johnjanjani.com';
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }],
    sitemap: `${site}/sitemap.xml`,
  };
}
