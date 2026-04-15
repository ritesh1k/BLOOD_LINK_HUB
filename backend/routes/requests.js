import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { sendSmsNotification } from '../services/notification-service.js';

const router = Router();

let requestColumnsEnsured = false;

function safeLimit(value, fallback = 100) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, 500);
}

async function ensureRequestColumns() {
  if (requestColumnsEnsured) return;

  const [existingCols] = await db.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'requests'`
  );

  const existingSet = new Set(existingCols.map((row) => row.COLUMN_NAME));
  const requiredColumns = [
    ['patient_name', 'VARCHAR(120) NULL'],
    ['patient_age', 'INT NULL'],
    ['patient_gender', "ENUM('male','female','other') NULL"],
    ['hospital_name', 'VARCHAR(150) NULL'],
    ['doctor_name', 'VARCHAR(120) NULL'],
    ['address_line1', 'VARCHAR(255) NULL'],
    ['address_line2', 'VARCHAR(255) NULL'],
    ['city', 'VARCHAR(100) NULL'],
    ['district', 'VARCHAR(100) NULL'],
    ['state', 'VARCHAR(100) NULL'],
    ['pincode', 'VARCHAR(12) NULL'],
    ['contact_name', 'VARCHAR(120) NULL'],
    ['contact_phone', 'VARCHAR(20) NULL'],
    ['alternate_contact_phone', 'VARCHAR(20) NULL'],
    ['medical_condition', 'VARCHAR(255) NULL'],
    ['health_notes', 'TEXT NULL'],
    ['required_by_date', 'DATE NULL'],
    ['accepted_donor_id', 'INT NULL'],
    ['accepted_at', 'TIMESTAMP NULL']
  ];

  for (const [columnName, columnDef] of requiredColumns) {
    if (!existingSet.has(columnName)) {
      await db.query(`ALTER TABLE requests ADD COLUMN ${columnName} ${columnDef}`);
    }
  }

  requestColumnsEnsured = true;
}

async function getLoggedInUser(userId) {
  const [rows] = await db.query(
    `SELECT u.id, u.name, u.email, u.blood_group, COALESCE(up.role, 'receiver') AS role
     FROM users u
     LEFT JOIN user_profile up ON up.user_id = u.id
     WHERE u.id = ? LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

async function ensureUserRole(userId, expectedRole) {
  const user = await getLoggedInUser(userId);
  if (!user) {
    return { ok: false, status: 404, error: 'User not found' };
  }
  if (user.role !== expectedRole) {
    return { ok: false, status: 403, error: `Only ${expectedRole}s can access this resource` };
  }
  return { ok: true, user };
}

function buildEmergencySmsMessage({
  bloodGroup,
  quantity,
  receiverName,
  city,
  hospitalName,
  contactPhone,
  requestId
}) {
  const locationBits = [hospitalName, city].filter(Boolean).join(', ');
  const locationText = locationBits || 'location not specified';
  const contactText = contactPhone || 'not provided';

  return [
    'BloodLink Hub Emergency Request',
    `${quantity} unit(s) of ${bloodGroup} needed.`,
    `Requester: ${receiverName || 'Receiver'}`,
    `Location: ${locationText}`,
    `Contact: ${contactText}`,
    `Request ID: #${requestId}`
  ].join(' ');
}

// POST /api/requests - create a blood request
router.post('/',
  requireAuth,
  body('blood_group').isString().isLength({ min: 1, max: 5 }),
  body('quantity').isInt({ min: 1 }),
  body('patient_name').optional({ values: 'falsy' }).isString().trim().isLength({ min: 2, max: 120 }),
  body('patient_age').optional({ values: 'falsy' }).isInt({ min: 0, max: 120 }),
  body('patient_gender').optional({ values: 'falsy' }).isIn(['male', 'female', 'other']),
  body('hospital_name').optional({ values: 'falsy' }).isString().trim().isLength({ max: 150 }),
  body('doctor_name').optional({ values: 'falsy' }).isString().trim().isLength({ max: 120 }),
  body('address_line1').optional({ values: 'falsy' }).isString().trim().isLength({ max: 255 }),
  body('address_line2').optional({ values: 'falsy' }).isString().trim().isLength({ max: 255 }),
  body('city').optional({ values: 'falsy' }).isString().trim().isLength({ max: 100 }),
  body('district').optional({ values: 'falsy' }).isString().trim().isLength({ max: 100 }),
  body('state').optional({ values: 'falsy' }).isString().trim().isLength({ max: 100 }),
  body('pincode').optional({ values: 'falsy' }).isString().trim().isLength({ max: 12 }),
  body('contact_name').optional({ values: 'falsy' }).isString().trim().isLength({ max: 120 }),
  body('contact_phone').optional({ values: 'falsy' }).isString().trim().isLength({ min: 7, max: 20 }),
  body('alternate_contact_phone').optional({ values: 'falsy' }).isString().trim().isLength({ min: 7, max: 20 }),
  body('medical_condition').optional({ values: 'falsy' }).isString().trim().isLength({ max: 255 }),
  body('health_notes').optional({ values: 'falsy' }).isString().trim().isLength({ max: 2000 }),
  body('required_by_date').optional({ values: 'falsy' }).isISO8601(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
      blood_group,
      quantity,
      patient_name,
      patient_age,
      patient_gender,
      hospital_name,
      doctor_name,
      address_line1,
      address_line2,
      city,
      district,
      state,
      pincode,
      contact_name,
      contact_phone,
      alternate_contact_phone,
      medical_condition,
      health_notes,
      required_by_date
    } = req.body;

    try {
      const roleCheck = await ensureUserRole(req.user.id, 'receiver');
      if (!roleCheck.ok) return res.status(roleCheck.status).json({ error: roleCheck.error });

      await ensureRequestColumns();
      const [insertResult] = await db.query(
        `INSERT INTO requests
          (user_id, blood_group, quantity, status, patient_name, patient_age, patient_gender, hospital_name, doctor_name,
           address_line1, address_line2, city, district, state, pincode, contact_name, contact_phone,
           alternate_contact_phone, medical_condition, health_notes, required_by_date)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          req.user.id,
          blood_group,
          quantity,
          'Pending',
          patient_name || null,
          patient_age || null,
          patient_gender || null,
          hospital_name || null,
          doctor_name || null,
          address_line1 || null,
          address_line2 || null,
          city || null,
          district || null,
          state || null,
          pincode || null,
          contact_name || null,
          contact_phone || null,
          alternate_contact_phone || null,
          medical_condition || null,
          health_notes || null,
          required_by_date || null
        ]
      );

      const requestId = insertResult.insertId;

      const notification = {
        matched_donors: 0,
        targeted_numbers: 0,
        sms_sent: 0,
        sms_failed: 0,
        sms_skipped: 0,
        warning: null
      };

      try {
        const [donorRows] = await db.query(
          `SELECT
             u.id,
             u.name,
             COALESCE(up.phone, dp.contact, '') AS phone
           FROM users u
           LEFT JOIN user_profile up ON up.user_id = u.id
           LEFT JOIN donor_profile dp ON dp.user_id = u.id
           LEFT JOIN donor_details dd ON dd.user_id = u.id
           WHERE u.blood_group = ?
             AND COALESCE(up.role, 'receiver') = 'donor'
             AND COALESCE(dd.is_available, 1) = 1`,
          [blood_group]
        );

        const smsText = buildEmergencySmsMessage({
          bloodGroup: blood_group,
          quantity,
          receiverName: roleCheck.user?.name,
          city,
          hospitalName: hospital_name,
          contactPhone: contact_phone,
          requestId
        });

        const uniqueDonorsByPhone = new Map();
        for (const donor of donorRows) {
          const phone = String(donor.phone || '').trim();
          if (!phone) continue;
          if (!uniqueDonorsByPhone.has(phone)) {
            uniqueDonorsByPhone.set(phone, donor);
          }
        }

        notification.matched_donors = donorRows.length;
        notification.targeted_numbers = uniqueDonorsByPhone.size;

        const smsResults = await Promise.allSettled(
          [...uniqueDonorsByPhone.values()].map((donor) =>
            sendSmsNotification({
              userId: donor.id,
              relatedEntityType: 'appointment',
              relatedEntityId: requestId,
              to: donor.phone,
              templateKey: 'emergency_request_match',
              text: smsText
            })
          )
        );

        for (const result of smsResults) {
          if (result.status !== 'fulfilled') {
            notification.sms_failed += 1;
            continue;
          }

          const smsStatus = result.value?.status;
          if (smsStatus === 'sent') notification.sms_sent += 1;
          else if (smsStatus === 'skipped') notification.sms_skipped += 1;
          else notification.sms_failed += 1;
        }
      } catch (notifyError) {
        console.error('Failed to dispatch donor notifications:', notifyError);
        notification.warning = 'Request created, but donor notifications could not be processed';
      }

      res.status(201).json({ message: 'Request created', request_id: requestId, notification });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// GET /api/requests/my - get requests of logged-in user
router.get('/my', requireAuth, async (req, res) => {
  try {
    const roleCheck = await ensureUserRole(req.user.id, 'receiver');
    if (!roleCheck.ok) return res.status(roleCheck.status).json({ error: roleCheck.error });

    await ensureRequestColumns();
    const [rows] = await db.query(
      `SELECT
         r.*,
         d.name AS accepted_donor_name,
         d.email AS accepted_donor_email,
         dp.phone AS accepted_donor_phone
       FROM requests r
       LEFT JOIN users d ON d.id = r.accepted_donor_id
       LEFT JOIN user_profile dp ON dp.user_id = d.id
       WHERE r.user_id = ?
       ORDER BY r.request_date DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/requests/donor/list - donor list of matching requests
router.get('/donor/list', requireAuth, async (req, res) => {
  try {
    await ensureRequestColumns();
    const roleCheck = await ensureUserRole(req.user.id, 'donor');
    if (!roleCheck.ok) return res.status(roleCheck.status).json({ error: roleCheck.error });
    const donor = roleCheck.user;

    const [rows] = await db.query(
      `SELECT
         r.id,
         r.user_id,
         r.blood_group,
         r.quantity,
         r.status,
         r.request_date,
         r.patient_name,
         r.patient_age,
         r.patient_gender,
         r.hospital_name,
         r.doctor_name,
         r.city,
         r.district,
         r.state,
         r.required_by_date,
         r.medical_condition,
         r.health_notes,
         r.accepted_donor_id,
         r.accepted_at,
         u.name AS receiver_name,
         u.email AS receiver_email,
         CASE WHEN r.accepted_donor_id = ? THEN r.address_line1 ELSE NULL END AS address_line1,
         CASE WHEN r.accepted_donor_id = ? THEN r.address_line2 ELSE NULL END AS address_line2,
         CASE WHEN r.accepted_donor_id = ? THEN r.pincode ELSE NULL END AS pincode,
         CASE WHEN r.accepted_donor_id = ? THEN r.contact_name ELSE NULL END AS contact_name,
         CASE WHEN r.accepted_donor_id = ? THEN r.contact_phone ELSE NULL END AS contact_phone,
         CASE WHEN r.accepted_donor_id = ? THEN r.alternate_contact_phone ELSE NULL END AS alternate_contact_phone
       FROM requests r
       JOIN users u ON u.id = r.user_id
       WHERE r.blood_group = ?
         AND r.status = 'Pending'
         AND (r.accepted_donor_id IS NULL OR r.accepted_donor_id = ?)
       ORDER BY r.request_date DESC`,
      [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, donor.blood_group, req.user.id]
    );

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/requests/:id/accept - donor accepts a request
router.put('/:id/accept', requireAuth, async (req, res) => {
  const requestId = Number(req.params.id);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return res.status(400).json({ error: 'Invalid request id' });
  }

  const conn = await db.getConnection();
  let inTransaction = false;
  try {
    await ensureRequestColumns();
    const roleCheck = await ensureUserRole(req.user.id, 'donor');
    if (!roleCheck.ok) return res.status(roleCheck.status).json({ error: roleCheck.error });
    const donor = roleCheck.user;

    await conn.beginTransaction();
    inTransaction = true;

    const [requestRows] = await conn.query(
      `SELECT id, blood_group, status, accepted_donor_id
       FROM requests
       WHERE id = ?
       FOR UPDATE`,
      [requestId]
    );

    if (!requestRows.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Request not found' });
    }

    const selectedRequest = requestRows[0];

    if (selectedRequest.status !== 'Pending') {
      await conn.rollback();
      return res.status(400).json({ error: 'Only pending requests can be accepted' });
    }

    if (selectedRequest.blood_group !== donor.blood_group) {
      await conn.rollback();
      return res.status(403).json({ error: 'You can only accept requests matching your blood group' });
    }

    if (selectedRequest.accepted_donor_id && Number(selectedRequest.accepted_donor_id) !== req.user.id) {
      await conn.rollback();
      return res.status(409).json({ error: 'Request already accepted by another donor' });
    }

    await conn.query(
      'UPDATE requests SET accepted_donor_id = ?, accepted_at = CURRENT_TIMESTAMP WHERE id = ?',
      [req.user.id, requestId]
    );

    await conn.commit();
    inTransaction = false;
    return res.json({ message: 'Request accepted successfully' });
  } catch (e) {
    if (inTransaction) await conn.rollback();
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
});

// GET /api/requests/admin/list - list all requests with user details
router.get('/admin/list', requireAuth, requireAdmin, async (req, res) => {
  const { status, blood_group, search } = req.query;
  const limit = safeLimit(req.query.limit, 150);
  try {
    await ensureRequestColumns();
    let sql = `
      SELECT
        r.id,
        r.user_id,
        r.blood_group,
        r.quantity,
        r.status,
        r.request_date,
        r.patient_name,
        r.hospital_name,
        r.city,
        r.state,
        r.contact_phone,
        r.accepted_donor_id,
        r.accepted_at,
        u.name AS requester_name,
        u.email AS requester_email,
        up.phone AS requester_phone,
        rd.urgency,
        ad.name AS donor_name,
        ad.email AS donor_email
      FROM requests r
      JOIN users u ON u.id = r.user_id
      LEFT JOIN user_profile up ON up.user_id = u.id
      LEFT JOIN receiver_details rd ON rd.user_id = u.id
      LEFT JOIN users ad ON ad.id = r.accepted_donor_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND r.status = ?';
      params.push(status);
    }
    if (blood_group) {
      sql += ' AND r.blood_group = ?';
      params.push(blood_group);
    }
    if (search) {
      sql += ' AND (u.name LIKE ? OR u.email LIKE ? OR COALESCE(rd.hospital_name, "") LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY r.request_date DESC LIMIT ?';
    params.push(limit);

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/requests/admin/:id/status - update request status
router.put(
  '/admin/:id/status',
  requireAuth,
  requireAdmin,
  body('status').isIn(['Pending', 'Completed', 'Cancelled']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });

    try {
      const [result] = await db.query('UPDATE requests SET status = ? WHERE id = ?', [req.body.status, id]);
      if (!result.affectedRows) return res.status(404).json({ error: 'Request not found' });
      return res.json({ message: 'Request status updated' });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

// DELETE /api/requests/admin/:id - delete request
router.delete('/admin/:id', requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });

  try {
    const [result] = await db.query('DELETE FROM requests WHERE id = ?', [id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Request not found' });
    return res.json({ message: 'Request deleted' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
