// Audit trail + scraping protection for pages that show MLS feed data (PropTx IDX/VOW §5.4, §6.2(d)).
import 'server-only';
import crypto from 'crypto';
import { headers } from 'next/headers';
import { db } from '@/lib/supabase';

const WINDOW_SECONDS = 60;
const MAX_PER_WINDOW = 40; // page views per visitor per minute
const BAD_AGENTS = /(python-requests|curl|wget|scrapy|httpclient|okhttp|go-http-client|node-fetch|axios|headless|phantom|selenium|puppeteer|playwright|gptbot|ccbot|claudebot|anthropic|perplexity|bytespider|amazonbot|dataforseo|ahrefs|semrush|mj12|petalbot)/i;

function visitor() {
  const h = headers();
  const ip = (h.get('x-forwarded-for') || '').split(',')[0].trim() || h.get('x-real-ip') || 'unknown';
  const ua = (h.get('user-agent') || '').slice(0, 300);
  const salt = process.env.SESSION_SECRET || 'jj';
  return { ipHash: crypto.createHash('sha256').update(salt + ip).digest('hex').slice(0, 32), ua };
}

// Records the view and returns false if this visitor should be blocked.
export async function guardFeedView({ action, listingKey = null, kind = 'idx', memberId = null }) {
  const { ipHash, ua } = visitor();
  if (!ua || BAD_AGENTS.test(ua)) return false;
  const client = db();
  if (!client) return true;
  try {
    const since = new Date(Date.now() - WINDOW_SECONDS * 1000).toISOString();
    const { count } = await client
      .from('feed_audit')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('at', since);
    await client.from('feed_audit').insert({ ip_hash: ipHash, kind, action, listing_key: listingKey, member_id: memberId, user_agent: ua });
    return (count || 0) < MAX_PER_WINDOW;
  } catch {
    return true;
  }
}
