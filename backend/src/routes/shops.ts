import { Router } from 'express';
import { getShops, getShopById } from '../controllers/shopController';

const router = Router();

router.get('/', getShops);
router.get('/:id', getShopById);

export default router;
