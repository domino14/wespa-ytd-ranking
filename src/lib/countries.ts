// Centralized country code mappings and utilities

// Country code to full name mapping
export const COUNTRY_CODE_TO_NAME: { [key: string]: string } = {
  // North America
  'USA': 'United States',
  'CAN': 'Canada',

  // Europe
  'ENG': 'England',
  'SCO': 'Scotland',
  'WAL': 'Wales',
  'NIR': 'Northern Ireland',
  'IRL': 'Ireland',
  'FRA': 'France',
  'DEU': 'Germany',
  'ITA': 'Italy',
  'ESP': 'Spain',
  'PRT': 'Portugal',
  'CHE': 'Switzerland',
  'AUT': 'Austria',
  'NLD': 'Netherlands',
  'BEL': 'Belgium',
  'SWE': 'Sweden',
  'NOR': 'Norway',
  'DNK': 'Denmark',
  'FIN': 'Finland',
  'POL': 'Poland',
  'ROU': 'Romania',
  'HRV': 'Croatia',
  'SVN': 'Slovenia',
  'CZE': 'Czech Republic',
  'SVK': 'Slovakia',
  'HUN': 'Hungary',
  'BGR': 'Bulgaria',
  'SRB': 'Serbia',
  'BIH': 'Bosnia and Herzegovina',
  'MNE': 'Montenegro',
  'MKD': 'North Macedonia',
  'ALB': 'Albania',
  'GRC': 'Greece',
  'TUR': 'Turkey',
  'CYP': 'Cyprus',
  'EST': 'Estonia',
  'LVA': 'Latvia',
  'LTU': 'Lithuania',
  'LUX': 'Luxembourg',

  // Oceania
  'AUS': 'Australia',
  'NZL': 'New Zealand',

  // Africa
  'ZAF': 'South Africa',
  'NGA': 'Nigeria',
  'ETH': 'Ethiopia',
  'EGY': 'Egypt',
  'DZA': 'Algeria',
  'MAR': 'Morocco',
  'UGA': 'Uganda',
  'KEN': 'Kenya',
  'TZA': 'Tanzania',
  'GHA': 'Ghana',
  'MOZ': 'Mozambique',
  'AGO': 'Angola',
  'MDG': 'Madagascar',
  'CMR': 'Cameroon',
  'CIV': 'Côte d\'Ivoire',
  'NER': 'Niger',
  'BFA': 'Burkina Faso',
  'MLI': 'Mali',
  'MWI': 'Malawi',
  'ZMB': 'Zambia',
  'ZWE': 'Zimbabwe',
  'BWA': 'Botswana',
  'SEN': 'Senegal',
  'TCD': 'Chad',
  'SOM': 'Somalia',
  'RWA': 'Rwanda',
  'BDI': 'Burundi',
  'SLE': 'Sierra Leone',

  // Asia
  'IND': 'India',
  'PAK': 'Pakistan',
  'THA': 'Thailand',
  'SGP': 'Singapore',
  'MYS': 'Malaysia',
  'PHL': 'Philippines',
  'IDN': 'Indonesia',
  'HKG': 'Hong Kong',
  'JPN': 'Japan',
  'LKA': 'Sri Lanka',
  'BGD': 'Bangladesh',
  'ISR': 'Israel',

  // Middle East
  'BHR': 'Bahrain',
  'KWT': 'Kuwait',
  'QAT': 'Qatar',
  'ARE': 'UAE',
  'UAE': 'United Arab Emirates',
  'OMN': 'Oman',
  'SAU': 'Saudi Arabia',

  // Caribbean
  'TTO': 'Trinidad and Tobago',
  'BRB': 'Barbados',
  'JAM': 'Jamaica',

  // Other
  'MLT': 'Malta',
};

