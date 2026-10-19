# johnjanjani.com

Bilingual (English / Farsi) real estate website for Purya (John) Janjani, Century 21 Leading Edge Realty Inc., Brokerage.

- Listings are public, but **price and address are shown only to members**.
- Joining takes name, email, phone and contact consent. Every new member is a lead in **/admin**.
- **/admin** (password protected): add and edit listings, upload photos, see members, listing views and showing requests.
- Built with Next.js 14 and Supabase. Hosted on Vercel.

## One-time setup

### 1. Database (Supabase)
1. Open your Supabase project → **SQL Editor** → **New query**.
2. Paste everything from `supabase/schema.sql` and press **Run**.
3. Go to **Project Settings → API** and keep that page open for step 2.

### 2. Hosting (Vercel)
1. In Vercel, **Add New → Project**, pick the `johnjanjani-site` repository, press **Import**.
2. Before pressing Deploy, open **Environment Variables** and add these (names exactly as written):

| Name | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → `service_role` key (secret, never share it) |
| `SESSION_SECRET` | Any long random text, 40+ characters |
| `ADMIN_PASSWORD` | The password you will use for /admin |
| `SITE_URL` | `https://johnjanjani.com` |
| `RESEND_API_KEY` | Optional, for email alerts (resend.com) |
| `LEAD_NOTIFY_EMAIL` | Optional, the email that receives alerts |

3. Press **Deploy**. Test the site on the `.vercel.app` address Vercel gives you.

### 3. Domain (Namecheap)
1. In Vercel → Project → **Settings → Domains**, add `johnjanjani.com` and `www.johnjanjani.com`.
2. Vercel shows the DNS records to set. In Namecheap → Domain List → **Manage → Advanced DNS**, replace the old records with the ones Vercel shows (usually an `A` record for `@` and a `CNAME` for `www`).
3. If the domain uses Cloudflare nameservers, set the records in Cloudflare instead, with the proxy (orange cloud) turned **off**.
4. SSL is issued automatically by Vercel within a few minutes.

## Adding a listing
1. Go to `johnjanjani.com/admin` and sign in.
2. Press **Add a listing**, fill in the details in English and Farsi, upload photos (the first one is the cover), press **Save**.
3. Only list properties you are authorized to advertise. For other brokerages' listings, get the listing brokerage's written consent first.

## Updating the market snapshot
Edit the `market` lines in `lib/i18n.js` (English and Farsi) each month.
