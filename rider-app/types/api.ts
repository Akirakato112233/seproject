/**
 * Standard shape for every JSON response from the backend.
 * All endpoints wrap their payload inside { success, data?, message? }.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Params passed to the Emergency Contacts screen via expo-router.
 */
export interface EmergencyContactsRouteParams {
  registrationId: string;
}

/**
 * Params passed to the Add / Edit Emergency Contact screen.
 */
export interface EditContactRouteParams {
  registrationId: string;
  contactId?: string;
  contactName?: string;
  contactPhone?: string;
}

/**
 * Params passed to Communications and Linked Accounts screens.
 */
export interface SettingsSubRouteParams {
  registrationId: string;
  hasEmail?: string;
}
