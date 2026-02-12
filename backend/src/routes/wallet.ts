import { Router } from 'express';
import { getBalance, deposit, withdraw } from '../controllers/walletController';

const router = Router();

router.get('/:shopId', getBalance);
router.post('/:shopId/deposit', deposit);
router.post('/:shopId/withdraw', withdraw);

export default router;
