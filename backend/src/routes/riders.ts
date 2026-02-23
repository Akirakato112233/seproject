import { Router } from 'express';
import { getRiderById, getRandomRiderId, registerRider } from '../controllers/riderController';

const router = Router();

// POST /api/riders/register - บันทึกข้อมูล rider ใหม่ (ไม่ต้อง auth)
router.post('/register', registerRider);

router.get('/random/id', getRandomRiderId);
router.get('/:id', getRiderById);

export default router;
