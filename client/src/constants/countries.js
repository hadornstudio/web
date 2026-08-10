// Mirrors server/src/constants/countries.js — kept in sync manually.
export const COUNTRIES = [
  'Nigeria', 'United States', 'United Kingdom', 'Canada', 'Ghana', 'Kenya', 'South Africa',
  'Germany', 'France', 'Netherlands', 'Belgium', 'Ireland', 'Spain', 'Italy', 'Portugal',
  'Switzerland', 'Austria', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland',
  'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'India', 'China', 'Japan', 'South Korea',
  'Singapore', 'Malaysia', 'Australia', 'New Zealand', 'Brazil', 'Mexico', 'Egypt', 'Morocco',
  'Ethiopia', 'Rwanda', 'Uganda', 'Tanzania', 'Cameroon', "Cote d'Ivoire", 'Senegal', 'Togo', 'Benin',
];

export function isNigeria(country) {
  return (country || '').trim().toLowerCase() === 'nigeria';
}
