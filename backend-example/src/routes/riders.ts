import { Router } from 'express';
import { getRiderById } from '../controllers/riderController';

const router = Router();

router.get('/:id', getRiderById);

export default router;

