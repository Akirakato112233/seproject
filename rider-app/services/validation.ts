/**
 * @module services/validation
 *
 * Pure helper functions for validating user input on the client side.
 * Every function returns a human-readable error string or `null` when
 * the value is valid.  This keeps validation logic testable and
 * reusable across multiple screens.
 */

/**
 * Validate a contact person's name.
 *
 * Rules:
 *  - Must not be empty or whitespace-only
 *  - Must be at least 2 characters
 *
 * @param name  Raw input from the user
 * @returns Error message or `null`
 */
export function validateContactName(name: string): string | null {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
        return "Please enter the contact person's name.";
    }
    if (trimmed.length < 2) {
        return 'Name must be at least 2 characters.';
    }
    return null;
}

/**
 * Validate a Thai mobile phone number (digits only, no country code).
 *
 * Rules:
 *  - Must not be empty
 *  - Must contain only digits
 *  - Must be between 9 and 10 digits long
 *
 * @param phone  Raw input from the user
 * @returns Error message or `null`
 */
export function validatePhoneNumber(phone: string): string | null {
    const trimmed = phone.trim();
    if (trimmed.length === 0) {
        return 'Please enter a mobile number.';
    }
    if (!/^\d+$/.test(trimmed)) {
        return 'Phone number must contain only digits.';
    }
    if (trimmed.length < 9 || trimmed.length > 10) {
        return 'Phone number must be 9–10 digits.';
    }
    return null;
}

/**
 * Validate that a required text field is not blank.
 *
 * @param value      Raw input
 * @param fieldName  Human-readable name used in the error message
 * @returns Error message or `null`
 */
export function validateRequired(value: string, fieldName: string): string | null {
    if (!value || value.trim().length === 0) {
        return `${fieldName} is required.`;
    }
    return null;
}
