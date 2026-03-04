/**
 * @module models/RiderRegistration
 *
 * Mongoose model for the `rider_registrations` collection.
 *
 * Each document represents one rider sign-up application and accumulates
 * data across multiple onboarding steps:
 *   1. Basic info (name, phone, city, vehicle type)
 *   2. National ID scan (Thai / English name, ID number, dates, photo)
 *   3. Driver licence scan
 *   4. Selfie verification
 *   5. Background check & consent
 *   6. Terms acceptance & marketing preferences
 *   7. Vehicle details & registration book
 *   8. Emergency contacts (max 3)
 *   9. Linked third-party accounts (Google)
 *
 * After all steps the document stays in `status: 'pending'` until an
 * admin approves or rejects it.
 */

import mongoose, { Schema, Document } from 'mongoose';

/**
 * TypeScript interface mirroring every field on a RiderRegistration
 * document.  Optional fields (`?`) are populated in later onboarding
 * steps and may be `undefined` until then.
 */
export interface IRiderRegistration extends Document {
  // ── Basic info (from register screen) ──────────────────────────
  /** Given / first name */
  firstName: string;
  /** Family / last name */
  lastName: string;
  /** Computed: firstName + " " + lastName */
  fullName: string;
  /** Mobile number (digits only, no country code prefix) */
  phone: string;
  /** Country dialing code, e.g. "+66" */
  countryCode: string;
  /** City or province chosen during sign-up */
  city: string;
  /** Whether the rider accepted the initial terms */
  agreedToTerms: boolean;
  /** Type of vehicle: "motorcycle" | "car" | … */
  vehicleType: string;

  // ── National ID (from national-id screen) ──────────────────────
  nameTH: string;
  nameEN: string;
  idNumber: string;
  idIssueDate: string;
  idExpiryDate: string;
  dob: string;
  gender: string;
  address: string;
  idFrontUri: string;

  // Driver License (from driver-license screen)
  licenseNo: string;
  licenseType: string;
  licenseIssueDate: string;
  licenseExpiryDate: string;
  licenseProvince: string;
  licenseUri: string;

  // ── Selfie photo ─────────────────────────────────────────────────
  /** URI to the selfie photo stored in Supabase */
  selfieUri: string;

  // ── Admin review status ───────────────────────────────────────
  /** Current review status: pending → approved | rejected */
  status: 'pending' | 'approved' | 'rejected';

  // Verify Documents (background check) — ต่อจาก rider_registrations
  bgCheckNationalId?: string;
  addressOnId?: string;
  fatherFullName?: string;
  motherFullName?: string;
  hasDocument?: boolean;
  documentUrl?: string;
  consentA?: boolean;
  consentB?: boolean;

  // Consent Section (หลังตรวจสอบประวัติ)
  consentDocumentsTrue?: boolean;
  consentHealthDeclaration?: boolean;

  // Terms, Conditions, and Receipt of Information
  agreedPrivacyNotice?: boolean;
  agreedTermsTransport?: boolean;
  agreedTermsPayments?: boolean;
  agreedTermsFamilyAccount?: boolean;
  agreedCodeOfConduct?: boolean;
  marketingSms?: boolean;
  marketingPhone?: boolean;
  marketingEmail?: boolean;
  marketingPush?: boolean;
  marketingChat?: boolean;

  // Questionnaire
  hadDrivingExperienceOtherApps?: boolean;

  // Vehicle Details
  vehicleRegistrationBook?: 'ready' | 'submit_later';
  plateColor?: 'white' | 'green' | 'yellow' | 'red';

  // Ownership of vehicle
  ownershipType?: 'self' | 'relative' | 'company';
  ownershipRelation?: string;
  ownershipHolderName?: string;
  ownershipConsentAgreed?: boolean;

  // Package / equipment selection
  packageProvince?: string;
  packageDistrict?: string;
  packageChoice?: string;
  packageDisclaimerAgreed?: boolean;

  // ── Linked accounts ─────────────────────────────────────────────
  /** Whether the rider's Google account is currently linked */
  linkedGoogle?: boolean;

