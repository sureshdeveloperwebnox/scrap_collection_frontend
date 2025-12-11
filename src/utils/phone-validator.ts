import { isValidPhoneNumber, parsePhoneNumber, CountryCode, getCountryCallingCode } from 'libphonenumber-js';

/**
 * Validates a phone number using libphonenumber-js
 * @param phoneNumber - The phone number to validate (should include country code like +1, +91, etc.)
 * @param defaultCountry - Optional default country code if phone doesn't include country code
 * @returns Object with isValid boolean and error message if invalid
 */
export function validatePhoneNumber(
  phoneNumber: string,
  defaultCountry?: CountryCode
): { isValid: boolean; error?: string; formatted?: string } {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return {
      isValid: false,
      error: 'Phone number is required'
    };
  }

  // Remove any whitespace
  const cleanedPhone = phoneNumber.trim();

  // Check if phone number is valid
  try {
    const isValid = isValidPhoneNumber(cleanedPhone, defaultCountry);
    
    if (!isValid) {
      return {
        isValid: false,
        error: 'Please provide a valid phone number with country code (e.g., +1 234 567 8900, +91 98765 43210)'
      };
    }

    // Parse and format the phone number
    const phoneNumberObj = parsePhoneNumber(cleanedPhone, defaultCountry);
    const formatted = phoneNumberObj.formatInternational();

    return {
      isValid: true,
      formatted
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid phone number format. Please include country code (e.g., +1, +91, +44)'
    };
  }
}

/**
 * Combines country code and phone number into a single international format
 * @param countryCode - Country code (e.g., +1, +91)
 * @param phoneNumber - Phone number without country code
 * @returns Combined phone number with country code
 */
export function combinePhoneNumber(countryCode: string, phoneNumber: string): string {
  // Remove any + from country code if present
  const cleanCountryCode = countryCode.replace(/^\+/, '');
  
  // Remove any spaces or special characters from phone number
  const cleanPhone = phoneNumber.replace(/\s+/g, '').replace(/[^\d]/g, '');
  
  // Combine them
  return `+${cleanCountryCode}${cleanPhone}`;
}

/**
 * Maps country calling code (e.g., +1, +91) to CountryCode (e.g., 'US', 'IN')
 * This is used for country-specific validation
 */
const COUNTRY_CODE_MAP: Record<string, CountryCode> = {
  '+1': 'US',      // US/Canada
  '+91': 'IN',     // India
  '+44': 'GB',     // UK
  '+61': 'AU',     // Australia
  '+86': 'CN',     // China
  '+81': 'JP',     // Japan
  '+49': 'DE',     // Germany
  '+33': 'FR',     // France
  '+39': 'IT',     // Italy
  '+34': 'ES',     // Spain
  '+7': 'RU',      // Russia
  '+55': 'BR',     // Brazil
  '+52': 'MX',     // Mexico
  '+27': 'ZA',     // South Africa
  '+82': 'KR',     // South Korea
  '+971': 'AE',    // UAE
  '+966': 'SA',    // Saudi Arabia
  '+65': 'SG',     // Singapore
  '+60': 'MY',     // Malaysia
  '+62': 'ID',     // Indonesia
  '+84': 'VN',     // Vietnam
  '+66': 'TH',     // Thailand
  '+63': 'PH',     // Philippines
  '+64': 'NZ',     // New Zealand
  '+31': 'NL',     // Netherlands
  '+46': 'SE',     // Sweden
  '+47': 'NO',     // Norway
  '+45': 'DK',     // Denmark
  '+41': 'CH',     // Switzerland
  '+32': 'BE',     // Belgium
  '+351': 'PT',    // Portugal
  '+353': 'IE',    // Ireland
  '+358': 'FI',    // Finland
  '+48': 'PL',     // Poland
  '+36': 'HU',     // Hungary
  '+420': 'CZ',    // Czech Republic
  '+43': 'AT',     // Austria
  '+30': 'GR',     // Greece
  '+90': 'TR',     // Turkey
  '+20': 'EG',     // Egypt
  '+234': 'NG',    // Nigeria
  '+254': 'KE',    // Kenya
  '+212': 'MA',    // Morocco
  '+54': 'AR',     // Argentina
  '+56': 'CL',     // Chile
  '+57': 'CO',     // Colombia
  '+51': 'PE',     // Peru
  '+58': 'VE',     // Venezuela
};

/**
 * Validates a phone number based on the selected country code
 * @param phoneNumber - Phone number without country code (digits only)
 * @param countryCode - Country calling code (e.g., +1, +91)
 * @returns Object with isValid boolean, error message, and formatted number
 */
export function validatePhoneNumberByCountry(
  phoneNumber: string,
  countryCode: string
): { isValid: boolean; error?: string; formatted?: string; isValidating?: boolean } {
  // If phone number is empty, don't validate yet
  if (!phoneNumber || phoneNumber.trim() === '') {
    return { isValid: true, isValidating: false };
  }

  // Get the CountryCode from the country calling code
  const country = COUNTRY_CODE_MAP[countryCode];
  
  if (!country) {
    // If country not found in map, use generic validation
    const fullNumber = combinePhoneNumber(countryCode, phoneNumber);
    return validatePhoneNumber(fullNumber);
  }

  // Combine country code and phone number
  const fullNumber = combinePhoneNumber(countryCode, phoneNumber);

  // Validate using the specific country
  try {
    const isValid = isValidPhoneNumber(fullNumber, country);
    
    if (!isValid) {
      // Try to get more specific error message
      try {
        const parsed = parsePhoneNumber(fullNumber, country);
        return {
          isValid: false,
          error: `Invalid phone number for ${countryCode}. Please check the number format.`
        };
      } catch (error) {
        return {
          isValid: false,
          error: `Invalid phone number format for ${countryCode}. Please enter a valid number.`
        };
      }
    }

    // Parse and format the phone number
    const phoneNumberObj = parsePhoneNumber(fullNumber, country);
    const formatted = phoneNumberObj.formatInternational();

    return {
      isValid: true,
      formatted
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Invalid phone number format for ${countryCode}. Please enter a valid number.`
    };
  }
}

