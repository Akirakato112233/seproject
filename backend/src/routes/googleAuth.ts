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

/**
 * GET /api/google/start
 * Redirect user to Google OAuth consent screen
 * Query: ?redirect_scheme=exp://192.168.0.247:8081
 */
router.get('/start', (req: Request, res: Response) => {
    res.setHeader('ngrok-skip-browser-warning', '1');
    const redirectScheme = (req.query.redirect_scheme as string) || 'exp://192.168.0.247:8081';
    const GOOGLE_CLIENT_ID = '543704041787-0slqpuv7ecelpgsfg73s6gao3qo6geb9.apps.googleusercontent.com';
    const CALLBACK_URL = `https://putative-renea-whisperingly.ngrok-free.dev/api/google/callback`;

    const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: CALLBACK_URL,
        response_type: 'code',
        scope: 'openid profile email',
        access_type: 'offline',
        state: redirectScheme, // pass app scheme in state
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    res.redirect(googleAuthUrl);
});

/**
 * GET /api/google/callback
 * Google redirects here with ?code=...&state=...
 * Exchange code for tokens, then redirect back to app
 */
router.get('/callback', async (req: Request, res: Response) => {
    try {
            const { code, state } = req.query;
        const redirectScheme = (state as string) || 'exp://192.168.0.247:8081';
        const GOOGLE_CLIENT_ID = '543704041787-0slqpuv7ecelpgsfg73s6gao3qo6geb9.apps.googleusercontent.com';
        const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
        const CALLBACK_URL = `https://putative-renea-whisperingly.ngrok-free.dev/api/google/callback`;

        if (!code) {
            return res.status(400).send('Missing authorization code');
        }

        // Exchange code for tokens
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code: code as string,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: CALLBACK_URL,
                grant_type: 'authorization_code',
            }).toString(),
        });

        const tokenData = await tokenRes.json();
    
        if (!tokenData.access_token) {
            return res.status(400).send('Failed to exchange code for token');
        }

        // Redirect back to app with access token
        const appRedirect = `${redirectScheme}/--/auth?access_token=${tokenData.access_token}`;
            res.redirect(appRedirect);
    } catch (error: any) {
            res.status(500).send('Authentication failed');
    }
});

export default router;
