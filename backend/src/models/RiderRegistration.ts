import mongoose, { Schema, Document } from 'mongoose';

export interface IRiderRegistration extends Document {
    // Basic info (from register screen)
    firstName: string;
    lastName: string;
    fullName: string;
    phone: string;
    countryCode: string;
    city: string;
    agreedToTerms: boolean;
    vehicleType: string;

    // National ID (from national-id screen)
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

    // Selfie photo
    selfieUri: string;

    // Status for admin review
    status: 'pending' | 'approved' | 'rejected';
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