  // ── Emergency Contacts (max 3) ────────────────────────────────
  /** Array of up to 3 emergency contact persons */
  emergencyContacts?: { name: string; phone: string; countryCode: string }[];

  // Vehicle Registration Details (เล่มรถ) — กรณีผู้สมัครเป็นเจ้าของรถ
  vehicleBookPhotoUri?: string;
  vehicleRegistrationNo?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehicleYear?: string;
  vehicleRegistrationProvince?: string;
  vehicleFuel?: string;
  vehicleEngineCc?: string;
  rightsHolderName?: string;
  rightsHolderId?: string;
  possessorName?: string;
  possessorId?: string;
  vehicleBookDisclaimerAgreed?: boolean;
}

const RiderRegistrationSchema = new Schema<IRiderRegistration>(
  {
    // Basic info
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    countryCode: { type: String, default: '+66' },
    city: { type: String, required: true },
    agreedToTerms: { type: Boolean, default: true },
    vehicleType: { type: String, required: true },

    // National ID
    nameTH: { type: String, required: true },
    nameEN: { type: String, required: true },
    idNumber: { type: String, required: true },
    idIssueDate: { type: String, required: true },
    idExpiryDate: { type: String, required: true },
    dob: { type: String, required: true },
    gender: { type: String, required: true },
    address: { type: String, required: true },
    idFrontUri: { type: String, required: true },

    // Driver License
    licenseNo: { type: String, required: true },
    licenseType: { type: String, required: true },
    licenseIssueDate: { type: String, required: true },
    licenseExpiryDate: { type: String, required: true },
    licenseProvince: { type: String, required: true },
    licenseUri: { type: String, required: true },

    // Selfie
    selfieUri: { type: String, required: true },

    // Verify Documents (background check)
    bgCheckNationalId: { type: String },
    addressOnId: { type: String },
    fatherFullName: { type: String },
    motherFullName: { type: String },
    hasDocument: { type: Boolean },
    documentUrl: { type: String },
    consentA: { type: Boolean },
    consentB: { type: Boolean },

    consentDocumentsTrue: { type: Boolean },
    consentHealthDeclaration: { type: Boolean },

    agreedPrivacyNotice: { type: Boolean },
    agreedTermsTransport: { type: Boolean },
    agreedTermsPayments: { type: Boolean },
    agreedTermsFamilyAccount: { type: Boolean },
    agreedCodeOfConduct: { type: Boolean },
    marketingSms: { type: Boolean },
    marketingPhone: { type: Boolean },
    marketingEmail: { type: Boolean },
    marketingPush: { type: Boolean },
    marketingChat: { type: Boolean },

    hadDrivingExperienceOtherApps: { type: Boolean },

    vehicleRegistrationBook: { type: String, enum: ['ready', 'submit_later'] },
    plateColor: { type: String, enum: ['white', 'green', 'yellow', 'red'] },

    ownershipType: { type: String, enum: ['self', 'relative', 'company'] },
    ownershipRelation: { type: String },
    ownershipHolderName: { type: String },
    ownershipConsentAgreed: { type: Boolean },

    packageProvince: { type: String },
    packageDistrict: { type: String },
    packageChoice: { type: String },
    packageDisclaimerAgreed: { type: Boolean },

    linkedGoogle: { type: Boolean, default: false },

    emergencyContacts: [
      {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        countryCode: { type: String, default: '+66' },
      },
    ],

    vehicleBookPhotoUri: { type: String },
    vehicleRegistrationNo: { type: String },
    vehicleBrand: { type: String },
    vehicleModel: { type: String },
    vehicleColor: { type: String },
    vehicleYear: { type: String },
    vehicleRegistrationProvince: { type: String },
    vehicleFuel: { type: String },
    vehicleEngineCc: { type: String },
    rightsHolderName: { type: String },
    rightsHolderId: { type: String },
    possessorName: { type: String },
    possessorId: { type: String },
    vehicleBookDisclaimerAgreed: { type: Boolean },

    // Admin review status
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export const RiderRegistration = mongoose.model<IRiderRegistration>(
  'RiderRegistration',
  RiderRegistrationSchema,
  'rider_registrations'
);