// Country name to flag emoji mapping
export const COUNTRY_TO_FLAG: { [key: string]: string } = {
  // North America
  'United States': '🇺🇸',
  'Canada': '🇨🇦',

  // Europe
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  'Northern Ireland': '🇬🇧',
  'Ireland': '🇮🇪',
  'France': '🇫🇷',
  'Germany': '🇩🇪',
  'Italy': '🇮🇹',
  'Spain': '🇪🇸',
  'Portugal': '🇵🇹',
  'Switzerland': '🇨🇭',
  'Austria': '🇦🇹',
  'Netherlands': '🇳🇱',
  'Belgium': '🇧🇪',
  'Sweden': '🇸🇪',
  'Norway': '🇳🇴',
  'Denmark': '🇩🇰',
  'Finland': '🇫🇮',
  'Poland': '🇵🇱',
  'Romania': '🇷🇴',
  'Croatia': '🇭🇷',
  'Slovenia': '🇸🇮',
  'Czech Republic': '🇨🇿',
  'Slovakia': '🇸🇰',
  'Hungary': '🇭🇺',
  'Bulgaria': '🇧🇬',
  'Serbia': '🇷🇸',
  'Bosnia and Herzegovina': '🇧🇦',
  'Montenegro': '🇲🇪',
  'North Macedonia': '🇲🇰',
  'Albania': '🇦🇱',
  'Greece': '🇬🇷',
  'Turkey': '🇹🇷',
  'Cyprus': '🇨🇾',
  'Estonia': '🇪🇪',
  'Latvia': '🇱🇻',
  'Lithuania': '🇱🇹',
  'Luxembourg': '🇱🇺',
  'United Kingdom': '🇬🇧',
  'UK': '🇬🇧',

  // Oceania
  'Australia': '🇦🇺',
  'New Zealand': '🇳🇿',

  // Africa
  'South Africa': '🇿🇦',
  'Nigeria': '🇳🇬',
  'Ethiopia': '🇪🇹',
  'Egypt': '🇪🇬',
  'Algeria': '🇩🇿',
  'Morocco': '🇲🇦',
  'Uganda': '🇺🇬',
  'Kenya': '🇰🇪',
  'Tanzania': '🇹🇿',
  'Ghana': '🇬🇭',
  'Mozambique': '🇲🇿',
  'Angola': '🇦🇴',
  'Madagascar': '🇲🇬',
  'Cameroon': '🇨🇲',
  'Côte d\'Ivoire': '🇨🇮',
  'Niger': '🇳🇪',
  'Burkina Faso': '🇧🇫',
  'Mali': '🇲🇱',
  'Malawi': '🇲🇼',
  'Zambia': '🇿🇲',
  'Zimbabwe': '🇿🇼',
  'Botswana': '🇧🇼',
  'Senegal': '🇸🇳',
  'Chad': '🇹🇩',
  'Somalia': '🇸🇴',
  'Rwanda': '🇷🇼',
  'Burundi': '🇧🇮',
  'Sierra Leone': '🇸🇱',

  // Asia
  'India': '🇮🇳',
  'Pakistan': '🇵🇰',
  'Thailand': '🇹🇭',
  'Singapore': '🇸🇬',
  'Malaysia': '🇲🇾',
  'Philippines': '🇵🇭',
  'Indonesia': '🇮🇩',
  'Hong Kong': '🇭🇰',
  'Japan': '🇯🇵',
  'Sri Lanka': '🇱🇰',
  'Bangladesh': '🇧🇩',
  'Israel': '🇮🇱',

  // Middle East
  'Bahrain': '🇧🇭',
  'Kuwait': '🇰🇼',
  'Qatar': '🇶🇦',
  'UAE': '🇦🇪',
  'United Arab Emirates': '🇦🇪',
  'Oman': '🇴🇲',
  'Saudi Arabia': '🇸🇦',

  // Caribbean
  'Trinidad and Tobago': '🇹🇹',
  'Barbados': '🇧🇧',
  'Jamaica': '🇯🇲',

  // Other
  'Malta': '🇲🇹',
};

// Common countries for dropdowns (sorted by usage)
export const COMMON_COUNTRIES = [
  // Major English-speaking WESPA countries
  'Australia', 'United States', 'England', 'Canada', 'New Zealand', 'South Africa',

  // Major Asian WESPA countries
  'India', 'Pakistan', 'Thailand', 'Singapore', 'Malaysia', 'Philippines', 'Indonesia', 'Hong Kong',

  // Major African WESPA countries
  'Nigeria', 'Ghana', 'Kenya', 'Uganda', 'Tanzania', 'Ethiopia', 'Egypt', 'Morocco', 'Algeria',

  // UK regions
  'Scotland', 'Wales', 'Ireland',

  // Major European countries
  'France', 'Germany', 'Italy', 'Spain', 'Portugal', 'Switzerland', 'Austria',

  // Eastern Europe
  'Romania', 'Croatia', 'Slovenia', 'Czech Republic', 'Slovakia', 'Hungary', 'Bulgaria', 'Serbia',
  'Greece', 'Turkey', 'Cyprus', 'Estonia', 'Latvia', 'Lithuania',

  // Caribbean
  'Trinidad and Tobago', 'Barbados', 'Jamaica',

  // Other
  'Malta', 'Bahrain', 'Kuwait', 'Qatar', 'UAE', 'Oman', 'Saudi Arabia', 'Bangladesh', 'Sri Lanka'
];

// Utility functions
export function getCountryName(countryCodeOrName: string | null): string | null {
  if (!countryCodeOrName) return null;

  // If it's already a full name, return it
  if (COUNTRY_TO_FLAG[countryCodeOrName]) {
    return countryCodeOrName;
  }

  // Try to convert from country code
  const fullName = COUNTRY_CODE_TO_NAME[countryCodeOrName.toUpperCase()];
  return fullName || countryCodeOrName;
}

export function getCountryFlag(countryCodeOrName: string | null): string | null {
  if (!countryCodeOrName) return null;

  // Try direct flag lookup
  const flag = COUNTRY_TO_FLAG[countryCodeOrName];
  if (flag) return flag;

  // Try converting country code to name first
  const countryName = getCountryName(countryCodeOrName);
  return countryName ? COUNTRY_TO_FLAG[countryName] : null;
}

export function formatPlayerCountry(countryCodeOrName: string | null): { flag: string | null; name: string | null } {
  const name = getCountryName(countryCodeOrName);
  const flag = getCountryFlag(countryCodeOrName);
  return { flag, name };
}