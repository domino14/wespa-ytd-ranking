// Country code to flag emoji mapping
const countryToFlag: { [key: string]: string } = {
  'Australia': '🇦🇺',
  'United States': '🇺🇸',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Canada': '🇨🇦',
  'New Zealand': '🇳🇿',
  'South Africa': '🇿🇦',
  'India': '🇮🇳',
  'Pakistan': '🇵🇰',
  'Thailand': '🇹🇭',
  'Singapore': '🇸🇬',
  'Malaysia': '🇲🇾',
  'Philippines': '🇵🇭',
  'Nigeria': '🇳🇬',
  'Ghana': '🇬🇭',
  'Kenya': '🇰🇪',
  'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  'Ireland': '🇮🇪',
  'France': '🇫🇷',
  'Germany': '🇩🇪',
  'Italy': '🇮🇹',
  'Spain': '🇪🇸',
  'Poland': '🇵🇱',
  'Netherlands': '🇳🇱',
  'Belgium': '🇧🇪',
  'Sweden': '🇸🇪',
  'Norway': '🇳🇴',
  'Denmark': '🇩🇰',
  'Finland': '🇫🇮',
  'Israel': '🇮🇱',
  'Japan': '🇯🇵',
  'Sri Lanka': '🇱🇰',
  'Bangladesh': '🇧🇩',
  'Indonesia': '🇮🇩',
  'Hong Kong': '🇭🇰',
  'United Kingdom': '🇬🇧',
  'UK': '🇬🇧',
  'Trinidad and Tobago': '🇹🇹',
  'Barbados': '🇧🇧',
  'Jamaica': '🇯🇲',
  'Malta': '🇲🇹',
  'Bahrain': '🇧🇭',
  'Kuwait': '🇰🇼',
  'Qatar': '🇶🇦',
  'UAE': '🇦🇪',
  'United Arab Emirates': '🇦🇪',
  'Oman': '🇴🇲',
  'Saudi Arabia': '🇸🇦',
  'Zambia': '🇿🇲',
  'Zimbabwe': '🇿🇼',
  'Uganda': '🇺🇬',
  'Tanzania': '🇹🇿',
  'Botswana': '🇧🇼',
};

// Country code abbreviations to full names
const countryCodeToName: { [key: string]: string } = {
  'USA': 'United States',
  'AUS': 'Australia',
  'CAN': 'Canada',
  'ENG': 'England',
  'NZL': 'New Zealand',
  'ZAF': 'South Africa',
  'IND': 'India',
  'PAK': 'Pakistan',
  'THA': 'Thailand',
  'SGP': 'Singapore',
  'MYS': 'Malaysia',
  'PHL': 'Philippines',
  'NGA': 'Nigeria',
  'GHA': 'Ghana',
  'KEN': 'Kenya',
  'SCO': 'Scotland',
  'WAL': 'Wales',
  'IRL': 'Ireland',
  'FRA': 'France',
  'DEU': 'Germany',
  'ITA': 'Italy',
  'ESP': 'Spain',
  'POL': 'Poland',
  'NLD': 'Netherlands',
  'BEL': 'Belgium',
  'SWE': 'Sweden',
  'NOR': 'Norway',
  'DNK': 'Denmark',
  'FIN': 'Finland',
  'ISR': 'Israel',
  'JPN': 'Japan',
  'LKA': 'Sri Lanka',
  'BGD': 'Bangladesh',
  'IDN': 'Indonesia',
  'HKG': 'Hong Kong',
  'TTO': 'Trinidad and Tobago',
  'BRB': 'Barbados',
  'JAM': 'Jamaica',
  'MLT': 'Malta',
  'BHR': 'Bahrain',
  'KWT': 'Kuwait',
  'QAT': 'Qatar',
  'ARE': 'UAE',
  'UAE': 'United Arab Emirates',
  'OMN': 'Oman',
  'SAU': 'Saudi Arabia',
  'ZMB': 'Zambia',
  'ZWE': 'Zimbabwe',
  'UGA': 'Uganda',
  'TZA': 'Tanzania',
  'BWA': 'Botswana',
};

export function getCountryFlag(country: string | null): string | null {
  if (!country) return null;

  // Try direct lookup first
  const flag = countryToFlag[country];
  if (flag) return flag;

  // Try converting country code to name then lookup
  const fullCountryName = countryCodeToName[country.toUpperCase()];
  if (fullCountryName) {
    return countryToFlag[fullCountryName] || null;
  }

  // Try case-insensitive lookup
  const lowerCountry = country.toLowerCase();
  for (const [countryName, flagEmoji] of Object.entries(countryToFlag)) {
    if (countryName.toLowerCase() === lowerCountry) {
      return flagEmoji;
    }
  }

  return null;
}

export function getCountryName(country: string | null): string | null {
  if (!country) return null;

  // Convert country code to full name if needed
  const fullName = countryCodeToName[country.toUpperCase()];
  return fullName || country;
}

export function formatPlayerCountry(country: string | null): { flag: string | null; name: string | null } {
  const name = getCountryName(country);
  const flag = getCountryFlag(country);

  return { flag, name };
}