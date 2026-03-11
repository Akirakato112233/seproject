import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  getShops,
  getShopById,
  updateShopById,
  depositBalance,
  withdrawBalance,
  addCoinRevenue,
} from '../controllers/shopController';
import { registerShop, publishShop } from '../controllers/shopRegistrationController';

const router = Router();

// Multer config for shop images
const shopImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '../../uploads/shops')),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const uploadShopImage = multer({
  storage: shopImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

router.post('/register', registerShop);
router.post('/publish', publishShop);
router.get('/', getShops);
router.get('/:id', getShopById);
router.put('/:id', updateShopById);
router.post('/:id/balance/deposit', depositBalance);
router.post('/:id/balance/withdraw', withdrawBalance);
router.post('/:id/coin-revenue', addCoinRevenue);

// Upload shop profile image
router.post('/:id/upload-image', uploadShopImage.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const imageUrl = `/uploads/shops/${req.file.filename}`;
    // Update shop imageUrl in database
    const { Shop } = require('../models/Shop');
    await Shop.findByIdAndUpdate(req.params.id, { imageUrl });
    console.log('📷 Shop image uploaded:', imageUrl);
    res.json({ imageUrl });
  } catch (error) {
    console.error('Error uploading shop image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

export default router;
