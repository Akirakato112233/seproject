import { Request, Response } from 'express';
import { Rider } from '../models/Rider';

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

