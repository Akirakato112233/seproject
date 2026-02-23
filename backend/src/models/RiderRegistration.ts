import mongoose, { Schema, Document } from 'mongoose';

export interface IRiderRegistration extends Document {
    firstName: string;
    lastName: string;
    fullName: string;
    phone: string;
    countryCode: string;
    city: string;
    agreedToTerms: boolean;
}

const RiderRegistrationSchema = new Schema<IRiderRegistration>(
    {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        fullName: { type: String, required: true },
        phone: { type: String, default: '' },
        countryCode: { type: String, default: '+66' },
        city: { type: String, default: '' },
        agreedToTerms: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// collection แยกเฉพาะสำหรับการลงทะเบียน rider ใหม่
export const RiderRegistration = mongoose.model<IRiderRegistration>(
    'RiderRegistration',
    RiderRegistrationSchema,
    'rider_registrations'
);
