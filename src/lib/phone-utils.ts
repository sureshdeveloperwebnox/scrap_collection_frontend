import { parsePhoneNumberWithError, CountryCode, getExampleNumber } from 'libphonenumber-js';
import examples from 'libphonenumber-js/examples.mobile.json';

/**
 * Validates a phone number using libphonenumber-js
 * Requirements:
 * - Accept and store in E.164 format only
 * - Reject invalid length and invalid area codes
 * - Handle Argentina (AR) mobile prefix +54 9
 */
export function validatePhoneNumber(
    phoneNumber: string,
    countryCode?: CountryCode
): { isValid: boolean; error?: string; formatted?: string; country?: CountryCode; type?: string } {
    if (!phoneNumber || phoneNumber === '+') {
        return {
            isValid: false,
            error: 'Phone number is required'
        };
    }

    // Ensure it starts with +
    const cleanedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber.replace(/\D/g, '')}`;

    try {
        // 1. Parse the number
        const phoneNumberObj = parsePhoneNumberWithError(cleanedPhone, countryCode);

        // 2. Check if valid
        if (!phoneNumberObj.isValid()) {
            return {
                isValid: false,
                error: `Invalid phone number for ${phoneNumberObj.country || 'the selected country'}. Please check the length and area code.`
            };
        }

        return {
            isValid: true,
            formatted: phoneNumberObj.format('E.164'),
            country: phoneNumberObj.country,
            type: phoneNumberObj.getType()
        };

    } catch (error: any) {
        let message = 'Please enter a valid phone number';
        if (error.message === 'INVALID_COUNTRY') message = 'Invalid country code';
        if (error.message === 'TOO_SHORT') message = 'Phone number is too short';
        if (error.message === 'TOO_LONG') message = 'Phone number is too long';
        if (error.message === 'NOT_A_NUMBER') message = 'Phone number must contain digits';

        return {
            isValid: false,
            error: message
        };
    }
}

/**
 * Gets an example number for a country to use as a placeholder
 */
export function getPhonePlaceholder(countryCode: string): string {
    try {
        const example = getExampleNumber(countryCode.toUpperCase() as CountryCode, examples);
        if (example) {
            return example.formatInternational();
        }
    } catch (e) {
        // Fallback
    }
    return '+1 (555) 000-0000';
}
