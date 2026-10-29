import { SITE } from '@/lib/site';

// AI crawlers are kept away from MLS® pages: the PropTx agreements forbid feeding listing data to AI systems.
const AI_BOTS = ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'CCBot', 'ClaudeBot', 'Claude-Web', 'anthropic-ai', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'Bytespider', 'Amazonbot', 'meta-externalagent', 'cohere-ai'];

export default function robots() {
  const site = SITE;
  return {
    rules: [
      { userAgent: AI_BOTS, disallow: ['/en/search', '/fa/search', '/en/mls/', '/fa/mls/'] },
      { userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] },
    ],
    sitemap: `${site}/sitemap.xml`,
  };
}
