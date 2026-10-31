import 'server-only';
import { SITE } from '@/lib/site';
import { accountEmail, sendMemberEmail } from '@/lib/member-mail';
import { signToken } from '@/lib/vow';

export async function sendVerify(member, lang) {
  const expires = Date.now() + 48 * 3600 * 1000;
  const sig = signToken(member.id, 'verify', expires);
  const url = `${SITE}/api/vow/verify?m=${member.id}&e=${expires}&s=${sig}&l=${lang === 'fa' ? 'fa' : 'en'}`;
  const mail = accountEmail({ kind: 'verify', name: member.name, lang, url });
  return sendMemberEmail({ to: member.email, ...mail });
}

export async function sendReset(member, lang) {
  const expires = Date.now() + 3600 * 1000;
  const bind = String(member.password_set_at ? new Date(member.password_set_at).getTime() : 0);
  const sig = signToken(member.id, 'reset', expires, bind);
  const url = `${SITE}/${lang === 'fa' ? 'fa' : 'en'}/account/reset?m=${member.id}&e=${expires}&s=${sig}`;
  const mail = accountEmail({ kind: 'reset', name: member.name, lang, url });
  return sendMemberEmail({ to: member.email, ...mail });
}
