import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = Router();

function safeLimit(value, fallback = 100) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, 500);
}

let userMessagesTableEnsured = false;

async function ensureUserMessagesTable() {
  if (userMessagesTableEnsured) return;
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sender_user_id INT NULL,
      receiver_user_id INT NULL,
      subject VARCHAR(180),
      message TEXT NOT NULL,
      message_type ENUM('general','request','appointment','system') DEFAULT 'general',
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      read_at TIMESTAMP NULL,
      INDEX idx_messages_receiver (receiver_user_id, is_read),
      FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (receiver_user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  userMessagesTableEnsured = true;
}

// GET /api/donors - list donors by optional filters
router.get('/', async (req, res) => {
  const {
    blood_group,
    state,
    district,
    gender,
    age
  } = req.query;
  const limit = safeLimit(req.query.limit, 50);

  const normalizedBloodGroup = String(blood_group || '').trim().toUpperCase();
  const normalizedState = String(state || '').trim();
  const normalizedDistrict = String(district || '').trim();
  const normalizedGender = String(gender || '').trim().toLowerCase();
  const requestedAge = Number(age);

  try {
    let sql = `
      SELECT
        u.id,
        u.name,
        u.email,
        u.blood_group,
        u.created_at,
        COALESCE(up.phone, dp.contact, '') AS phone,
        COALESCE(up.gender, '') AS gender,
        COALESCE(up.city, dp.city, '') AS city,
        COALESCE(up.district, '') AS district,
        COALESCE(up.state, '') AS state,
        COALESCE(dd.is_available, 1) AS is_available,
        CASE
          WHEN up.date_of_birth IS NULL THEN NULL
          ELSE TIMESTAMPDIFF(YEAR, up.date_of_birth, CURDATE())
        END AS age
      FROM users u
      LEFT JOIN user_profile up ON up.user_id = u.id
      LEFT JOIN donor_profile dp ON dp.user_id = u.id
      LEFT JOIN donor_details dd ON dd.user_id = u.id
      WHERE COALESCE(up.role, 'receiver') = 'donor'
        AND COALESCE(dd.is_available, 1) = 1
    `;
    const params = [];

    if (normalizedBloodGroup) {
      sql += ' AND u.blood_group = ?';
      params.push(normalizedBloodGroup);
    }
    if (normalizedState) {
      sql += ' AND COALESCE(up.state, "") LIKE ?';
      params.push(`%${normalizedState}%`);
    }
    if (normalizedDistrict) {
      sql += ' AND COALESCE(up.district, "") LIKE ?';
      params.push(`%${normalizedDistrict}%`);
    }
    if (normalizedGender === 'male' || normalizedGender === 'female' || normalizedGender === 'other') {
      sql += ' AND COALESCE(up.gender, "") = ?';
      params.push(normalizedGender);
    }
    if (Number.isFinite(requestedAge) && requestedAge >= 18 && requestedAge <= 100) {
      sql += ' AND up.date_of_birth IS NOT NULL AND TIMESTAMPDIFF(YEAR, up.date_of_birth, CURDATE()) = ?';
      params.push(Math.trunc(requestedAge));
    }

    sql += ' ORDER BY u.created_at DESC LIMIT ?';
    params.push(limit);

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/donors/available - recipient can view matching available donors with details
router.get('/available', requireAuth, async (req, res) => {
  const requestedBloodGroup = String(req.query.blood_group || '').trim().toUpperCase();
  const limit = safeLimit(req.query.limit, 50);

  try {
    const [userRows] = await db.query(
      `SELECT id, blood_group, COALESCE(up.role, 'receiver') AS role
       FROM users u
       LEFT JOIN user_profile up ON up.user_id = u.id
       WHERE u.id = ? LIMIT 1`,
      [req.user.id]
    );

    if (!userRows.length) return res.status(404).json({ error: 'User not found' });

    const currentUser = userRows[0];
    if (currentUser.role !== 'receiver') {
      return res.status(403).json({ error: 'Only receivers can view donor availability list' });
    }

    const bloodGroup = requestedBloodGroup || String(currentUser.blood_group || '').trim().toUpperCase();
    if (!bloodGroup) return res.status(400).json({ error: 'blood_group is required' });

    const [rows] = await db.query(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.blood_group,
         COALESCE(up.phone, dp.contact, '') AS phone,
         COALESCE(up.city, dp.city, '') AS city,
         COALESCE(up.district, '') AS district,
         COALESCE(up.state, '') AS state,
         COALESCE(up.address_line1, '') AS address_line1,
         COALESCE(up.address_line2, '') AS address_line2,
         COALESCE(up.pincode, '') AS pincode,
         COALESCE(dd.is_available, 1) AS is_available,
         dd.last_donation_date,
         dd.weight_kg,
         dd.preferred_donation_center,
         dd.medical_notes
       FROM users u
       LEFT JOIN user_profile up ON up.user_id = u.id
       LEFT JOIN donor_profile dp ON dp.user_id = u.id
       LEFT JOIN donor_details dd ON dd.user_id = u.id
       WHERE u.blood_group = ?
         AND COALESCE(up.role, 'receiver') = 'donor'
         AND COALESCE(dd.is_available, 1) = 1
       ORDER BY u.created_at DESC
       LIMIT ?`,
      [bloodGroup, limit]
    );

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/donors/:id/connect - recipient sends a direct connect request to donor
router.post(
  '/:id/connect',
  requireAuth,
  body('blood_group').optional({ values: 'falsy' }).isString().trim().isLength({ min: 1, max: 5 }),
  body('quantity').optional({ values: 'falsy' }).isInt({ min: 1, max: 20 }),
  body('hospital_name').optional({ values: 'falsy' }).isString().trim().isLength({ max: 150 }),
  body('city').optional({ values: 'falsy' }).isString().trim().isLength({ max: 100 }),
  body('message').optional({ values: 'falsy' }).isString().trim().isLength({ max: 500 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const donorId = Number(req.params.id);
    if (!Number.isInteger(donorId) || donorId <= 0) {
      return res.status(400).json({ error: 'Invalid donor id' });
    }

    try {
      const [senderRows] = await db.query(
        `SELECT u.id, u.name, u.email, u.blood_group, COALESCE(up.role, 'receiver') AS role
         FROM users u
         LEFT JOIN user_profile up ON up.user_id = u.id
         WHERE u.id = ? LIMIT 1`,
        [req.user.id]
      );

      if (!senderRows.length) return res.status(404).json({ error: 'Sender not found' });

      const sender = senderRows[0];
      if (sender.role !== 'receiver') {
        return res.status(403).json({ error: 'Only receivers can send connect requests to donors' });
      }

      const [donorRows] = await db.query(
        `SELECT
           u.id,
           u.name,
           u.email,
           u.blood_group,
           COALESCE(up.role, 'receiver') AS role,
           COALESCE(dd.is_available, 1) AS is_available
         FROM users u
         LEFT JOIN user_profile up ON up.user_id = u.id
         LEFT JOIN donor_details dd ON dd.user_id = u.id
         WHERE u.id = ?
         LIMIT 1`,
        [donorId]
      );

      if (!donorRows.length) return res.status(404).json({ error: 'Donor not found' });

      const donor = donorRows[0];
      if (donor.role !== 'donor') return res.status(400).json({ error: 'Selected user is not a donor' });
      if (!Number(donor.is_available)) return res.status(409).json({ error: 'Selected donor is currently unavailable' });

      await ensureUserMessagesTable();

      const {
        blood_group = null,
        quantity = null,
        hospital_name = null,
        city = null,
        message = ''
      } = req.body;

      const lines = [
        `Receiver ${sender.name} (${sender.email}) wants to connect for blood support.`,
        `Requested blood group: ${blood_group || donor.blood_group || 'Not specified'}`,
        `Required units: ${quantity || 'Not specified'}`,
        `Hospital: ${hospital_name || 'Not specified'}`,
        `City: ${city || 'Not specified'}`,
        `Receiver message: ${message || 'No extra message'}`
      ];

      await db.query(
        `INSERT INTO user_messages (sender_user_id, receiver_user_id, subject, message, message_type)
         VALUES (?, ?, ?, ?, 'request')`,
        [sender.id, donor.id, 'New blood connect request', lines.join('\n')]
      );

      return res.status(201).json({
        message: 'Connect request sent to donor successfully',
        donor: {
          id: donor.id,
          name: donor.name,
          email: donor.email,
          blood_group: donor.blood_group
        }
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

// POST /api/donors/availability - user marks as available donor
router.post('/availability',
  requireAuth,
  body('city').optional().isString(),
  body('contact').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { city, contact } = req.body;
    try {
      await db.query(
        'INSERT INTO donor_profile (user_id, city, contact) VALUES (?,?,?) ON DUPLICATE KEY UPDATE city=VALUES(city), contact=VALUES(contact)',
        [req.user.id, city || null, contact || null]
      );
      res.json({ message: 'Availability updated' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// GET /api/donors/admin/list - admin list with optional filters
router.get('/admin/list', requireAuth, requireAdmin, async (req, res) => {
  const { blood_group, role, city, search } = req.query;
  const limit = safeLimit(req.query.limit, 150);
  try {
    let sql = `
      SELECT
        u.id,
        u.name,
        u.email,
        u.blood_group,
        u.created_at,
        COALESCE(up.role, 'receiver') AS role,
        COALESCE(up.city, dp.city) AS city,
        COALESCE(up.phone, dp.contact) AS phone,
        dd.is_available,
        rd.hospital_name,
        rd.urgency,
        rd.required_units
      FROM users u
      LEFT JOIN user_profile up ON up.user_id = u.id
      LEFT JOIN donor_profile dp ON dp.user_id = u.id
      LEFT JOIN donor_details dd ON dd.user_id = u.id
      LEFT JOIN receiver_details rd ON rd.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (blood_group) {
      sql += ' AND u.blood_group = ?';
      params.push(blood_group);
    }
    if (role) {
      sql += ' AND COALESCE(up.role, ?) = ?';
      params.push('receiver', role);
    }
    if (city) {
      sql += ' AND COALESCE(up.city, dp.city, "") LIKE ?';
      params.push(`%${city}%`);
    }
    if (search) {
      sql += ' AND (u.name LIKE ? OR u.email LIKE ? OR COALESCE(up.phone, dp.contact, "") LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY u.created_at DESC LIMIT ?';
    params.push(limit);

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/donors/admin/receivers - hospital/recipient oriented list
router.get('/admin/receivers', requireAuth, requireAdmin, async (req, res) => {
  const { urgency, search } = req.query;
  const limit = safeLimit(req.query.limit, 150);
  try {
    let sql = `
      SELECT
        u.id,
        u.name,
        u.email,
        u.blood_group,
        COALESCE(up.phone, '') AS phone,
        COALESCE(up.city, '') AS city,
        COALESCE(rd.hospital_name, '') AS hospital_name,
        COALESCE(rd.doctor_name, '') AS doctor_name,
        COALESCE(rd.urgency, 'medium') AS urgency,
        COALESCE(rd.required_units, 1) AS required_units,
        rd.notes,
        u.created_at
      FROM users u
      LEFT JOIN user_profile up ON up.user_id = u.id
      LEFT JOIN receiver_details rd ON rd.user_id = u.id
      WHERE COALESCE(up.role, 'receiver') = 'receiver'
    `;
    const params = [];

    if (urgency) {
      sql += ' AND COALESCE(rd.urgency, "medium") = ?';
      params.push(urgency);
    }
    if (search) {
      sql += ' AND (u.name LIKE ? OR u.email LIKE ? OR COALESCE(rd.hospital_name, "") LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY u.created_at DESC LIMIT ?';
    params.push(limit);

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/donors/admin/summary - live dashboard KPI counts
router.get('/admin/summary', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users) AS total_users,
        (
          SELECT COUNT(*)
          FROM users u
          LEFT JOIN user_profile up ON up.user_id = u.id
          WHERE COALESCE(up.role, 'receiver') = 'donor'
        ) AS total_donors,
        (
          SELECT COUNT(*)
          FROM users u
          LEFT JOIN user_profile up ON up.user_id = u.id
          LEFT JOIN donor_details dd ON dd.user_id = u.id
          WHERE COALESCE(up.role, 'receiver') = 'donor'
            AND COALESCE(dd.is_available, 1) = 1
        ) AS active_donors,
        (SELECT COUNT(*) FROM requests WHERE status = 'Pending') AS pending_requests,
        (
          SELECT COUNT(*)
          FROM users u
          LEFT JOIN user_profile up ON up.user_id = u.id
          WHERE COALESCE(up.role, 'receiver') = 'receiver'
        ) AS recipients,
        (SELECT COUNT(*) FROM appointments) AS appointments,
        (SELECT COUNT(*) FROM contact_messages) AS contact_messages
    `);

    return res.json(rows[0] || {
      total_users: 0,
      total_donors: 0,
      active_donors: 0,
      pending_requests: 0,
      recipients: 0,
      appointments: 0,
      contact_messages: 0
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/donors/admin - create donor/receiver user and profile
router.post(
  '/admin',
  requireAuth,
  requireAdmin,
  body('name').isString().trim().isLength({ min: 2, max: 100 }),
  body('email').isEmail(),
  body('password').isString().isLength({ min: 6 }),
  body('blood_group').isString().trim().isLength({ min: 1, max: 5 }),
  body('role').optional().isIn(['donor', 'receiver']),
  body('phone').optional({ values: 'falsy' }).isString().trim().isLength({ max: 20 }),
  body('city').optional({ values: 'falsy' }).isString().trim().isLength({ max: 100 }),
  body('hospital_name').optional({ values: 'falsy' }).isString().trim().isLength({ max: 150 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
      name,
      email,
      password,
      blood_group,
      role = 'donor',
      phone = null,
      city = null,
      hospital_name = null,
      urgency = 'medium',
      required_units = 1
    } = req.body;

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length) {
        await conn.rollback();
        return res.status(409).json({ error: 'Email already in use' });
      }

      const hashed = await bcrypt.hash(password, 10);
      const [insertUser] = await conn.query(
        'INSERT INTO users (name, email, password, blood_group) VALUES (?,?,?,?)',
        [name, email, hashed, blood_group]
      );

      const userId = insertUser.insertId;

      await conn.query(
        `INSERT INTO user_profile (user_id, role, phone, city, profile_completed)
         VALUES (?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE role=VALUES(role), phone=VALUES(phone), city=VALUES(city), profile_completed=1`,
        [userId, role, phone, city]
      );

      if (role === 'donor') {
        await conn.query(
          `INSERT INTO donor_details (user_id, is_available)
           VALUES (?, 1)
           ON DUPLICATE KEY UPDATE is_available=1`,
          [userId]
        );
      } else {
        await conn.query(
          `INSERT INTO receiver_details (user_id, hospital_name, urgency, required_units)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE hospital_name=VALUES(hospital_name), urgency=VALUES(urgency), required_units=VALUES(required_units)`,
          [userId, hospital_name, urgency, required_units]
        );
      }

      await conn.commit();
      return res.status(201).json({ message: 'Record created successfully', id: userId });
    } catch (e) {
      await conn.rollback();
      console.error(e);
      return res.status(500).json({ error: 'Server error' });
    } finally {
      conn.release();
    }
  }
);

// PUT /api/donors/admin/:id - update donor/receiver summary details
router.put(
  '/admin/:id',
  requireAuth,
  requireAdmin,
  body('name').optional().isString().trim().isLength({ min: 2, max: 100 }),
  body('blood_group').optional().isString().trim().isLength({ min: 1, max: 5 }),
  body('role').optional().isIn(['donor', 'receiver']),
  body('phone').optional({ values: 'falsy' }).isString().trim().isLength({ max: 20 }),
  body('city').optional({ values: 'falsy' }).isString().trim().isLength({ max: 100 }),
  body('is_available').optional().isBoolean(),
  body('hospital_name').optional({ values: 'falsy' }).isString().trim().isLength({ max: 150 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) return res.status(400).json({ error: 'Invalid id' });

    const {
      name,
      blood_group,
      role,
      phone,
      city,
      is_available,
      hospital_name,
      urgency,
      required_units
    } = req.body;

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [existingUser] = await conn.query('SELECT id FROM users WHERE id = ? LIMIT 1', [userId]);
      if (!existingUser.length) {
        await conn.rollback();
        return res.status(404).json({ error: 'User not found' });
      }

      const userUpdates = [];
      const userParams = [];
      if (typeof name !== 'undefined') {
        userUpdates.push('name = ?');
        userParams.push(name);
      }
      if (typeof blood_group !== 'undefined') {
        userUpdates.push('blood_group = ?');
        userParams.push(blood_group);
      }
      if (userUpdates.length) {
        userParams.push(userId);
        await conn.query(`UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`, userParams);
      }

      if (typeof role !== 'undefined' || typeof phone !== 'undefined' || typeof city !== 'undefined') {
        await conn.query(
          `INSERT INTO user_profile (user_id, role, phone, city, profile_completed)
           VALUES (?, ?, ?, ?, 1)
           ON DUPLICATE KEY UPDATE
             role = COALESCE(VALUES(role), role),
             phone = COALESCE(VALUES(phone), phone),
             city = COALESCE(VALUES(city), city),
             profile_completed = 1`,
          [userId, role || null, phone || null, city || null]
        );
      }

      if (typeof is_available !== 'undefined') {
        await conn.query(
          `INSERT INTO donor_details (user_id, is_available)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE is_available = VALUES(is_available)`,
          [userId, is_available ? 1 : 0]
        );
      }

      if (
        typeof hospital_name !== 'undefined' ||
        typeof urgency !== 'undefined' ||
        typeof required_units !== 'undefined'
      ) {
        await conn.query(
          `INSERT INTO receiver_details (user_id, hospital_name, urgency, required_units)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             hospital_name = COALESCE(VALUES(hospital_name), hospital_name),
             urgency = COALESCE(VALUES(urgency), urgency),
             required_units = COALESCE(VALUES(required_units), required_units)`,
          [userId, hospital_name || null, urgency || null, required_units || null]
        );
      }

      await conn.commit();
      return res.json({ message: 'Record updated successfully' });
    } catch (e) {
      await conn.rollback();
      console.error(e);
      return res.status(500).json({ error: 'Server error' });
    } finally {
      conn.release();
    }
  }
);

// DELETE /api/donors/admin/:id - delete user record
router.delete('/admin/:id', requireAuth, requireAdmin, async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) return res.status(400).json({ error: 'Invalid id' });

  try {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [userId]);
    if (!result.affectedRows) return res.status(404).json({ error: 'User not found' });
    return res.json({ message: 'Record deleted successfully' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
