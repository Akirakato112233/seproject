import { Request, Response } from 'express';
import { Rider } from '../models/Rider';
import { RiderRegistration } from '../models/RiderRegistration';

// POST /api/riders/register - บันทึกข้อมูล rider ใหม่จากฟอร์ม register
// เก็บแยกใน collection 'rider_registrations' ไม่ปนกับ collection 'ไรเดอร์'
export const registerRider = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, phone, countryCode, city } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ success: false, message: 'firstName and lastName are required' });
    }

    const fullName = `${firstName} ${lastName}`.trim();

    const registration = await RiderRegistration.create({
      firstName,
      lastName,
      fullName,
      phone: phone || '',
      countryCode: countryCode || '+66',
      city: city || '',
      agreedToTerms: true,
    });

    console.log('✅ New Rider Registration:', registration._id, fullName);
    return res.status(201).json({ success: true, rider: registration });
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

    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
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
    const randomRider = await Rider.aggregate([
      { $sample: { size: 1 } }
    ]);

    if (!randomRider || randomRider.length === 0) {
      return res.status(404).json({ message: 'No riders found' });
    }

    return res.json({ riderId: randomRider[0]._id });
  } catch (error) {
    console.error('Error fetching random rider:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
