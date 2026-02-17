import { Router } from 'express';
import { getShops, getShopById, updateShopById } from '../controllers/shopController';

const router = Router();

router.get('/', getShops);
router.get('/:id', getShopById);
router.put('/:id', updateShopById);

export default router;
