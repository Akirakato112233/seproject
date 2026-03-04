/**
 * Auth routes: OTP signup, Google auth, user by ID, update profile (name/phone), update profile photo URL.
 * Profile photo is stored as a URL (e.g. from Supabase); phone must be 10 digits starting with 0.
 */
import { Router } from 'express';
import {
  requestOtp,
  signup,
  verifyOtp,
  checkUserByEmail,
  registerGoogleUser,
} from '../controllers/authController';
import { User } from '../models/User';

const router = Router();

// Email OTP (we keep route names but they now use email, not phone)
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/signup', signup);

// Google Auth routes
router.post('/check-user', checkUserByEmail);
router.post('/register-google-user', registerGoogleUser);

// DEV: Get dev user for testing
router.get('/dev-user', async (req, res) => {
  try {
    const devUser = await User.findOne({
      email: 'dev-user@example.com',
      _id: '698e27ff93d8fdbda13bb05c',
    });

    if (devUser) {
      res.json({
        success: true,
        user: {
          _id: devUser._id,
          displayName: devUser.displayName,
          email: devUser.email,
          balance: devUser.balance,
          phone: devUser.phone,
          address: devUser.address,
          isOnboarded: devUser.isOnboarded,
          profilePhoto: devUser.profilePhoto || '',
          lat: devUser.lat,
          lon: devUser.lon,
          locationName: devUser.locationName,
        },
      });
    } else {
      res.json({
        success: false,
        message: 'Dev user not found',
      });
    }
  } catch (error) {
    console.error('Error fetching dev user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Get user by ID (for loading location data)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (user) {
      res.json({
        success: true,
        user: {
          _id: user._id,
          displayName: user.displayName,
          email: user.email,
          balance: user.balance,
          phone: user.phone,
          address: user.address,
          isOnboarded: user.isOnboarded,
          profilePhoto: user.profilePhoto || '',
          lat: user.lat,
          lon: user.lon,
          locationName: user.locationName,
        },
      });
    } else {
      res.json({
        success: false,
        message: 'User not found',
      });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// DELETE user account
router.delete('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const deleted = await User.findByIdAndDelete(userId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    console.log('🗑️ User deleted:', userId);
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user profile: displayName and/or phone (phone must be 10 digits, start with 0)
router.put('/update-profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { displayName, phone } = req.body;
    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName.trim();
    if (phone !== undefined) {
      const digits = String(phone).replace(/\D/g, '');
      if (digits.length !== 10 || digits[0] !== '0') {
        return res
          .status(400)
          .json({ success: false, message: 'Mobile number must be 10 digits and start with 0' });
      }
      updateData.phone = digits;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({
      success: true,
      user: {
        _id: updatedUser._id,
        displayName: updatedUser.displayName,
        phone: updatedUser.phone,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update profile photo: expects a public URL (e.g. from Supabase Storage), stored in user.profilePhoto
router.put('/update-photo/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { profilePhoto } = req.body;
    if (!profilePhoto || typeof profilePhoto !== 'string') {
      return res.status(400).json({ success: false, message: 'profilePhoto URL is required' });
    }
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { profilePhoto } },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    console.log('📸 Profile photo updated for', userId, '→', profilePhoto);
    return res.json({ success: true, profilePhoto: updatedUser.profilePhoto });
  } catch (error) {
    console.error('Error updating profile photo:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user location
router.put('/update-location/:userId', async (req, res) => {
  console.log('📍 update-location called:', req.params.userId, req.body);
  try {
    const { userId } = req.params;
    const { lat, lon, locationName, address } = req.body;

    const updateData: any = {};
    if (lat !== undefined) updateData.lat = lat;
    if (lon !== undefined) updateData.lon = lon;
    if (locationName !== undefined) updateData.locationName = locationName;
    if (address !== undefined) updateData.address = address;

    const updatedUser = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true });

    if (updatedUser) {
      res.json({
        success: true,
        user: {
          _id: updatedUser._id,
          lat: updatedUser.lat,
          lon: updatedUser.lon,
          locationName: updatedUser.locationName,
          address: updatedUser.address,
        },
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
