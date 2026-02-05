// backend-example/src/routes/googleAuth.ts
// Google Authentication routes
import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { signAppToken, signTempToken, verifyToken } from '../utils/tokens';

const router = Router();

/**
 * POST /api/google/login
 * Verify Google access token and check if user exists
 * - If user exists and onboarded → return APP token
 * - If user doesn't exist or not onboarded → return REGISTER with tempToken
 */
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { accessToken, role = 'user' } = req.body;
        if (!accessToken) {
            return res.status(400).json({ message: 'Missing accessToken' });
        }

        // Validate role
        const validRoles = ['user', 'rider', 'merchant'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        // Verify with Google and get profile
        const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!userRes.ok) {
            const text = await userRes.text();
            return res.status(401).json({ message: 'Invalid Google token', detail: text });
        }

        const googleProfile = await userRes.json();
        // googleProfile.sub, googleProfile.email, googleProfile.name, googleProfile.picture

        const googleSub = googleProfile.sub;
        const email = googleProfile.email || null;

        // Find user by googleSub or email
        let user = await User.findOne({ googleSub });
        if (!user && email) {
            user = await User.findOne({ email });
        }

        // User not found → go to register
        if (!user) {
            const tempToken = signTempToken({
                googleSub,
                email,
                name: googleProfile.name || '',
                picture: googleProfile.picture || '',
                role,
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

        // User exists but not onboarded → continue registration
        if (!user.isOnboarded) {
            const tempToken = signTempToken({ userId: user._id.toString(), role });
            return res.json({
                next: 'REGISTER',
                tempToken,
                profile: {
                    googleSub: user.googleSub,
                    email: user.email,
                    name: user.displayName,
                    picture: '',
                },
            });
        }

        // User exists but has different role → reject
        if (user.role !== role) {
            return res.status(403).json({
                message: `This account is registered as ${user.role}. Please use the correct app.`
            });
        }

        const token = signAppToken({ userId: user._id.toString() });
        return res.json({
            next: 'APP',
            token,
            user: {
                id: user._id,
                email: user.email,
                displayName: user.displayName,
                phone: user.phone,
                address: user.address,
                balance: user.balance,
                role: user.role,
            },
        });
    } catch (error: any) {
        console.error('Google login error:', error);
        return res.status(500).json({ message: 'Server error', error: String(error) });
    }
});

/**
 * POST /api/google/register
 * Complete registration with additional user info
 * Body: { tempToken, displayName, phone, address }
 */
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { tempToken, displayName, phone, address, role = 'user' } = req.body;
        if (!tempToken) {
            return res.status(400).json({ message: 'Missing tempToken' });
        }

        const decoded = verifyToken(tempToken);
        let user = null;

        // Case: existing user but not onboarded
        if (decoded.userId) {
            user = await User.findById(decoded.userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
        } else {
            // Case: new user from Google
            const { googleSub, email, name } = decoded;
            user = await User.findOne({ googleSub });

            if (!user) {
                // Create new user with role
                user = await User.create({
                    googleSub,
                    email,
                    username: email || googleSub, // Use email as username
                    displayName: name || '',
                    phone: '',
                    address: '',
                    balance: 0,
                    role: decoded.role || role,
                    isOnboarded: false,
                });
            }
        }

        // Update user fields
        if (displayName?.trim()) user.displayName = displayName.trim();
        if (phone?.trim()) user.phone = phone.trim();
        if (address?.trim()) user.address = address.trim();
        user.isOnboarded = true;

        await user.save();

        const token = signAppToken({ userId: user._id.toString() });
        return res.json({
            next: 'APP',
            token,
            user: {
                id: user._id,
                email: user.email,
                displayName: user.displayName,
                phone: user.phone,
                address: user.address,
                balance: user.balance,
                role: user.role,
            },
        });
    } catch (error: any) {
        console.error('Google register error:', error);
        return res.status(400).json({ message: 'Registration failed', error: String(error) });
    }
});

export default router;
