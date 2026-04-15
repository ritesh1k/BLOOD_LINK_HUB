import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { getFrontendBaseUrl, getJwtSecret } from '../config.js';
import { sendEmailNotification, sendSmsNotification } from '../services/notification-service.js';

const router = Router();
const JWT_SECRET = getJwtSecret();

const DEFAULT_ADMIN_ID = process.env.DEFAULT_ADMIN_ID || 'admin';
const DEFAULT_ADMIN_PASSWORD_HASH = process.env.DEFAULT_ADMIN_PASSWORD_HASH || '$2a$10$KA3yvZtsrwCQslO5FZrLNePVtCUxRrgAr6zC0N4Cuk8tS1MGiiQGS';

async function ensureDefaultAdmin() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS admin (
      id TINYINT PRIMARY KEY DEFAULT 1,
      admin_id VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CHECK (id = 1)
    )
  `);

  await db.query(
    'INSERT INTO admin (id, admin_id, password_hash) VALUES (1, ?, ?) ON DUPLICATE KEY UPDATE admin_id = admin_id',
    [DEFAULT_ADMIN_ID, DEFAULT_ADMIN_PASSWORD_HASH]
  );
}

async function getAdminAccount() {
  await ensureDefaultAdmin();
  const [rows] = await db.query('SELECT id, admin_id, password_hash FROM admin WHERE id = 1 LIMIT 1');
  return rows[0] || null;
}

// POST /api/auth/register
router.post('/register',
  body('name').isString().isLength({ min: 2 }),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('blood_group').isString().isLength({ min: 1, max: 5 }),
  body('role').optional().isIn(['donor', 'receiver']),
  body('phone').optional({ values: 'falsy' }).isString().trim().isLength({ min: 7, max: 20 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, password, blood_group, phone } = req.body;
    const email = String(req.body.email || '').trim().toLowerCase();
    const role = req.body.role === 'donor' ? 'donor' : 'receiver';
    try {
      const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length) return res.status(409).json({ error: 'Email already in use' });

      const hashed = await bcrypt.hash(password, 10);
      const [insertResult] = await db.query(
        'INSERT INTO users (name, email, password, blood_group) VALUES (?,?,?,?)',
        [name, email, hashed, blood_group]
      );

      await db.query(
        `INSERT INTO user_profile (user_id, role, phone, profile_completed)
         VALUES (?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE role = VALUES(role), phone = VALUES(phone), profile_completed = 1`,
        [insertResult.insertId, role, phone || null]
      );

      res.status(201).json({ message: 'Registered successfully' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// POST /api/auth/login
router.post('/login',
  body('email').isEmail(),
  body('password').isString(),
  body('role').optional().isIn(['donor', 'receiver']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const email = String(req.body.email || '').trim().toLowerCase();
    const { password } = req.body;
    const expectedRole = req.body.role;
    try {
      const [rows] = await db.query(
        `SELECT
           u.id,
           u.name,
           u.email,
           u.password,
           u.blood_group,
            COALESCE(up.phone, '') AS phone,
           up.user_id AS profile_user_id,
           COALESCE(up.role, 'receiver') AS role
         FROM users u
         LEFT JOIN user_profile up ON up.user_id = u.id
         WHERE u.email = ?`,
        [email]
      );
      if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
      const user = rows[0];
      let ok = false;
      let shouldMigrateLegacyPassword = false;

      if (typeof user.password === 'string' && user.password.startsWith('$2')) {
        ok = await bcrypt.compare(password, user.password);
      } else {
        // Backward compatibility for older rows that stored plain text password.
        ok = String(password) === String(user.password || '');
        shouldMigrateLegacyPassword = ok;
      }

      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

      if (shouldMigrateLegacyPassword) {
        const hashed = await bcrypt.hash(password, 10);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, user.id]);
      }

      let effectiveRole = user.role;
      if (expectedRole) {
        if (!user.profile_user_id) {
          await db.query(
            'INSERT INTO user_profile (user_id, role) VALUES (?, ?) ON DUPLICATE KEY UPDATE role = VALUES(role)',
            [user.id, expectedRole]
          );
          effectiveRole = expectedRole;
        } else if (user.role !== expectedRole) {
          return res.status(403).json({ error: `This account is registered as ${user.role}.` });
        }
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES || '7d' }
      );
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          blood_group: user.blood_group,
          phone: user.phone,
          role: effectiveRole
        }
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// POST /api/auth/forgot-password
router.post('/forgot-password',
  body('email').isEmail(),
  body('role').optional().isIn(['donor', 'receiver']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const email = String(req.body.email || '').trim().toLowerCase();
    const expectedRole = req.body.role;

    try {
      const [rows] = await db.query(
        `SELECT
           u.id,
           u.name,
           u.email,
           COALESCE(up.phone, '') AS phone,
           COALESCE(up.role, 'receiver') AS role
         FROM users u
         LEFT JOIN user_profile up ON up.user_id = u.id
         WHERE u.email = ?
         LIMIT 1`,
        [email]
      );

      // Return a generic success response even when account does not exist.
      if (!rows.length) {
        return res.json({ message: 'If the account exists, reset link has been sent to registered email and phone.' });
      }

      const user = rows[0];
      if (expectedRole && user.role !== expectedRole) {
        return res.json({ message: 'If the account exists, reset link has been sent to registered email and phone.' });
      }

      const resetToken = jwt.sign(
        { purpose: 'password-reset', id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: process.env.PASSWORD_RESET_EXPIRES || '15m' }
      );

      const frontendBaseUrl = getFrontendBaseUrl(req);
      const resetUrl = `${frontendBaseUrl}/reset-password.html?token=${encodeURIComponent(resetToken)}&role=${encodeURIComponent(user.role)}`;

      const emailSubject = 'BloodLink Hub password reset';
      const emailText = [
        `Hello ${user.name || 'User'},`,
        '',
        'We received a request to reset your BloodLink Hub password.',
        `Reset your password using this secure link: ${resetUrl}`,
        '',
        'This link expires shortly. If you did not request it, ignore this message.'
      ].join('\n');

      await sendEmailNotification({
        userId: user.id,
        relatedEntityType: 'password_reset',
        relatedEntityId: user.id,
        to: user.email,
        templateKey: 'password_reset_link',
        subject: emailSubject,
        text: emailText,
        html: `
          <p>Hello ${user.name || 'User'},</p>
          <p>We received a request to reset your BloodLink Hub password.</p>
          <p><a href="${resetUrl}">Click here to reset your password</a></p>
          <p>This link expires shortly. If you did not request it, ignore this message.</p>
        `
      });

      if (user.phone) {
        await sendSmsNotification({
          userId: user.id,
          relatedEntityType: 'password_reset',
          relatedEntityId: user.id,
          to: user.phone,
          templateKey: 'password_reset_link',
          text: `BloodLink Hub: Reset your password using ${resetUrl}`
        });
      }

      return res.json({
        message: 'If the account exists, reset link has been sent to registered email and phone.'
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

// POST /api/auth/reset-password
router.post('/reset-password',
  body('token').isString().isLength({ min: 10 }),
  body('new_password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { token, new_password } = req.body;

    try {
      const payload = jwt.verify(token, JWT_SECRET);
      if (!payload || payload.purpose !== 'password-reset' || !payload.id) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      const hashed = await bcrypt.hash(new_password, 10);
      const [result] = await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, payload.id]);

      if (!result.affectedRows) {
        return res.status(400).json({ error: 'Invalid reset request' });
      }

      return res.json({ message: 'Password reset successful' });
    } catch (e) {
      if (e && (e.name === 'TokenExpiredError' || e.name === 'JsonWebTokenError')) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }
      console.error(e);
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

// POST /api/auth/admin-login
router.post('/admin-login',
  body('admin_id').isString().isLength({ min: 1 }),
  body('password').isString().isLength({ min: 1 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { admin_id, password } = req.body;
    try {
      const admin = await getAdminAccount();
      if (!admin) {
        return res.status(404).json({ error: 'Admin account not found.' });
      }

      if (admin.admin_id !== admin_id) {
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }

      const ok = await bcrypt.compare(password, admin.password_hash);
      if (!ok) {
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }

      const token = jwt.sign(
        { role: 'admin', admin_id: admin.admin_id },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES || '7d' }
      );

      return res.json({ token, admin: { admin_id: admin.admin_id, role: 'admin' } });
    } catch (e) {
      console.error(e);
      if (e && e.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({ error: 'Admin table not found. Run database/schema.sql first.' });
      }
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

export default router;
