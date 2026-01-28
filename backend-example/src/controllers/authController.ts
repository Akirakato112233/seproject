import crypto from 'crypto';
import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { EmailOtp } from '../models/EmailOtp';
import { Signup } from '../models/Signup';

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

