/**
 * Emergency contact stored in rider_registrations.emergencyContacts
 */
export interface EmergencyContact {
  _id: string;
  /** Full name of the emergency contact person */
  name: string;
  /** Phone number (without country code prefix) */
  phone: string;
  /** Country dialing code, e.g. "+66" */
  countryCode: string;
}

/**
 * Core registration data returned from GET /api/riders/registrations/latest
 * Maps to the RiderRegistration MongoDB document.
 */
export interface RegistrationData {
  _id: string;

  /** First name provided during signup */
  firstName: string;
  /** Last name provided during signup */
  lastName: string;
  /** Computed full name = firstName + lastName */
  fullName: string;

  /** Mobile phone number */
  phone: string;
  /** Country dialing code, default "+66" */
  countryCode: string;

  /** City chosen during registration */
  city: string;
  /** Vehicle type: motorcycle, car, etc. */
  vehicleType: string;

  /** Full name in Thai from National ID scan */
  nameTH?: string;
  /** Full name in English from National ID scan */
  nameEN?: string;

  /** Selfie photo URI (Supabase storage) */
  selfieUri?: string;

  /** Plate number from vehicle registration book */
  vehicleRegistrationNo?: string;
  /** Vehicle manufacturer, e.g. "Honda" */
  vehicleBrand?: string;
  /** Vehicle model, e.g. "CLICK160" */
  vehicleModel?: string;

  /** Emergency contacts (max 3) */
  emergencyContacts?: EmergencyContact[];

  /** Whether Google account is linked */
  linkedGoogle?: boolean;

  /** Marketing preference: receive offers via email */
  marketingEmail?: boolean;
  /** Marketing preference: receive offers via phone call */
  marketingPhone?: boolean;

  /** Admin review status */
  status: "pending" | "approved" | "rejected";
}

/**
 * Communication preferences that can be toggled in the Communications screen.
 */
export interface CommunicationPreferences {
  marketingEmail: boolean;
  marketingPhone: boolean;
}

/**
 * Linked account preferences stored per registration.
 */
export interface LinkedAccountPreferences {
  linkedGoogle: boolean;
}
