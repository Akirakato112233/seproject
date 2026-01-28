import express from 'express';
import { getBalance, redeemGift } from '../controllers/redeemController';
const router = express.Router();
router.post('/', redeemGift);
router.get('/balance', getBalance);
export default router;