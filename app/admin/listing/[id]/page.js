import { notFound } from 'next/navigation';
import { isAdmin } from '@/lib/session';
import { db } from '@/lib/supabase';
import { LoginForm, ListingEditor } from '../../AdminClient';

export const dynamic = 'force-dynamic';

export default async function EditListing({ params, searchParams }) {
  if (!isAdmin()) return <LoginForm />;
  let initial = null;
  if (params.id !== 'new') {
    const client = db();
    const { data } = client ? await client.from('listings').select('*').eq('id', params.id).maybeSingle() : { data: null };
    if (!data) notFound();
    initial = data;
  }
  return (
    <main className="wrap" style={{ paddingBlock: '32px 72px', maxWidth: 900 }}>
      <a className="back" href="/admin" style={{ marginTop: 0 }}>← Back to admin</a>
      <h1 style={{ fontSize: 40, margin: '12px 0 24px' }}>{initial ? 'Edit listing' : searchParams?.section === 'pick' ? 'Add a daily pick' : 'Add a toured home'}</h1>
      <ListingEditor initial={initial} defaultSection={searchParams?.section} />
    </main>
  );
}
