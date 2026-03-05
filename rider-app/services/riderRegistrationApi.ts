/**
 * API service for rider registration data.
 *
 * Centralises every HTTP call related to the `rider_registrations`
 * collection so that screen components never import `fetch` directly.
 */

import { API, NGROK_HEADERS } from '../config';
import type {
    RegistrationData,
    ApiResponse,
    CommunicationPreferences,
    LinkedAccountPreferences,
} from '../types';

/* ------------------------------------------------------------------ */
/*  Registration                                                       */
/* ------------------------------------------------------------------ */

/**
 * Fetch the latest rider registration for the logged-in user.
 * Requires token (backend returns registration for that user's email only).
 */
export async function fetchLatestRegistration(token: string | null): Promise<RegistrationData | null> {
    if (!token) return null;
    try {
        const headers: HeadersInit = { ...NGROK_HEADERS, Authorization: `Bearer ${token}` };
        const res = await fetch(`${API.RIDERS}/registrations/latest`, { headers });
        const json: ApiResponse<RegistrationData> = await res.json();
        return json.success && json.data ? json.data : null;
    } catch (err) {
        console.error('[riderRegistrationApi] fetchLatestRegistration:', err);
        return null;
    }
}

/**
 * Permanently delete a rider registration document.
 * Called from the "Delete Account" flow in Edit Account.
 *
 * @returns `true` when the backend confirmed deletion.
 */
export async function deleteRegistration(registrationId: string): Promise<boolean> {
    try {
        const res = await fetch(`${API.RIDERS}/registrations/${registrationId}`, {
            method: 'DELETE',
            headers: NGROK_HEADERS,
        });
        const json: ApiResponse = await res.json();
        return !!json.success;
    } catch (err) {
        console.error('[riderRegistrationApi] deleteRegistration:', err);
        return false;
    }
}

/* ------------------------------------------------------------------ */
/*  Communications                                                     */
/* ------------------------------------------------------------------ */

/**
 * Update marketing / communication preferences for a registration.
 *
 * @param registrationId  Mongo ObjectId of the registration
 * @param prefs           Partial set of preferences to patch
 */
export async function updateCommunications(
    registrationId: string,
    prefs: Partial<CommunicationPreferences>
): Promise<CommunicationPreferences | null> {
    try {
        const res = await fetch(`${API.RIDERS}/registrations/${registrationId}/communications`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...NGROK_HEADERS },
            body: JSON.stringify(prefs),
        });
        const json: ApiResponse<CommunicationPreferences> = await res.json();
        return json.success && json.data ? json.data : null;
    } catch (err) {
        console.error('[riderRegistrationApi] updateCommunications:', err);
        return null;
    }
}

/* ------------------------------------------------------------------ */
/*  Linked Accounts                                                    */
/* ------------------------------------------------------------------ */

/**
 * Toggle linked third-party accounts (currently only Google).
 */
export async function updateLinkedAccounts(
    registrationId: string,
    prefs: Partial<LinkedAccountPreferences>
): Promise<LinkedAccountPreferences | null> {
    try {
        const res = await fetch(`${API.RIDERS}/registrations/${registrationId}/linked-accounts`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...NGROK_HEADERS },
            body: JSON.stringify(prefs),
        });
        const json: ApiResponse<LinkedAccountPreferences> = await res.json();
        return json.success && json.data ? json.data : null;
    } catch (err) {
        console.error('[riderRegistrationApi] updateLinkedAccounts:', err);
        return null;
    }
}
