/**
 * Google Auth routes: login (verify accessToken, return APP or REGISTER), register (complete signup with tempToken), callback for web redirect.
 * Uses NGROK_URL and GOOGLE_CLIENT_SECRET from env. Profile updates (name, phone, photo) are in auth.ts.
 */
import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { RiderRegistration } from '../models/RiderRegistration';
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
    const emailLower = email ? email.trim().toLowerCase() : '';

    // Find by (googleSub + role) or (email + role)
    const emailRegex = emailLower
      ? new RegExp(`^${emailLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
      : null;
    let user = await User.findOne({ googleSub, role });
    if (!user && emailLower) {
      user = await User.findOne({ email: emailRegex!, role });
    }
    // ถ้ามี user ด้วยอีเมลนี้อยู่แล้ว (ไม่ว่าจะ role อะไร) = อยู่ในระบบแล้ว → ให้เข้าแอปได้เลย
    if (!user && emailLower) {
      const existingByEmail = await User.findOne({ email: emailRegex! });
      if (existingByEmail) {
        if (!existingByEmail.googleSub) {
          existingByEmail.googleSub = googleSub;
          await existingByEmail.save().catch(() => { });
        }
        const token = signAppToken({ userId: existingByEmail._id.toString() });
        return res.json({
          next: 'APP',
          token,
          user: {
            id: existingByEmail._id,
            email: existingByEmail.email,
            displayName: existingByEmail.displayName,
            phone: existingByEmail.phone,
            address: existingByEmail.address,
            balance: existingByEmail.balance,
            role: existingByEmail.role,
          },
        });
      }
    }

    // No User for this role → ถ้าเป็น rider และมี RiderRegistration กับเมลนี้แล้ว = เคย regis แล้ว ให้สร้าง User (หรือใช้ของเดิมถ้ามีแล้ว)
    if (!user && role === 'rider' && emailLower) {
      const reg = await RiderRegistration.findOne({
        email: { $regex: new RegExp(`^${emailLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      })
        .sort({ createdAt: -1 })
        .lean();
      if (reg) {
        // อาจมี User อยู่แล้ว (สร้างจากครั้งก่อนหรือ race) – เช็คอีกครั้งก่อน create
        let existing = await User.findOne({ googleSub, role });
        if (!existing && emailLower) {
          existing = await User.findOne({
            email: { $regex: new RegExp(`^${emailLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
            role,
          });
        }
        if (existing) {
          if (!existing.googleSub) {
            existing.googleSub = googleSub;
            await existing.save();
          }
          const token = signAppToken({ userId: existing._id.toString() });
          return res.json({
            next: 'APP',
            token,
            user: {
              id: existing._id,
              email: existing.email,
              displayName: existing.displayName,
              phone: existing.phone,
              address: existing.address,
              balance: existing.balance,
              role: existing.role,
            },
          });
        }
        const username = `${emailLower}_rider`;
        try {
          const newUser = await User.create({
            googleSub,
            email: emailLower,
            username,
            displayName: (reg as any).fullName || googleProfile.name || '',
            phone: (reg as any).phone || '',
            address: (reg as any).address || '',
            balance: 0,
            role: 'rider',
            isOnboarded: true,
          });
          const token = signAppToken({ userId: newUser._id.toString() });
          return res.json({
            next: 'APP',
            token,
            user: {
              id: newUser._id,
              email: newUser.email,
              displayName: newUser.displayName,
              phone: newUser.phone,
              address: newUser.address,
              balance: newUser.balance,
              role: newUser.role,
            },
          });
        } catch (createErr: any) {
          console.error('Google login User.create error:', createErr?.message, createErr?.code);
          const bySub = await User.findOne({ googleSub, role });
          const byEmail = emailLower
            ? await User.findOne({
              email: { $regex: new RegExp(`^${emailLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
              role,
            })
            : null;
          const existing = bySub || byEmail;
          if (existing) {
            if (!existing.googleSub) {
              existing.googleSub = googleSub;
              await existing.save().catch(() => { });
            }
            const token = signAppToken({ userId: existing._id.toString() });
            return res.json({
              next: 'APP',
              token,
              user: {
                id: existing._id,
                email: existing.email,
                displayName: existing.displayName,
                phone: existing.phone,
                address: existing.address,
                balance: existing.balance,
                role: existing.role,
              },
            });
          }
          throw createErr;
        }
      }
    }

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

    // Exists but not onboarded for this app → continue registration
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
    const errMsg = error?.message ?? String(error);
    const errCode = error?.code;
    console.error('Google login error:', errMsg, errCode, error?.stack);
    return res.status(500).json({
      message: errMsg || 'Server error',
      error: errMsg,
      code: errCode,
    });
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
      // Case: new user from Google (per-role: same Google can be both user and rider)
      const { googleSub, email, name } = decoded;
      const regRole = decoded.role || role;
      user = await User.findOne({ googleSub, role: regRole });

      if (!user) {
        const baseName = email || googleSub;
        const username = `${baseName}_${regRole}`;
        user = await User.create({
          googleSub,
          email,
          username,
          displayName: name || '',
          phone: '',
          address: '',
          balance: 0,
          role: regRole,
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
 * Query: ?redirect_scheme=exp://192.168.2.40:8081
 */
router.get('/start', (req: Request, res: Response) => {
  res.setHeader('ngrok-skip-browser-warning', '1');
  const redirectScheme = (req.query.redirect_scheme as string) || 'exp://192.168.2.40:8081';
  const GOOGLE_CLIENT_ID =
    '543704041787-0slqpuv7ecelpgsfg73s6gao3qo6geb9.apps.googleusercontent.com';
  const CALLBACK_URL = `${process.env.NGROK_URL || 'https://judith-cottony-cami.ngrok-free.dev'}/api/google/callback`;

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
    const redirectScheme = (state as string) || 'exp://192.168.2.40:8081';
    const GOOGLE_CLIENT_ID =
      '543704041787-0slqpuv7ecelpgsfg73s6gao3qo6geb9.apps.googleusercontent.com';
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
    const CALLBACK_URL = `${process.env.NGROK_URL || 'https://judith-cottony-cami.ngrok-free.dev'}/api/google/callback`;

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
