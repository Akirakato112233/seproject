import { Router } from 'express';
import {
    requestOtp,
    signup,
    verifyOtp,
    checkUserByEmail,
    registerGoogleUser
} from '../controllers/authController';

const router = Router();

// Email OTP (we keep route names but they now use email, not phone)
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/signup', signup);

// Google Auth routes
router.post('/check-user', checkUserByEmail);
router.post('/register-google-user', registerGoogleUser);

export default router;
