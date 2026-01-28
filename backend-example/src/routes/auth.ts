import { Router } from 'express';
import { requestOtp, signup, verifyOtp } from '../controllers/authController';

const router = Router();

// Email OTP (we keep route names but they now use email, not phone)
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/signup', signup);

export default router;

