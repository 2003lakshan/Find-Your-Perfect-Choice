import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDB, saveDB } from '../db.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';
import * as otplib from 'otplib';
import qrcode from 'qrcode';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

const RESET_SECRET = 'bodim-reset-secret-key';

// Reusable transporter (Uses Gmail if configured, otherwise falls back to Ethereal for testing)
const getTransporter = async () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Fallback to testing (Ethereal)
  console.log("⚠️ Using Ethereal test email. Configure EMAIL_USER and EMAIL_PASS in .env for real emails.");
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

const GOOGLE_CLIENT_ID = '900186992458-u5g7q60tfq2aj233vee4nb7e56ec7nsb.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const router = Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const db = getDB();
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = db.exec('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0 && existing[0].values.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    db.run('INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, phone || null]);

    const idResult = db.exec('SELECT last_insert_rowid() as id');
    const userId = idResult[0].values[0][0];

    saveDB();

    const user = { id: userId, name, email, role: 'user' };
    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const db = getDB();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = db.exec('SELECT * FROM users WHERE email = ?', [email]);
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const cols = result[0].columns;
    const row = result[0].values[0];
    const user = {};
    cols.forEach((col, i) => user[col] = row[i]);

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 2FA for admin
    if (user.role === 'admin') {
      if (!user.two_factor_enabled) {
        const secret = otplib.generateSecret();
        db.run('UPDATE users SET two_factor_secret = ? WHERE id = ?', [secret, user.id]);
        saveDB();
        const otpauth = otplib.generateURI({ label: user.email, issuer: 'Bodim Admin', secret });
        const qrCodeUrl = await qrcode.toDataURL(otpauth);
        
        return res.json({
          requires2FASetup: true,
          qrCode: qrCodeUrl,
          email: user.email
        });
      } else {
        return res.json({
          requires2FA: true,
          email: user.email
        });
      }
    }

    const token = generateToken(user);
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const db = getDB();
  const result = db.exec('SELECT id, name, email, phone, role FROM users WHERE id = ?', [req.user.id]);
  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }
  const cols = result[0].columns;
  const row = result[0].values[0];
  const user = {};
  cols.forEach((col, i) => user[col] = row[i]);
  res.json({ user });
});

// POST /api/auth/verify-2fa
router.post('/verify-2fa', async (req, res) => {
  try {
    const db = getDB();
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({ error: 'Email and token are required' });
    }

    const result = db.exec('SELECT * FROM users WHERE email = ?', [email]);
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(401).json({ error: 'Invalid email' });
    }

    const cols = result[0].columns;
    const row = result[0].values[0];
    const user = {};
    cols.forEach((col, i) => user[col] = row[i]);

    if (user.role !== 'admin') {
      return res.status(400).json({ error: '2FA not required for this user' });
    }

    const { valid: isValid } = await otplib.verify({ token, secret: user.two_factor_secret });

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid 2FA token' });
    }

    if (!user.two_factor_enabled) {
      db.run('UPDATE users SET two_factor_enabled = 1 WHERE id = ?', [user.id]);
      saveDB();
      user.two_factor_enabled = 1;
    }

    const jwtToken = generateToken(user);
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token: jwtToken
    });

  } catch (err) {
    console.error('Verify 2FA error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// POST /api/auth/google — Google OAuth sign-in / sign-up
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ error: 'Google account does not have an email' });
    }

    const db = getDB();

    // Check if user already exists by email
    const existing = db.exec('SELECT * FROM users WHERE email = ?', [email]);

    let user;
    if (existing.length > 0 && existing[0].values.length > 0) {
      // Existing user — update google_id if not set and log them in
      const cols = existing[0].columns;
      const row = existing[0].values[0];
      user = {};
      cols.forEach((col, i) => user[col] = row[i]);

      // Link Google ID if not already linked
      if (!user.google_id) {
        db.run('UPDATE users SET google_id = ?, auth_provider = CASE WHEN auth_provider = ? THEN ? ELSE auth_provider END WHERE id = ?',
          [googleId, 'local', 'google', user.id]);
        saveDB();
      }
    } else {
      // New user — create account (use empty string for password to satisfy NOT NULL constraint)
      db.run(
        'INSERT INTO users (name, email, password, google_id, auth_provider) VALUES (?, ?, ?, ?, ?)',
        [name || 'Google User', email, '', googleId, 'google']
      );
      const idResult = db.exec('SELECT last_insert_rowid() as id');
      const userId = idResult[0].values[0][0];
      user = { id: userId, name: name || 'Google User', email, role: 'user' };
      saveDB();
    }

    const token = generateToken(user);
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'Google authentication failed' });
  }
});

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const db = getDB();
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: 'Email is required' });

    const existing = db.exec('SELECT id, name FROM users WHERE LOWER(email) = LOWER(?)', [email]);
    if (existing.length === 0 || existing[0].values.length === 0) {
      // Return success even if not found to prevent email enumeration
      return res.json({ success: true, message: 'If an account exists, an OTP has been sent.' });
    }

    const user = {
      id: existing[0].values[0][0],
      name: existing[0].values[0][1],
      email
    };

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60000).toISOString(); // 10 mins

    db.run('UPDATE users SET login_otp = ?, login_otp_expiry = ? WHERE id = ?', [otp, expiry, user.id]);
    saveDB();

    const transporter = await getTransporter();
    const senderEmail = process.env.EMAIL_USER || 'support@bodim.example.com';
    const info = await transporter.sendMail({
      from: `"Bodim Support" <${senderEmail}>`,
      to: email,
      subject: "Your Login OTP",
      html: `
        <h2>Login Request</h2>
        <p>Hi ${user.name},</p>
        <p>Your One-Time Password (OTP) for login is:</p>
        <h1 style="padding: 10px 20px; background: #f3f4f6; color: #111827; border-radius: 8px; display: inline-block; letter-spacing: 4px;">${otp}</h1>
        <p>This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
      `
    });

    console.log("==========================================");
    console.log("OTP Email sent!");
    console.log("OTP: %s", otp);
    if (info.messageId && !process.env.EMAIL_USER) {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
    console.log("==========================================");

    res.json({ success: true, message: 'If an account exists, an OTP has been sent.' });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', (req, res) => {
  try {
    const db = getDB();
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const result = db.exec('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(401).json({ error: 'Invalid email or OTP' });
    }

    const cols = result[0].columns;
    const row = result[0].values[0];
    const user = {};
    cols.forEach((col, i) => user[col] = row[i]);

    if (!user.login_otp || user.login_otp !== otp) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    const now = new Date();
    const expiryDate = new Date(user.login_otp_expiry);
    
    if (now > expiryDate) {
      return res.status(401).json({ error: 'OTP has expired' });
    }

    // Clear OTP after successful verification
    db.run('UPDATE users SET login_otp = NULL, login_otp_expiry = NULL WHERE id = ?', [user.id]);
    saveDB();

    const token = generateToken(user);
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

export default router;
