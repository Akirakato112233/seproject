import { Router, Request, Response } from 'express';
import { MerchantUser } from '../models/MerchantUser';
import { signAppToken, signTempToken, verifyToken } from '../utils/tokens';

const router = Router();

/**
 * POST /api/merchants/google/login
 * Verify Google access token and check MerchantUser
 * - If not found or not onboarded → return REGISTER with tempToken
 * - If found and onboarded → return APP with token
 */
router.post('/google/login', async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ message: 'Missing accessToken' });
    }

    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      const text = await userRes.text();
      return res.status(401).json({ message: 'Invalid Google token', detail: text });
    }

    const googleProfile = await userRes.json();
    const googleSub = googleProfile.sub;
    const email = googleProfile.email || '';

    let merchant = await MerchantUser.findOne({ googleSub });

    if (!merchant) {
      const tempToken = signTempToken({
        googleSub,
        email,
        name: googleProfile.name || '',
        picture: googleProfile.picture || '',
      });
      return res.json({
        next: 'REGISTER',
        tempToken,
        profile: {
          googleSub,
          email,
          name: googleProfile.name,
          picture: googleProfile.picture,
        },
      });
    }

    if (!merchant.isOnboarded) {
      const tempToken = signTempToken({
        merchantUserId: merchant._id.toString(),
      });
      return res.json({
        next: 'REGISTER',
        tempToken,
        profile: {
          googleSub: merchant.googleSub,
          email: merchant.email,
          name: merchant.displayName,
          picture: merchant.picture,
        },
      });
    }

    const token = signAppToken({ merchantUserId: merchant._id.toString() });
    return res.json({
      next: 'APP',
      token,
      user: {
        id: merchant._id,
        _id: merchant._id,
        email: merchant.email,
        displayName: merchant.displayName,
        phone: merchant.phone,
        address: merchant.address,
        role: 'merchant',
      },
    });
  } catch (error: any) {
    console.error('Merchant Google login error:', error);
    return res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

/**
 * POST /api/merchants/google/register
 * Complete registration - create/update MerchantUser
 * Body: { tempToken, displayName, phone, address? }
 */
router.post('/google/register', async (req: Request, res: Response) => {
  try {
    const { tempToken, displayName, phone, address, businessType } = req.body;
    if (!tempToken) {
      return res.status(400).json({ message: 'Missing tempToken' });
    }

    const decoded = verifyToken(tempToken);
    let merchant: any = null;

    if (decoded.merchantUserId) {
      merchant = await MerchantUser.findById(decoded.merchantUserId);
      if (!merchant) {
        return res.status(404).json({ message: 'Merchant not found' });
      }
    } else {
      const { googleSub, email, name } = decoded;
      merchant = await MerchantUser.findOne({ googleSub });

      if (!merchant) {
        merchant = await MerchantUser.create({
          googleSub,
          email: email || '',
          displayName: name || '',
          phone: '',
          address: '',
          picture: decoded.picture || '',
          isOnboarded: false,
        });
      }
    }

    if (displayName?.trim()) merchant.displayName = displayName.trim();
    if (phone?.trim()) merchant.phone = phone.trim();
    if (address?.trim()) merchant.address = address.trim();
    if (businessType === 'full' || businessType === 'coin') merchant.businessType = businessType;
    merchant.isOnboarded = true;

    await merchant.save();

    const token = signAppToken({ merchantUserId: merchant._id.toString() });
    return res.json({
      next: 'APP',
      token,
      user: {
        id: merchant._id,
        _id: merchant._id,
        email: merchant.email,
        displayName: merchant.displayName,
        phone: merchant.phone,
        address: merchant.address,
        role: 'merchant',
      },
    });
  } catch (error: any) {
    console.error('Merchant register error:', error);
    return res.status(400).json({ message: 'Registration failed', error: String(error) });
  }
});

export default router;
