import express from 'express';
import { getBalance, redeemGift } from '../controllers/redeemController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken); // Protect all routes below

router.post('/', redeemGift);
router.get('/balance', getBalance);

export default router;