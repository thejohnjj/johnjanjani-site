import { redirect } from 'next/navigation';
import { slugForCode } from '@/lib/listings';

export const dynamic = 'force-dynamic';

// /en/c/12 or /fa/c/12 → the listing with code 12 in that language.
export default async function CodeRedirect({ params }) {
  const slug = await slugForCode(decodeURIComponent(params.code));
  redirect(slug ? `/${params.lang}/listings/${slug}` : `/${params.lang}#listings`);
}
