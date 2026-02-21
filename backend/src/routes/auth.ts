import { Router } from 'express';
import {
    requestOtp,
    signup,
    verifyOtp,
    checkUserByEmail,
    registerGoogleUser
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
      _id: '698e27ff93d8fdbda13bb05c'
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
          lat: devUser.lat,
          lon: devUser.lon,
          locationName: devUser.locationName
        }
      });
    } else {
      res.json({ 
        success: false, 
        message: 'Dev user not found' 
      });
    }
  } catch (error) {
    console.error('Error fetching dev user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
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
          lat: user.lat,
          lon: user.lon,
          locationName: user.locationName
        }
      });
    } else {
      res.json({ 
        success: false, 
        message: 'User not found' 
      });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
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
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    );
    
    if (updatedUser) {
      res.json({
        success: true,
        user: {
          _id: updatedUser._id,
          lat: updatedUser.lat,
          lon: updatedUser.lon,
          locationName: updatedUser.locationName,
          address: updatedUser.address
        }
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
