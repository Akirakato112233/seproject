import { Request, Response } from 'express';
import { Rider } from '../models/Rider';
import { RiderRegistration } from '../models/RiderRegistration';

// POST /api/riders/register — บันทึกข้อมูลผู้สมัคร rider ทั้งหมด (ไม่ต้อง auth)
export const registerRider = async (req: Request, res: Response) => {
  try {
    const {
      // Basic info
      firstName, lastName, phone, countryCode, city, vehicleType,
      // National ID
      nameTH, nameEN, idNumber, idIssueDate, idExpiryDate, dob, gender, address, idFrontUri,
      // Driver License
      licenseNo, licenseType, licenseIssueDate, licenseExpiryDate, licenseProvince, licenseUri,
      // Selfie
      selfieUri,
    } = req.body;

    // ── Validate all required fields ──────────────────────────────────────────
    const missing: string[] = [];
    const required: Record<string, unknown> = {
      firstName, lastName, phone, city, vehicleType,
      nameTH, nameEN, idNumber, idIssueDate, idExpiryDate, dob, gender, address, idFrontUri,
      licenseNo, licenseType, licenseIssueDate, licenseExpiryDate, licenseProvince, licenseUri,
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
      firstName, lastName, fullName,
      phone, countryCode: countryCode || '+66', city, vehicleType,
      nameTH, nameEN, idNumber, idIssueDate, idExpiryDate, dob, gender, address, idFrontUri,
      licenseNo, licenseType, licenseIssueDate, licenseExpiryDate, licenseProvince, licenseUri,
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

// GET /api/riders/:id
export const getRiderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rider = await Rider.findById(id).lean();
    if (!rider) return res.status(404).json({ message: 'Rider not found' });
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
