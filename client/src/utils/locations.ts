export const COUNTRIES = [
  'India',
  'United States',
  'United Kingdom',
  'United Arab Emirates',
  'Canada',
  'Australia',
  'Singapore',
  'Malaysia',
  'Saudi Arabia',
  'Qatar',
  'Germany',
  'France',
  'Japan',
  'South Korea',
  'South Africa',
  'Brazil',
  'Mexico',
  'Indonesia',
  'Thailand',
  'Philippines',
];

export const REGION_OPTIONS: Record<string, Record<string, string[]>> = {
  India: {
    Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane'],
    Delhi: ['New Delhi', 'Delhi'],
    Karnataka: ['Bengaluru', 'Mysuru', 'Mangaluru'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai'],
    Telangana: ['Hyderabad', 'Warangal'],
    Gujarat: ['Ahmedabad', 'Surat', 'Vadodara'],
    Rajasthan: ['Jaipur', 'Udaipur', 'Jodhpur'],
    Kerala: ['Kochi', 'Thiruvananthapuram', 'Kozhikode'],
    'West Bengal': ['Kolkata', 'Siliguri'],
    'Uttar Pradesh': ['Lucknow', 'Noida', 'Ghaziabad', 'Varanasi'],
  },
  'United States': {
    California: ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose'],
    'New York': ['New York City', 'Buffalo', 'Rochester'],
    Texas: ['Houston', 'Dallas', 'Austin', 'San Antonio'],
    Florida: ['Miami', 'Orlando', 'Tampa'],
    Illinois: ['Chicago', 'Springfield'],
  },
  'United Kingdom': {
    England: ['London', 'Manchester', 'Birmingham', 'Liverpool'],
    Scotland: ['Edinburgh', 'Glasgow'],
    Wales: ['Cardiff', 'Swansea'],
  },
  'United Arab Emirates': {
    Dubai: ['Dubai'],
    'Abu Dhabi': ['Abu Dhabi', 'Al Ain'],
    Sharjah: ['Sharjah'],
  },
  Canada: {
    Ontario: ['Toronto', 'Ottawa'],
    Quebec: ['Montreal', 'Quebec City'],
    'British Columbia': ['Vancouver', 'Victoria'],
  },
  Australia: {
    'New South Wales': ['Sydney', 'Newcastle'],
    Victoria: ['Melbourne', 'Geelong'],
    Queensland: ['Brisbane', 'Gold Coast'],
  },
  Singapore: {
    Singapore: ['Singapore'],
  },
  Malaysia: {
    'Kuala Lumpur': ['Kuala Lumpur'],
    Selangor: ['Shah Alam', 'Petaling Jaya'],
    Penang: ['George Town'],
  },
};

export function statesForCountry(country?: string) {
  if (!country) return [];
  return Object.keys(REGION_OPTIONS[country] || {});
}

export function citiesForRegion(country?: string, state?: string) {
  if (!country || !state) return [];
  return REGION_OPTIONS[country]?.[state] || [];
}
