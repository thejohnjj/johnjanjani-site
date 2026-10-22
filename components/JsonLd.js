import { SITE, PHONE_TEL, INSTAGRAM_EN, INSTAGRAM_FA, FACEBOOK_URL } from '@/lib/site';

function Script({ data }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}

const AREAS = ['Toronto', 'North York', 'Scarborough', 'Etobicoke', 'Richmond Hill', 'Vaughan', 'Markham', 'Aurora', 'Newmarket', 'Mississauga', 'Oakville', 'Brampton'];

// Tells Google who John is: name, phone, office, areas served, languages and social profiles.
export function AgentJsonLd({ lang }) {
  const agent = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': `${SITE}/#agent`,
    name: 'Purya (John) Janjani',
    alternateName: ['John Janjani', 'Purya Janjani', 'پوریا جان جانی'],
    jobTitle: 'Sales Representative',
    url: `${SITE}/${lang}`,
    image: `${SITE}/images/john.jpg`,
    logo: `${SITE}/icon.svg`,
    telephone: PHONE_TEL,
    address: { '@type': 'PostalAddress', streetAddress: '1053 McNicoll Ave', addressLocality: 'Toronto', addressRegion: 'ON', addressCountry: 'CA' },
    areaServed: [{ '@type': 'AdministrativeArea', name: 'Greater Toronto Area' }, ...AREAS.map((name) => ({ '@type': 'City', name }))],
    knowsLanguage: ['en', 'fa'],
    sameAs: [`https://www.instagram.com/${INSTAGRAM_EN}/`, `https://www.instagram.com/${INSTAGRAM_FA}/`, FACEBOOK_URL].filter(Boolean),
    parentOrganization: { '@type': 'RealEstateAgent', name: 'Century 21 Leading Edge Realty Inc., Brokerage' },
  };
  const site = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE}/#website`,
    name: 'John Janjani',
    alternateName: 'پوریا جان جانی',
    url: SITE,
    inLanguage: ['en', 'fa'],
    publisher: { '@id': `${SITE}/#agent` },
  };
  return (
    <>
      <Script data={agent} />
      <Script data={site} />
    </>
  );
}

// A listing page: what the home is and where (price stays members-only, so it is not included).
export function ListingJsonLd({ l, lang, url }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: `${l.type[lang]} · ${l.city[lang]}`,
    url,
    description: l.description[lang].slice(0, 500),
    image: l.photos.slice(0, 6),
    datePosted: l.pickedAt || undefined,
    inLanguage: lang,
    about: {
      '@type': l.kind === 'condo' ? 'Apartment' : 'SingleFamilyResidence',
      numberOfBedrooms: l.beds || undefined,
      numberOfBathroomsTotal: l.baths || undefined,
      address: { '@type': 'PostalAddress', addressLocality: l.city.en.replace(/\s*\(.*$/, ''), addressRegion: 'ON', addressCountry: 'CA' },
    },
    provider: { '@id': `${SITE}/#agent` },
  };
  return <Script data={data} />;
}
