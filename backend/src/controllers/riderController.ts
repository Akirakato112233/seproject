/**
 * @module controllers/riderController
 *
 * Express request handlers for all `/api/riders` endpoints.
 *
 * Responsibilities:
 *   - Rider registration (create, read latest, delete)
 *   - Onboarding step patches (background-check, consent, terms, etc.)
 *   - Emergency contacts CRUD (max 3 per registration)
 *   - Communication preferences toggle (email / phone marketing)
 *   - Linked third-party accounts toggle (Google)
 *   - Legacy Rider model lookups (getRiderById, getRandomRiderId)
 */

import { Request, Response } from 'express';
import { Rider } from '../models/Rider';
import { RiderRegistration } from '../models/RiderRegistration';
import { User } from '../models/User';

/**
 * POST /api/riders/register
 *
 * Creates a new rider registration document with all data collected
 * during the multi-step sign-up flow (basic info, national ID,
 * driver licence, selfie).  No authentication required.
 *
 * @returns 201 { success, registrationId } on success
 * @returns 400 { success: false, message } when required fields are missing
 */
export const registerRider = async (req: Request, res: Response) => {
  try {
    const {
      // Basic info
      firstName,
      lastName,
      phone,
      countryCode,
      email,
      city,
      vehicleType,
      // National ID
      nameTH,
      nameEN,
      idNumber,
      idIssueDate,
      idExpiryDate,
      dob,
      gender,
      address,
      idFrontUri,
      // Driver License
      licenseNo,
      licenseType,
      licenseIssueDate,
      licenseExpiryDate,
      licenseProvince,
      licenseUri,
      // Selfie
      selfieUri,
    } = req.body;

    // ── Validate all required fields ──────────────────────────────────────────
    const missing: string[] = [];
    const required: Record<string, unknown> = {
      firstName,
      lastName,
      phone,
      city,
      vehicleType,
      nameTH,
      nameEN,
      idNumber,
      idIssueDate,
      idExpiryDate,
      dob,
      gender,
      address,
      idFrontUri,
      licenseNo,
      licenseType,
      licenseIssueDate,
      licenseExpiryDate,
      licenseProvince,
      licenseUri,
      selfieUri,
    };

    for (const [key, value] of Object.entries(required)) {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        missing.push(key);
      }
    }

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`,
      });
    }

    const fullName = `${firstName} ${lastName}`.trim();

    const registration = await RiderRegistration.create({
      firstName,
      lastName,
      fullName,
      phone,
      countryCode: countryCode || '+66',
      email: email ? String(email).trim().toLowerCase() : undefined,
      city,
      vehicleType,
      nameTH,
      nameEN,
      idNumber,
      idIssueDate,
      idExpiryDate,
      dob,
      gender,
      address,
      idFrontUri,
      licenseNo,
      licenseType,
      licenseIssueDate,
      licenseExpiryDate,
      licenseProvince,
      licenseUri,
      selfieUri,
      agreedToTerms: true,
      status: 'pending',
    });

    console.log('✅ New Rider Registration:', registration._id, fullName, '—', vehicleType);
    return res.status(201).json({ success: true, registrationId: registration._id });
  } catch (error) {
    console.error('❌ Register Rider Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to register rider' });
  }
};

// PATCH /api/riders/registrations/:registrationId/background-check — ต่อข้อมูล verify-documents เข้า rider_registrations
export const updateRegistrationBackgroundCheck = async (req: Request, res: Response) => {
  try {
    const { registrationId } = req.params;
    const {
      nationalId,
      addressOnId,
      fatherFullName,
      motherFullName,
      hasDocument,
      documentUrl,
      consentA,
      consentB,
    } = req.body;

    if (
      !registrationId ||
      !nationalId?.trim() ||
      !addressOnId?.trim() ||
      !fatherFullName?.trim() ||
      !motherFullName?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: nationalId, addressOnId, fatherFullName, motherFullName',
      });
    }

    const updated = await RiderRegistration.findByIdAndUpdate(
      registrationId,
      {
        bgCheckNationalId: nationalId.trim(),
        addressOnId: addressOnId.trim(),
        fatherFullName: fatherFullName.trim(),
        motherFullName: motherFullName.trim(),
        hasDocument: !!hasDocument,
        documentUrl:
          documentUrl && String(documentUrl).trim() ? String(documentUrl).trim() : undefined,
        consentA: !!consentA,
        consentB: !!consentB,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    console.log('✅ Rider Registration + Background Check:', updated._id);
    return res.status(200).json({ success: true, id: updated._id });
  } catch (error) {
    console.error('❌ Update Registration Background Check Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update' });
  }
};

// PATCH /api/riders/registrations/:registrationId/consent — บันทึก Consent Section ลง rider_registrations
export const updateRegistrationConsent = async (req: Request, res: Response) => {
  try {
    const { registrationId } = req.params;
    const { consentDocumentsTrue, consentHealthDeclaration } = req.body;

    if (!registrationId) {
      return res.status(400).json({ success: false, message: 'Missing registrationId' });
    }
    if (!consentDocumentsTrue || !consentHealthDeclaration) {
      return res.status(400).json({
        success: false,
        message: 'Both consentDocumentsTrue and consentHealthDeclaration are required',
      });
    }

    const updated = await RiderRegistration.findByIdAndUpdate(
      registrationId,
      {
        consentDocumentsTrue: !!consentDocumentsTrue,
        consentHealthDeclaration: !!consentHealthDeclaration,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    console.log('✅ Rider Registration + Consent:', updated._id);
    return res.status(200).json({ success: true, id: updated._id });
  } catch (error) {
    console.error('❌ Update Registration Consent Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update' });
  }
};

// PATCH /api/riders/registrations/:registrationId/terms-and-info — Terms, Conditions, and Receipt of Information
export const updateRegistrationTermsAndInfo = async (req: Request, res: Response) => {
  try {
    const { registrationId } = req.params;
    const {
      agreedPrivacyNotice,
      agreedTermsTransport,
      agreedTermsPayments,
      agreedTermsFamilyAccount,
      agreedCodeOfConduct,
      marketingSms,
      marketingPhone,
      marketingEmail,
      marketingPush,
      marketingChat,
    } = req.body;

    if (!registrationId) {
      return res.status(400).json({ success: false, message: 'Missing registrationId' });
    }
    const legal = [
      agreedPrivacyNotice,
      agreedTermsTransport,
      agreedTermsPayments,
      agreedTermsFamilyAccount,
      agreedCodeOfConduct,
    ];
    if (!legal.every(Boolean)) {
      return res.status(400).json({
        success: false,
        message: 'All 5 legal agreements must be agreed',
      });
    }

    const updated = await RiderRegistration.findByIdAndUpdate(
      registrationId,
      {
        agreedPrivacyNotice: !!agreedPrivacyNotice,
        agreedTermsTransport: !!agreedTermsTransport,
        agreedTermsPayments: !!agreedTermsPayments,
        agreedTermsFamilyAccount: !!agreedTermsFamilyAccount,
        agreedCodeOfConduct: !!agreedCodeOfConduct,
        marketingSms: !!marketingSms,
        marketingPhone: !!marketingPhone,
        marketingEmail: !!marketingEmail,
        marketingPush: !!marketingPush,
        marketingChat: !!marketingChat,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    console.log('✅ Rider Registration + Terms & Info:', updated._id);
    return res.status(200).json({ success: true, id: updated._id });
  } catch (error) {
    console.error('❌ Update Registration Terms & Info Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update' });
  }
};

// PATCH /api/riders/registrations/:registrationId/questionnaire
export const updateRegistrationQuestionnaire = async (req: Request, res: Response) => {
  try {
    const { registrationId } = req.params;
    const { hadDrivingExperienceOtherApps } = req.body;

    if (!registrationId) {
      return res.status(400).json({ success: false, message: 'Missing registrationId' });
    }
    if (typeof hadDrivingExperienceOtherApps !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'hadDrivingExperienceOtherApps must be true or false',
      });
    }

    const updated = await RiderRegistration.findByIdAndUpdate(
      registrationId,
      { hadDrivingExperienceOtherApps },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    console.log('✅ Rider Registration + Questionnaire:', updated._id);
    return res.status(200).json({ success: true, id: updated._id });
  } catch (error) {
    console.error('❌ Update Registration Questionnaire Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update' });
  }
};

// PATCH /api/riders/registrations/:registrationId/vehicle-details
export const updateRegistrationVehicleDetails = async (req: Request, res: Response) => {
  try {
    const { registrationId } = req.params;
    const { vehicleRegistrationBook } = req.body;

    if (!registrationId) {
      return res.status(400).json({ success: false, message: 'Missing registrationId' });
    }
    if (vehicleRegistrationBook !== 'ready' && vehicleRegistrationBook !== 'submit_later') {
      return res.status(400).json({
        success: false,
        message: 'vehicleRegistrationBook must be "ready" or "submit_later"',
      });
    }

    const updated = await RiderRegistration.findByIdAndUpdate(
      registrationId,
      { vehicleRegistrationBook },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    console.log('✅ Rider Registration + Vehicle Details:', updated._id);
    return res.status(200).json({ success: true, id: updated._id });
  } catch (error) {
    console.error('❌ Update Registration Vehicle Details Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update' });
  }
};

// PATCH /api/riders/registrations/:registrationId/plate-color
export const updateRegistrationPlateColor = async (req: Request, res: Response) => {
  try {
    const { registrationId } = req.params;
    const { plateColor } = req.body;

    if (!registrationId) {
      return res.status(400).json({ success: false, message: 'Missing registrationId' });
    }
    const allowed = ['white', 'green', 'yellow', 'red'];
    if (!allowed.includes(plateColor)) {
      return res.status(400).json({
        success: false,
        message: 'plateColor must be one of white, green, yellow, red',
      });
    }

    const updated = await RiderRegistration.findByIdAndUpdate(
      registrationId,
      { plateColor },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    console.log('✅ Rider Registration + Plate Color:', updated._id);
    return res.status(200).json({ success: true, id: updated._id });
  } catch (error) {
    console.error('❌ Update Registration Plate Color Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update' });
  }
};

// PATCH /api/riders/registrations/:registrationId/ownership
export const updateRegistrationOwnership = async (req: Request, res: Response) => {
  try {
    const { registrationId } = req.params;
    const { ownershipType, ownershipRelation, ownershipHolderName, ownershipConsentAgreed } =
      req.body;

    if (!registrationId) {
      return res.status(400).json({ success: false, message: 'Missing registrationId' });
    }
    const allowed = ['self', 'relative', 'company'];
    if (!allowed.includes(ownershipType)) {
      return res.status(400).json({
        success: false,
        message: 'ownershipType must be one of self, relative, company',
      });
    }
    if (!ownershipHolderName || !String(ownershipHolderName).trim()) {
      return res.status(400).json({
        success: false,
        message: 'ownershipHolderName is required',
      });
    }
    if (!ownershipConsentAgreed) {
      return res.status(400).json({
        success: false,
        message: 'ownershipConsentAgreed is required',
      });
    }

    const updated = await RiderRegistration.findByIdAndUpdate(
      registrationId,
      {
        ownershipType,
        ownershipRelation:
          ownershipRelation && String(ownershipRelation).trim()
            ? String(ownershipRelation).trim()
            : undefined,
        ownershipHolderName: String(ownershipHolderName).trim(),
        ownershipConsentAgreed: !!ownershipConsentAgreed,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    console.log('✅ Rider Registration + Ownership:', updated._id);
    return res.status(200).json({ success: true, id: updated._id });
  } catch (error) {
    console.error('❌ Update Registration Ownership Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update' });
  }
};

// PATCH /api/riders/registrations/:registrationId/package
export const updateRegistrationPackage = async (req: Request, res: Response) => {
  try {
    const { registrationId } = req.params;
    const { packageProvince, packageDistrict, packageChoice, packageDisclaimerAgreed } = req.body;

    if (!registrationId) {
      return res.status(400).json({ success: false, message: 'Missing registrationId' });
    }
    if (
      !packageProvince ||
      !String(packageProvince).trim() ||
      !packageDistrict ||
      !String(packageDistrict).trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'packageProvince and packageDistrict are required',
      });
    }
    if (!packageChoice || !String(packageChoice).trim()) {
      return res.status(400).json({
        success: false,
        message: 'packageChoice is required',
      });
    }
    if (!packageDisclaimerAgreed) {
      return res.status(400).json({
        success: false,
        message: 'packageDisclaimerAgreed is required',
      });
    }

    const updated = await RiderRegistration.findByIdAndUpdate(
      registrationId,
      {
        packageProvince: String(packageProvince).trim(),
        packageDistrict: String(packageDistrict).trim(),
        packageChoice: String(packageChoice).trim(),
        packageDisclaimerAgreed: !!packageDisclaimerAgreed,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    console.log('✅ Rider Registration + Package:', updated._id);
    return res.status(200).json({ success: true, id: updated._id });
  } catch (error) {
    console.error('❌ Update Registration Package Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update' });
  }
};

// PATCH /api/riders/registrations/:registrationId/vehicle-book — รูปรายการจดทะเบียนรถ (เล่มรถ)
export const updateRegistrationVehicleBook = async (req: Request, res: Response) => {
  try {
    const { registrationId } = req.params;
    const {
      vehicleBookPhotoUri,
      vehicleRegistrationNo,
      vehicleBrand,
      vehicleModel,
      vehicleColor,
      vehicleYear,
      vehicleRegistrationProvince,
      vehicleFuel,
      vehicleEngineCc,
      rightsHolderName,
      rightsHolderId,
      possessorName,
      possessorId,
      vehicleBookDisclaimerAgreed,
    } = req.body;

    if (!registrationId) {
      return res.status(400).json({ success: false, message: 'Missing registrationId' });
    }
    if (!vehicleBookDisclaimerAgreed) {
      return res.status(400).json({
        success: false,
        message: 'vehicleBookDisclaimerAgreed is required',
      });
    }

    const updated = await RiderRegistration.findByIdAndUpdate(
      registrationId,
      {
        vehicleBookPhotoUri:
          vehicleBookPhotoUri && String(vehicleBookPhotoUri).trim()
            ? String(vehicleBookPhotoUri).trim()
            : undefined,
        vehicleRegistrationNo:
          vehicleRegistrationNo && String(vehicleRegistrationNo).trim()
            ? String(vehicleRegistrationNo).trim()
            : undefined,
        vehicleBrand:
          vehicleBrand && String(vehicleBrand).trim() ? String(vehicleBrand).trim() : undefined,
        vehicleModel:
          vehicleModel && String(vehicleModel).trim() ? String(vehicleModel).trim() : undefined,
        vehicleColor:
          vehicleColor && String(vehicleColor).trim() ? String(vehicleColor).trim() : undefined,
        vehicleYear: vehicleYear != null ? String(vehicleYear).trim() : undefined,
        vehicleRegistrationProvince:
          vehicleRegistrationProvince && String(vehicleRegistrationProvince).trim()
            ? String(vehicleRegistrationProvince).trim()
            : undefined,
        vehicleFuel:
          vehicleFuel && String(vehicleFuel).trim() ? String(vehicleFuel).trim() : undefined,
        vehicleEngineCc: vehicleEngineCc != null ? String(vehicleEngineCc).trim() : undefined,
        rightsHolderName:
          rightsHolderName && String(rightsHolderName).trim()
            ? String(rightsHolderName).trim()
            : undefined,
        rightsHolderId:
          rightsHolderId && String(rightsHolderId).trim()
            ? String(rightsHolderId).trim()
            : undefined,
        possessorName:
          possessorName && String(possessorName).trim() ? String(possessorName).trim() : undefined,
        possessorId:
          possessorId && String(possessorId).trim() ? String(possessorId).trim() : undefined,
        vehicleBookDisclaimerAgreed: !!vehicleBookDisclaimerAgreed,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    console.log('✅ Rider Registration + Vehicle Book:', updated._id);
    return res.status(200).json({ success: true, id: updated._id });
  } catch (error) {
    console.error('❌ Update Registration Vehicle Book Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update' });
  }
};

// DELETE /api/riders/registrations/:registrationId
export const deleteRegistration = async (req: Request, res: Response) => {
  try {
    const { registrationId } = req.params;
    const deleted = await RiderRegistration.findByIdAndDelete(registrationId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }
    console.log('🗑️ Registration deleted:', registrationId);
    return res.json({ success: true });
  } catch (error) {
    console.error('❌ Delete Registration Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// PATCH /api/riders/registrations/:registrationId/linked-accounts
export const updateLinkedAccounts = async (req: Request, res: Response) => {
  try {
    const { registrationId } = req.params;
    const { linkedGoogle } = req.body;

    const update: Record<string, boolean> = {};
    if (typeof linkedGoogle === 'boolean') update.linkedGoogle = linkedGoogle;

    const updated = await RiderRegistration.findByIdAndUpdate(registrationId, update, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    return res.json({
      success: true,
      data: { linkedGoogle: updated.linkedGoogle ?? false },
    });
  } catch (error) {
    console.error('❌ Update Linked Accounts Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// PATCH /api/riders/registrations/:registrationId/communications
export const updateCommunications = async (req: Request, res: Response) => {
  try {
    const { registrationId } = req.params;
    const { marketingEmail, marketingPhone } = req.body;

    const update: Record<string, boolean> = {};
    if (typeof marketingEmail === 'boolean') update.marketingEmail = marketingEmail;
    if (typeof marketingPhone === 'boolean') update.marketingPhone = marketingPhone;

    const updated = await RiderRegistration.findByIdAndUpdate(registrationId, update, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    return res.json({
      success: true,
      data: {
        marketingEmail: updated.marketingEmail ?? false,
        marketingPhone: updated.marketingPhone ?? false,
      },
    });
  } catch (error) {
    console.error('❌ Update Communications Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/riders/registrations/:registrationId/emergency-contacts
export const getEmergencyContacts = async (req: Request, res: Response) => {
  try {
    const { registrationId } = req.params;
    const reg = await RiderRegistration.findById(registrationId).lean();
    if (!reg) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }
    return res.json({ success: true, data: reg.emergencyContacts || [] });
  } catch (error) {
    console.error('❌ Get Emergency Contacts Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// POST /api/riders/registrations/:registrationId/emergency-contacts
export const addEmergencyContact = async (req: Request, res: Response) => {
  try {
    const { registrationId } = req.params;
    const { name, phone, countryCode } = req.body;

    if (!name?.trim() || !phone?.trim()) {
      return res.status(400).json({ success: false, message: 'name and phone are required' });
    }
    if (!/^\d{9,10}$/.test(phone.trim())) {
      return res.status(400).json({ success: false, message: 'Phone number must be 9-10 digits' });
    }

    const existing = await RiderRegistration.findById(registrationId).lean();
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }
    if ((existing.emergencyContacts?.length ?? 0) >= 3) {
      return res
        .status(400)
        .json({ success: false, message: 'Maximum 3 emergency contacts allowed' });
    }

    const updated = await RiderRegistration.findByIdAndUpdate(
      registrationId,
      {
        $push: {
          emergencyContacts: {
            name: name.trim(),
            phone: phone.trim(),
            countryCode: countryCode?.trim() || '+66',
          },
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    return res.status(201).json({ success: true, data: updated.emergencyContacts });
  } catch (error) {
    console.error('❌ Add Emergency Contact Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// PATCH /api/riders/registrations/:registrationId/emergency-contacts/:contactId
export const updateEmergencyContact = async (req: Request, res: Response) => {
  try {
    const { registrationId, contactId } = req.params;
    const { name, phone, countryCode } = req.body;

    if (!name?.trim() || !phone?.trim()) {
      return res.status(400).json({ success: false, message: 'name and phone are required' });
    }
    if (!/^\d{9,10}$/.test(phone.trim())) {
      return res.status(400).json({ success: false, message: 'Phone number must be 9-10 digits' });
    }

    const updated = await RiderRegistration.findOneAndUpdate(
      { _id: registrationId, 'emergencyContacts._id': contactId },
      {
        $set: {
          'emergencyContacts.$.name': name.trim(),
          'emergencyContacts.$.phone': phone.trim(),
          'emergencyContacts.$.countryCode': countryCode?.trim() || '+66',
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Registration or contact not found' });
    }

    return res.json({ success: true, data: updated.emergencyContacts });
  } catch (error) {
    console.error('❌ Update Emergency Contact Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// DELETE /api/riders/registrations/:registrationId/emergency-contacts/:contactId
export const deleteEmergencyContact = async (req: Request, res: Response) => {
  try {
    const { registrationId, contactId } = req.params;

    const updated = await RiderRegistration.findByIdAndUpdate(
      registrationId,
      { $pull: { emergencyContacts: { _id: contactId } } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    return res.json({ success: true, data: updated.emergencyContacts });
  } catch (error) {
    console.error('❌ Delete Emergency Contact Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/riders/registrations/latest
export const getLatestRegistration = async (req: Request, res: Response) => {
  try {
    const registration = await RiderRegistration.findOne().sort({ createdAt: -1 }).lean();
    if (!registration) {
      return res.status(404).json({ success: false, message: 'No registrations found' });
    }
    return res.json({ success: true, data: registration });
  } catch (error) {
    console.error('❌ Get Latest Registration Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/riders/:id
// order.riderId is User._id (from rider app auth), so fallback to User when Rider not found
export const getRiderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid rider id' });
    }
    let rider = await Rider.findById(id).lean();
    if (!rider) {
      const user = await User.findById(id).lean();
      if (user) {
        return res.json({
          displayName: user.displayName || 'Rider',
          fullName: user.displayName || 'Rider',
        });
      }
      return res.json({ displayName: 'Rider', fullName: 'Rider' });
    }
    return res.json(rider);
  } catch (error) {
    console.error('Error fetching rider:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/riders/random/id
export const getRandomRiderId = async (req: Request, res: Response) => {
  try {
    const randomRider = await Rider.aggregate([{ $sample: { size: 1 } }]);
    if (!randomRider || randomRider.length === 0) {
      return res.status(404).json({ message: 'No riders found' });
    }
    return res.json({ riderId: randomRider[0]._id });
  } catch (error) {
    console.error('Error fetching random rider:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
