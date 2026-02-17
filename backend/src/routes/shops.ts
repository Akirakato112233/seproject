import { Router } from 'express';
import { getShops, getShopById, updateShopById, depositBalance, withdrawBalance } from '../controllers/shopController';

const router = Router();

router.get('/', getShops);
router.get('/:id', getShopById);
router.put('/:id', updateShopById);
router.post('/:id/balance/deposit', depositBalance);
router.post('/:id/balance/withdraw', withdrawBalance);

export default router;
