// Filter options shared by the homepage search bar and the search page.
export const AREAS = [
  'Toronto', 'Richmond Hill', 'Vaughan', 'Markham', 'Aurora', 'Newmarket', 'King', 'Whitchurch-Stouffville',
  'East Gwillimbury', 'Georgina', 'Mississauga', 'Brampton', 'Caledon', 'Oakville', 'Burlington', 'Milton',
  'Halton Hills', 'Pickering', 'Ajax', 'Whitby', 'Oshawa', 'Clarington', 'Uxbridge', 'Scugog', 'Brock',
];
export const TYPE_KEYS = ['detached', 'semi', 'town', 'condo'];
export const PRICES_SALE = [400000, 500000, 600000, 700000, 800000, 900000, 1000000, 1250000, 1500000, 1750000, 2000000, 2500000, 3000000, 4000000, 5000000];
export const PRICES_LEASE = [1500, 2000, 2500, 3000, 3500, 4000, 5000, 6000, 8000, 10000];
export const shortPrice = (n) => (n >= 1000000 ? `$${n / 1000000}M` : n >= 100000 ? `$${n / 1000}K` : `$${n.toLocaleString('en-US')}`);
