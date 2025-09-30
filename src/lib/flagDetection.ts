// Flag emoji detection utility
// Detects whether the browser properly renders flag emojis or shows fallback text

import { COUNTRY_CODE_TO_NAME } from './countries';

let cachedSupport: boolean | null = null;

/**
 * Detects if the browser supports flag emojis by drawing a flag on canvas
 * and checking if it contains colored pixels (not just grayscale text)
 */
export function doesBrowserSupportFlagEmojis(): boolean {
  // Return cached result if available
  if (cachedSupport !== null) {
    return cachedSupport;
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      cachedSupport = false;
      return false;
    }

    // Draw the US flag emoji on the canvas
    ctx.font = '10px sans-serif';
    ctx.fillText('🇺🇸', 0, 10);

    // Get pixel data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    // Check if any pixel is non-grayscale (has color)
    // If the emoji is rendered as text (like "US"), all pixels will be grayscale
    for (let i = 0; i < imageData.length; i += 4) {
      const alpha = imageData[i + 3];

      // Skip transparent pixels
      if (alpha === 0) continue;

      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];

      // Check if this pixel has color (not grayscale)
      if (r !== g || r !== b) {
        cachedSupport = true;
        return true;
      }
    }

    // No colored pixels found, flags are not supported
    cachedSupport = false;
    return false;
  } catch (error) {
    console.warn('Failed to detect flag emoji support:', error);
    cachedSupport = false;
    return false;
  }
}

/**
 * Clears the cached flag support detection result
 * Useful for testing or if you need to re-detect
 */
export function clearFlagSupportCache(): void {
  cachedSupport = null;
}

/**
 * Gets a fallback representation for a country code
 * Returns a 2-3 letter code from the country name or code
 */
export function getCountryCode(countryNameOrCode: string | null): string {
  if (!countryNameOrCode) return '??';

  // Check if it's already a country code
  const upperCode = countryNameOrCode.toUpperCase();
  if (COUNTRY_CODE_TO_NAME[upperCode]) {
    return upperCode;
  }

  // Try to find the code by reverse lookup from country name
  for (const [code, name] of Object.entries(COUNTRY_CODE_TO_NAME)) {
    if (name === countryNameOrCode) {
      return code;
    }
  }

  // If it's already a short code (3 letters or less), return it
  if (countryNameOrCode.length <= 3) {
    return countryNameOrCode.toUpperCase();
  }

  // For longer names, try to create a reasonable abbreviation
  // Take first 3 letters as fallback
  return countryNameOrCode.substring(0, 3).toUpperCase();
}