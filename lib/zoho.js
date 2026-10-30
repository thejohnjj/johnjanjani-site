// Sends website leads to John's Zoho CRM (Leads module).
// Connection: John creates a Zoho "Server-based" API client, puts ZOHO_CLIENT_ID / ZOHO_CLIENT_SECRET in Vercel,
// then clicks "Connect Zoho" on /admin. The refresh token is stored encrypted in Supabase (table: integrations).
// Zoho's free plan has no custom fields or tags, so a summary line at the top of Description carries
// source, language and intent (e.g. "Website · Farsi · Looking for: Buying"); details go in Notes.
import 'server-only';
import crypto from 'crypto';
import { db } from '@/lib/supabase';
import { SITE } from '@/lib/site';

const KEY = 'zoho';
export const ZOHO_REDIRECT = `${SITE}/api/admin/zoho/callback`;
export const ZOHO_SCOPES = 'ZohoCRM.modules.leads.ALL,ZohoCRM.modules.notes.ALL,ZohoCRM.settings.tags.ALL';
const DEFAULT_ACCOUNTS = 'https://accounts.zoho.com';

const INTEREST_TAG = { buy: 'Buying', sell: 'Selling', rent: 'Renting', browse: 'Just looking' };

function cipherKey() {
  return crypto.createHash('sha256').update(`zoho|${process.env.SESSION_SECRET || ''}`).digest();
}
function seal(text) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', cipherKey(), iv);
  const enc = Buffer.concat([c.update(text, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString('base64url')).join('.');
}
function open(sealed) {
  const [iv, tag, enc] = String(sealed).split('.').map((s) => Buffer.from(s, 'base64url'));
  const d = crypto.createDecipheriv('aes-256-gcm', cipherKey(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString('utf8');
}

export function zohoConfigured() {
  return Boolean(process.env.ZOHO_CLIENT_ID && process.env.ZOHO_CLIENT_SECRET);
}

export function signState() {
  const t = String(Date.now());
  const mac = crypto.createHmac('sha256', process.env.SESSION_SECRET || '').update(`zoho-state|${t}`).digest('base64url').slice(0, 20);
  return `${t}.${mac}`;
}
export function checkState(state) {
  const [t, mac] = String(state || '').split('.');
  if (!t || !mac || Date.now() - Number(t) > 15 * 60 * 1000) return false;
  const want = crypto.createHmac('sha256', process.env.SESSION_SECRET || '').update(`zoho-state|${t}`).digest('base64url').slice(0, 20);
  return want.length === mac.length && crypto.timingSafeEqual(Buffer.from(want), Buffer.from(mac));
}

export function authUrl(accounts = DEFAULT_ACCOUNTS) {
  const p = new URLSearchParams({
    scope: ZOHO_SCOPES,
    client_id: process.env.ZOHO_CLIENT_ID || '',
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    redirect_uri: ZOHO_REDIRECT,
    state: signState(),
  });
  return `${accounts}/oauth/v2/auth?${p}`;
}

async function loadConn() {
  const client = db();
  if (!client) return null;
  const { data, error } = await client.from('integrations').select('value').eq('key', KEY).maybeSingle();
  if (error || !data?.value) return null;
  try {
    return JSON.parse(open(data.value));
  } catch {
    return null;
  }
}

async function saveConn(conn) {
  const client = db();
  if (!client) throw new Error('no database');
  const { error } = await client.from('integrations').upsert({ key: KEY, value: seal(JSON.stringify(conn)), updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

export async function zohoStatus() {
  const conn = await loadConn();
  return { configured: zohoConfigured(), connected: Boolean(conn?.refresh_token), connectedAt: conn?.connected_at || null };
}

// Exchanges the one-time code from the Zoho consent screen for a long-lived refresh token.
export async function finishConnect(code, accountsServer) {
  const accounts = /^https:\/\/accounts\.zoho(cloud)?\.[a-z.]+$/i.test(accountsServer || '') ? accountsServer : DEFAULT_ACCOUNTS;
  const res = await fetch(`${accounts}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.ZOHO_CLIENT_ID || '',
      client_secret: process.env.ZOHO_CLIENT_SECRET || '',
      redirect_uri: ZOHO_REDIRECT,
      code,
    }),
  });
  const j = await res.json().catch(() => ({}));
  if (!j.refresh_token) throw new Error(j.error || `token exchange failed (${res.status})`);
  await saveConn({
    refresh_token: j.refresh_token,
    access_token: j.access_token,
    expires_at: Date.now() + (Number(j.expires_in) || 3600) * 1000 - 60000,
    api_domain: j.api_domain || 'https://www.zohoapis.com',
    accounts,
    connected_at: new Date().toISOString(),
  });
}

let cached = null;
async function access() {
  if (cached && cached.expires_at > Date.now()) return cached;
  const conn = await loadConn();
  if (!conn?.refresh_token) return null;
  if (conn.access_token && conn.expires_at > Date.now()) {
    cached = conn;
    return conn;
  }
  const res = await fetch(`${conn.accounts}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.ZOHO_CLIENT_ID || '',
      client_secret: process.env.ZOHO_CLIENT_SECRET || '',
      refresh_token: conn.refresh_token,
    }),
  });
  const j = await res.json().catch(() => ({}));
  if (!j.access_token) {
    console.error('zoho refresh failed', j.error || res.status);
    return null;
  }
  const next = { ...conn, access_token: j.access_token, expires_at: Date.now() + (Number(j.expires_in) || 3600) * 1000 - 60000, api_domain: j.api_domain || conn.api_domain };
  await saveConn(next).catch(() => {});
  cached = next;
  return next;
}

async function api(method, path, body) {
  const a = await access();
  if (!a) return { ok: false, status: 0 };
  const res = await fetch(`${a.api_domain}/crm/v8${path}`, {
    method,
    headers: { Authorization: `Zoho-oauthtoken ${a.access_token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return { ok: true, status: 204, data: null };
  const data = await res.json().catch(() => null);
  if (!res.ok) console.error('zoho api', method, path, res.status, JSON.stringify(data)?.slice(0, 300));
  return { ok: res.ok, status: res.status, data };
}

function splitName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { First_Name: undefined, Last_Name: parts[0] || 'Website lead' };
  return { First_Name: parts.slice(0, -1).join(' '), Last_Name: parts[parts.length - 1] };
}

async function findLead(email, phone) {
  if (email) {
    const r = await api('GET', `/Leads/search?email=${encodeURIComponent(email)}`);
    const hit = r.data?.data?.[0];
    if (hit) return hit;
  }
  if (phone) {
    const r = await api('GET', `/Leads/search?phone=${encodeURIComponent(phone)}`);
    const hit = r.data?.data?.[0];
    if (hit) return hit;
  }
  return null;
}

async function addNote(id, title, content) {
  if (!id || !content) return;
  await api('POST', `/Leads/${id}/Notes`, { data: [{ Note_Title: title.slice(0, 120), Note_Content: content.slice(0, 30000) }] });
}

const SUMMARY = /^Website ·.*$/m;

function summaryLine(lang, interest, extras = []) {
  const parts = ['Website', lang === 'fa' ? 'Farsi' : 'English'];
  if (INTEREST_TAG[interest]) parts.push(`Looking for: ${INTEREST_TAG[interest]}`);
  for (const e of extras) if (e) parts.push(e);
  return parts.join(' · ');
}

// Keeps one summary line at the top; merges in new facts without losing what was there.
function mergeDescription(old, lang, interest, extras, detail) {
  const prev = String(old || '');
  const prevLine = (prev.match(SUMMARY) || [''])[0];
  const prevExtras = prevLine.split(' · ').slice(2).filter((p) => !p.startsWith('Looking for:'));
  const prevInterest = (prevLine.match(/Looking for: ([^·]+)/) || [])[1]?.trim();
  const interestKey = interest || Object.keys(INTEREST_TAG).find((k) => INTEREST_TAG[k] === prevInterest);
  const line = summaryLine(lang, interestKey, [...new Set([...prevExtras, ...extras])]);
  const body = prev.replace(SUMMARY, '').trim();
  const add = detail && !body.includes(detail) ? detail : '';
  return [line, body, add].filter(Boolean).join('\n').slice(0, 30000);
}

// Creates the lead (or finds the existing one by email/phone), updates the summary line and adds an optional note.
// Never throws: CRM problems must not break the website.
export async function pushLead({ name, email, phone, lang, interest, description, noteTitle, note, tags = [], optOut }) {
  try {
    if (!(await access())) return { ok: false, reason: 'not connected' };
    let lead = await findLead(email, phone);
    if (!lead) {
      const record = {
        ...splitName(name),
        Email: email || undefined,
        Phone: phone || undefined,
        Lead_Status: 'Not Contacted',
        Description: mergeDescription('', lang, interest, tags, description || 'Joined johnjanjani.com.'),
        Email_Opt_Out: optOut === true ? true : undefined,
      };
      const r = await api('POST', '/Leads', { data: [record], trigger: [] });
      const id = r.data?.data?.[0]?.details?.id;
      if (!id) return { ok: false, reason: `create failed (${r.status})` };
      lead = { id };
    } else {
      const update = { id: lead.id, Description: mergeDescription(lead.Description, lang, interest, tags, description) };
      if (!lead.Phone && phone) update.Phone = phone;
      if (!lead.Email && email) update.Email = email;
      if (optOut === true) update.Email_Opt_Out = true;
      await api('PUT', '/Leads', { data: [update], trigger: [] });
    }
    if (note) await addNote(lead.id, noteTitle || 'From johnjanjani.com', note);
    return { ok: true, id: lead.id };
  } catch (e) {
    console.error('zoho push failed', e?.message);
    return { ok: false, reason: e?.message };
  }
}

// Waits for the CRM at most a few seconds so visitors never wait on Zoho.
export function pushLeadSoon(payload, ms = 5000) {
  return Promise.race([pushLead(payload), new Promise((r) => setTimeout(() => r({ ok: false, reason: 'timeout' }), ms))]);
}

export { INTEREST_TAG };
