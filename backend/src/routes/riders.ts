import { Router } from 'express';
import { getRiderById, getRandomRiderId, getLatestRegistration, registerRider, deleteRegistration, updateRegistrationBackgroundCheck, updateRegistrationConsent, updateRegistrationTermsAndInfo, updateRegistrationQuestionnaire, updateRegistrationVehicleDetails, updateRegistrationVehicleBook, updateRegistrationPlateColor, updateRegistrationOwnership, updateRegistrationPackage, getEmergencyContacts, addEmergencyContact, updateEmergencyContact, deleteEmergencyContact, updateCommunications, updateLinkedAccounts } from '../controllers/riderController';

const router = Router();

// GET /api/riders/registrations/latest - ดึงข้อมูลผู้สมัคร rider ล่าสุด
router.get('/registrations/latest', getLatestRegistration);

// POST /api/riders/register - บันทึกข้อมูล rider ใหม่ (ไม่ต้อง auth)
router.post('/register', registerRider);

// PATCH /api/riders/registrations/:registrationId/background-check - ต่อข้อมูล verify-documents เข้า rider_registrations
router.patch('/registrations/:registrationId/background-check', updateRegistrationBackgroundCheck);

// PATCH /api/riders/registrations/:registrationId/consent - บันทึก Consent Section
router.patch('/registrations/:registrationId/consent', updateRegistrationConsent);

// PATCH /api/riders/registrations/:registrationId/terms-and-info - Terms, Conditions, and Receipt of Information
router.patch('/registrations/:registrationId/terms-and-info', updateRegistrationTermsAndInfo);

// PATCH /api/riders/registrations/:registrationId/questionnaire
router.patch('/registrations/:registrationId/questionnaire', updateRegistrationQuestionnaire);

// PATCH /api/riders/registrations/:registrationId/vehicle-details
router.patch('/registrations/:registrationId/vehicle-details', updateRegistrationVehicleDetails);

// PATCH /api/riders/registrations/:registrationId/plate-color
router.patch('/registrations/:registrationId/plate-color', updateRegistrationPlateColor);

// PATCH /api/riders/registrations/:registrationId/ownership
router.patch('/registrations/:registrationId/ownership', updateRegistrationOwnership);

// PATCH /api/riders/registrations/:registrationId/package
router.patch('/registrations/:registrationId/package', updateRegistrationPackage);

// PATCH /api/riders/registrations/:registrationId/vehicle-book - รูปรายการจดทะเบียนรถ (เล่มรถ)
router.patch('/registrations/:registrationId/vehicle-book', updateRegistrationVehicleBook);

// Delete registration
router.delete('/registrations/:registrationId', deleteRegistration);

// Linked accounts
router.patch('/registrations/:registrationId/linked-accounts', updateLinkedAccounts);

// Communications preferences
router.patch('/registrations/:registrationId/communications', updateCommunications);

// Emergency Contacts
router.get('/registrations/:registrationId/emergency-contacts', getEmergencyContacts);
router.post('/registrations/:registrationId/emergency-contacts', addEmergencyContact);
router.patch('/registrations/:registrationId/emergency-contacts/:contactId', updateEmergencyContact);
router.delete('/registrations/:registrationId/emergency-contacts/:contactId', deleteEmergencyContact);

router.get('/random/id', getRandomRiderId);
router.get('/:id', getRiderById);

export default router;
