// Made-up sample data for checking page layouts locally (never real MLS® data).
// Active only when PROPTX_FIXTURE=1 is set on a developer machine; it is never set on Vercel.
const STREETS = ['Sample Street', 'Example Avenue', 'Maple Test Drive', 'Placeholder Crescent', 'Demo Road', 'Mock Lane'];
const PHOTOS = ['/video/tours-wide-3.jpg', '/video/reel-1.jpg', '/video/tours-tall-3.jpg'];
const TYPES = ['Detached', 'Condo Apartment', 'Semi-Detached ', 'Att/Row/Townhouse'];

function fake(n, status) {
  const sold = status === 'Sold' || status === 'Leased';
  const price = 650000 + ((n * 137) % 40) * 25000;
  const day = String(1 + (n % 27)).padStart(2, '0');
  return {
    ListingKey: `X${1000000 + n}`,
    ListPrice: price,
    OriginalListPrice: price + 20000,
    ClosePrice: sold ? price + ((n % 5) - 2) * 15000 : null,
    CloseDate: '2026-11-15',
    SoldEntryTimestamp: sold ? `2026-10-${day}T12:00:00Z` : null,
    LeasedEntryTimestamp: null,
    DoNotDiscloseUntilClosingYN: n % 11 === 0,
    MlsStatus: status,
    ContractStatus: sold ? 'Unavailable' : 'Available',
    TransactionType: 'For Sale',
    DaysOnMarket: 5 + (n % 30),
    UnparsedAddress: `${10 + n} ${STREETS[n % STREETS.length]}, Sampletown, ON A1A 1A1`,
    InternetAddressDisplayYN: true,
    InternetEntireListingDisplayYN: true,
    City: 'Sampletown',
    CityRegion: 'Test Community',
    PropertySubType: TYPES[n % TYPES.length],
    BedroomsAboveGrade: 2 + (n % 3),
    BedroomsBelowGrade: n % 2,
    BedroomsTotal: 2 + (n % 3) + (n % 2),
    BathroomsTotalInteger: 2 + (n % 2),
    ParkingTotal: 1 + (n % 2),
    LivingAreaRange: '1500-2000',
    ListOfficeName: 'Sample Realty Brokerage',
    StreetNumber: String(10 + n),
    StreetName: STREETS[n % STREETS.length].split(' ')[0],
    UnitNumber: null,
    PublicRemarks: 'SAMPLE TEXT for layout checks only. This is not a real listing. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    TaxAnnualAmount: 5400,
    TaxYear: 2026,
    ApproximateAge: '16-30',
    Basement: ['Finished'],
    HeatType: 'Forced Air',
    Cooling: ['Central Air'],
    GarageType: 'Attached',
    OriginalEntryTimestamp: `2026-09-${day}T12:00:00Z`,
    Media: PHOTOS.map((u, i) => ({ MediaURL: u, Order: i })),
  };
}

export function fixtureResponse(path) {
  const d = decodeURIComponent(path);
  const status = /MlsStatus eq 'Leased'/.test(d) ? 'Leased' : /MlsStatus eq 'Sold'/.test(d) ? 'Sold' : 'New';
  if (path.startsWith('HistoryTransactional')) return { value: [{ PreviousValue: '899000', NewValue: '879000', ModificationTimestamp: '2026-09-20T12:00:00Z' }] };
  const one = /ListingKey eq '/.test(decodeURIComponent(path));
  const n = one ? 3 : 24;
  const rows = Array.from({ length: n }, (_, i) => fake(i + 1, one ? 'Sold' : status));
  if (/StreetNumber eq/.test(decodeURIComponent(path)) && !/Sold'/.test(decodeURIComponent(path))) {
    return { value: [fake(3, 'Sold'), { ...fake(3, 'Terminated'), ListingKey: 'X0999990', OriginalEntryTimestamp: '2025-04-02T12:00:00Z', TerminatedDate: '2025-06-10' }, { ...fake(3, 'Expired'), ListingKey: 'X0999980', OriginalEntryTimestamp: '2023-03-01T12:00:00Z', ExpirationDate: '2023-06-01' }] };
  }
  return { '@odata.count': one ? 1 : 312, value: rows };
}
