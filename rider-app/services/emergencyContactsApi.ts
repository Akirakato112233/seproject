/**
 * API service for emergency contacts CRUD.
 *
 * Emergency contacts are stored as a sub-array inside each
 * RiderRegistration document (max 3 entries).
 */

import { API, NGROK_HEADERS } from '../config';
import type { EmergencyContact, ApiResponse } from '../types';

const MAX_CONTACTS = 3;

/**
 * Fetch all emergency contacts for a registration.
 *
 * @param registrationId  The parent registration's Mongo ObjectId
 * @returns Array of contacts (may be empty)
 */
export async function fetchEmergencyContacts(registrationId: string): Promise<EmergencyContact[]> {
    try {
        const res = await fetch(`${API.RIDERS}/registrations/${registrationId}/emergency-contacts`, { headers: NGROK_HEADERS });
        const json: ApiResponse<EmergencyContact[]> = await res.json();
        return json.success && json.data ? json.data : [];
    } catch (err) {
        console.error('[emergencyContactsApi] fetchEmergencyContacts:', err);
        return [];
    }
}

/**
 * Add a new emergency contact.
 * The backend enforces a maximum of {@link MAX_CONTACTS} entries.
 *
 * @returns Updated array of contacts on success, `null` on failure.
 */
export async function addEmergencyContact(
    registrationId: string,
    payload: { name: string; phone: string; countryCode?: string }
): Promise<{ success: boolean; data?: EmergencyContact[]; message?: string }> {
    try {
        const res = await fetch(
            `${API.RIDERS}/registrations/${registrationId}/emergency-contacts`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...NGROK_HEADERS },
                body: JSON.stringify({
                    name: payload.name.trim(),
                    phone: payload.phone.trim(),
                    countryCode: payload.countryCode?.trim() || '+66',
                }),
            }
        );
        return await res.json();
    } catch (err) {
        console.error('[emergencyContactsApi] addEmergencyContact:', err);
        return { success: false, message: 'Network error' };
    }
}

/**
 * Update an existing emergency contact's name and/or phone.
 *
 * @param registrationId  Parent registration ObjectId
 * @param contactId       The sub-document _id to update
 * @param payload         New name / phone / countryCode values
 * @returns API response with updated contacts array
 */
export async function updateEmergencyContact(
    registrationId: string,
    contactId: string,
    payload: { name: string; phone: string; countryCode?: string }
): Promise<{ success: boolean; data?: EmergencyContact[]; message?: string }> {
    try {
        const res = await fetch(
            `${API.RIDERS}/registrations/${registrationId}/emergency-contacts/${contactId}`,
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...NGROK_HEADERS },
                body: JSON.stringify({
                    name: payload.name.trim(),
                    phone: payload.phone.trim(),
                    countryCode: payload.countryCode?.trim() || '+66',
                }),
            }
        );
        return await res.json();
    } catch (err) {
        console.error('[emergencyContactsApi] updateEmergencyContact:', err);
        return { success: false, message: 'Network error' };
    }
}

/**
 * Remove an emergency contact by its sub-document _id.
 *
 * @returns Updated contacts array on success
 */
export async function deleteEmergencyContact(
    registrationId: string,
    contactId: string
): Promise<{ success: boolean; data?: EmergencyContact[] }> {
    try {
        const res = await fetch(
            `${API.RIDERS}/registrations/${registrationId}/emergency-contacts/${contactId}`,
            { method: 'DELETE', headers: NGROK_HEADERS }
        );
        return await res.json();
    } catch (err) {
        console.error('[emergencyContactsApi] deleteEmergencyContact:', err);
        return { success: false };
    }
}

/**
 * Helper: check whether another contact can still be added.
 */
export function canAddMore(currentCount: number): boolean {
    return currentCount < MAX_CONTACTS;
}
