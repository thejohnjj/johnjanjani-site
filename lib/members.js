// Creating members, shared by "Join free" and the VOW (sold prices) sign-up.
import 'server-only';
import { db } from '@/lib/supabase';
import { notify } from '@/lib/notify';
import { welcomeEmail, sendMemberEmail } from '@/lib/member-mail';
import { pushLeadSoon } from '@/lib/zoho';

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Saves the member (or updates the existing one by email). Runs the welcome steps only for new members.
export async function upsertMember({ name, email, phone, lang, firstListing = null, source = 'Join free' }) {
  const client = db();
  if (!client) throw new Error('server');
  const now = new Date().toISOString();
  const { data: existing } = await client.from('members').select('id').eq('email', email).maybeSingle();
  if (existing?.id) {
    await client.from('members').update({ name, phone, lang, consent: true, consent_at: now, last_seen_at: now }).eq('id', existing.id);
    return { id: existing.id, isNew: false };
  }
  const { data, error } = await client
    .from('members')
    .insert({ name, email, phone, lang, consent: true, consent_at: now, first_listing: firstListing })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  const id = data.id;
  await notify(`New member: ${name}`, [
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Language: ${lang === 'fa' ? 'Farsi' : 'English'}`,
    `Signed up through: ${source}`,
    firstListing ? `Looking at: ${firstListing}` : '',
    '',
    'See all members at johnjanjani.com/admin',
  ]);
  const mail = welcomeEmail({ id, name, lang });
  const sent = await sendMemberEmail({ to: email, ...mail, memberId: id });
  if (sent) await client.from('members').update({ welcome_sent_at: new Date().toISOString() }).eq('id', id);
  await pushLeadSoon({
    name, email, phone, lang, tags: ['Member', source === 'Join free' ? null : source].filter(Boolean),
    description: `Joined johnjanjani.com as a member through ${source} (${lang === 'fa' ? 'Farsi' : 'English'}).${firstListing ? ` First home viewed: ${firstListing}.` : ''}`,
  });
  return { id, isNew: true };
}
