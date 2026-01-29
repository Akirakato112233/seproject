import crypto from 'crypto';
import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { EmailOtp } from '../models/EmailOtp';
import { Signup } from '../models/Signup';
import { User } from '../models/User';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const getSmtpTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw new Error('Missing SMTP env (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS)');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

const otpHash = (email: string, code: string) => {
  const secret = process.env.OTP_SECRET || 'dev-secret';
  return crypto
    .createHash('sha256')
    .update(`${secret}:${email.toLowerCase()}:${code}`)
    .digest('hex');
};

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

export const requestOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body ?? {};
    if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const code = generateOtp();
    const codeHash = otpHash(normalizedEmail, code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await EmailOtp.deleteMany({ email: normalizedEmail });
    await EmailOtp.create({ email: normalizedEmail, codeHash, expiresAt });

    const transporter = getSmtpTransporter();
    const from = process.env.MAIL_FROM || process.env.SMTP_USER!;

    await transporter.sendMail({
      from,
      to: normalizedEmail,
      subject: 'Your verification code',
      text: `Your verification code is ${code}. It expires in 10 minutes.`,
    });

    return res.json({ success: true });
  } catch (error: any) {
    console.error('Request OTP error:', error);
    return res.status(500).json({ message: error?.message ?? 'Request OTP failed' });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body ?? {};
    if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email' });
    }
    if (!code || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ message: 'Invalid code' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const doc = await EmailOtp.findOne({ email: normalizedEmail });
    if (!doc) return res.status(400).json({ message: 'OTP not found' });
    if (doc.expiresAt.getTime() < Date.now()) return res.status(400).json({ message: 'OTP expired' });

    const expected = otpHash(normalizedEmail, code);
    if (expected !== doc.codeHash) return res.status(400).json({ message: 'OTP invalid' });

    await EmailOtp.deleteMany({ email: normalizedEmail });

    const verificationId = crypto.randomBytes(16).toString('hex');
    await Signup.findOneAndUpdate(
      { email: normalizedEmail },
      { $set: { email: normalizedEmail, emailVerificationId: verificationId } },
      { upsert: true }
    );

    return res.json({ success: true, verificationId });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ message: error?.message ?? 'Verify OTP failed' });
  }
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, phone, verificationId } = req.body ?? {};

    if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email' });
    }
    if (!phone || typeof phone !== 'string' || !phone.startsWith('+')) {
      return res.status(400).json({ message: 'Invalid phone' });
    }
    if (!verificationId || typeof verificationId !== 'string') {
      return res.status(400).json({ message: 'Missing verificationId' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await Signup.findOne({ email: normalizedEmail });
    if (!existing || existing.emailVerificationId !== verificationId) {
      return res.status(400).json({ message: 'Email not verified' });
    }

    const doc = await Signup.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $set: {
          email: normalizedEmail,
          firstName,
          lastName,
          phone,
        },
      },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      signup: {
        id: doc._id,
        email: doc.email,
        firstName: doc.firstName,
        lastName: doc.lastName,
        phone: doc.phone,
      },
    });
  } catch (error) {
    // Duplicate key errors etc.
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Signup failed' });
  }
};

// ========== Google Auth Functions ==========

/**
 * Check if a user exists by email
 * Used after Google Sign-In to determine if user needs to register
 */
export const checkUserByEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body ?? {};

    if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (user) {
      return res.json({
        exists: true,
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          phone: user.phone,
          address: user.address,
          balance: user.balance,
        },
      });
    } else {
      return res.json({ exists: false });
    }
  } catch (error: any) {
    console.error('Check user error:', error);
    return res.status(500).json({ message: error?.message ?? 'Check user failed' });
  }
};

/**
 * Register a new user from Google Sign-In
 */
export const registerGoogleUser = async (req: Request, res: Response) => {
  try {
    const { email, displayName, phone, address, googleId } = req.body ?? {};

    if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = await User.create({
      email: normalizedEmail,
      username: normalizedEmail, // Use email as username
      displayName: displayName || '',
      phone: phone || '',
      address: address || '',
      balance: 0,
      googleId: googleId || '',
    });

    return res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        phone: user.phone,
        address: user.address,
        balance: user.balance,
      },
    });
  } catch (error: any) {
    console.error('Register Google user error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    return res.status(500).json({ message: error?.message ?? 'Registration failed' });
  }
};
