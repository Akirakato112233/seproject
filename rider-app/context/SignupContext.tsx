import React, { createContext, useContext, useState, ReactNode } from 'react';
import { API } from '../config';

export interface SignupData {
    // Basic (register.tsx)
    firstName: string;
    lastName: string;
    phone: string;
    countryCode: string;
    city: string;
    vehicleType: 'motorcycle' | 'car' | '';

    // Selfie
    selfieUri: string | null;

    // National ID (national-id.tsx)
    nameTH: string;
    nameEN: string;
    idNumber: string;
    idIssueDate: string;
    idExpiryDate: string;
    dob: string;
    gender: string;
    address: string;
    idFrontUri: string | null;

    // Driver License (driver-license.tsx)
    licenseNo: string;
    licenseType: string;
    licenseIssueDate: string;
    licenseExpiryDate: string;
    licenseProvince: string;
    licenseUri: string | null;
}

interface SignupContextType {
    data: SignupData;
    setField: <K extends keyof SignupData>(key: K, value: SignupData[K]) => void;
    submit: (overrides?: Partial<SignupData>) => Promise<{ success: boolean; message?: string; registrationId?: string }>;
    reset: () => void;
}

const defaultData: SignupData = {
    firstName: '',
    lastName: '',
    phone: '',
    countryCode: '+66',
    city: '',
    vehicleType: '',
    selfieUri: null,
    nameTH: '',
    nameEN: '',
    idNumber: '',
    idIssueDate: '',
    idExpiryDate: '',
    dob: '',
    gender: '',
    address: '',
    idFrontUri: null,
    licenseNo: '',
    licenseType: '',
    licenseIssueDate: '',
    licenseExpiryDate: '',
    licenseProvince: '',
    licenseUri: null,
};

const SignupContext = createContext<SignupContextType>({
    data: defaultData,
    setField: () => { },
    submit: async () => ({ success: false }),
    reset: () => { },
});

export function SignupProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<SignupData>(defaultData);

    const setField = <K extends keyof SignupData>(key: K, value: SignupData[K]) => {
        setData(prev => ({ ...prev, [key]: value }));
    };

    // overrides: pass any fields that were just set but haven't flushed to state yet
    const submit = async (overrides?: Partial<SignupData>): Promise<{ success: boolean; message?: string; registrationId?: string }> => {
        try {
            const d = { ...data, ...overrides };

            const body = {
                // Basic
                firstName: d.firstName,
                lastName: d.lastName,
                phone: d.phone,
                countryCode: d.countryCode,
                city: d.city,
                vehicleType: d.vehicleType,
                // Selfie
                selfieUri: d.selfieUri ?? '',
                // National ID
                nameTH: d.nameTH,
                nameEN: d.nameEN,
                idNumber: d.idNumber,
                idIssueDate: d.idIssueDate,
                idExpiryDate: d.idExpiryDate,
                dob: d.dob,
                gender: d.gender,
                address: d.address,
                idFrontUri: d.idFrontUri ?? '',
                // Driver License
                licenseNo: d.licenseNo,
                licenseType: d.licenseType,
                licenseIssueDate: d.licenseIssueDate,
                licenseExpiryDate: d.licenseExpiryDate,
                licenseProvince: d.licenseProvince,
                licenseUri: d.licenseUri ?? '',
            };

            const res = await fetch(`${API.RIDERS}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': '1',
                },
                body: JSON.stringify(body),
            });

            const json = await res.json();

            if (res.ok && json.success) {
                return { success: true, registrationId: json.registrationId };
            } else {
                return { success: false, message: json.message ?? 'Registration failed' };
            }
        } catch (err: any) {
            console.error('SignupContext.submit error:', err);
            return { success: false, message: 'Cannot connect to server. Please check your connection.' };
        }
    };

    const reset = () => setData(defaultData);

    return (
        <SignupContext.Provider value={{ data, setField, submit, reset }}>
            {children}
        </SignupContext.Provider>
    );
}

export function useSignup() {
    return useContext(SignupContext);
}
