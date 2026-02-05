import { Router } from 'express';
import { getRiderById, getRandomRiderId } from '../controllers/riderController';

const router = Router();

router.get('/random/id', getRandomRiderId);
router.get('/:id', getRiderById);

export default router;

