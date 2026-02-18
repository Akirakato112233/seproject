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
          isOnboarded: devUser.isOnboarded
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

export default router;
