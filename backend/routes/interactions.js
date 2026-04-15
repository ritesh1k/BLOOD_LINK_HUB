import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { listNotificationLogs, sendEmailNotification, sendSmsNotification } from '../services/notification-service.js';

const router = Router();
let appointmentNotificationColumnsEnsured = false;

function safeLimit(value, fallback = 100) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, 500);
}

async function ensureAppointmentNotificationColumns() {
  if (appointmentNotificationColumnsEnsured) return;

  const [existingCols] = await db.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appointments'`
  );

  const existingSet = new Set(existingCols.map((row) => row.COLUMN_NAME));
  const requiredColumns = [
    ['sms_delivery_status', "ENUM('pending','sent','failed','skipped') NOT NULL DEFAULT 'pending'"],
    ['sms_error', 'VARCHAR(255) NULL'],
    ['sms_provider_message_id', 'VARCHAR(140) NULL'],
    ['email_delivery_status', "ENUM('pending','sent','failed','skipped') NOT NULL DEFAULT 'pending'"],
    ['email_error', 'VARCHAR(255) NULL'],
    ['email_provider_message_id', 'VARCHAR(140) NULL']
  ];

  for (const [columnName, columnDef] of requiredColumns) {
    if (!existingSet.has(columnName)) {
      await db.query(`ALTER TABLE appointments ADD COLUMN ${columnName} ${columnDef}`);
    }
  }

  appointmentNotificationColumnsEnsured = true;
}

// POST /api/interactions/appointments
router.post(
  '/appointments',
  body('full_name').isString().trim().isLength({ min: 2, max: 120 }),
  body('email').isEmail(),
  body('phone').isString().trim().isLength({ min: 7, max: 20 }),
  body('appointment_date').isISO8601(),
  body('appointment_time').matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/),
  body('purpose').optional().isIn(['donation', 'consultation', 'screening', 'other']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
      user_id = null,
      full_name,
      email,
      phone,
      appointment_date,
      appointment_time,
      purpose = 'donation'
    } = req.body;

    try {
      await ensureAppointmentNotificationColumns();

      const [insertResult] = await db.query(
        `INSERT INTO appointments
          (user_id, full_name, email, phone, appointment_date, appointment_time, purpose, status, sms_delivery_status, email_delivery_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'booked', 'pending', 'pending')`,
        [user_id, full_name, email, phone, appointment_date, appointment_time, purpose]
      );

      const appointmentId = insertResult.insertId;
      const formattedDate = new Date(appointment_date).toLocaleDateString('en-GB');
      const smsMessage = `BloodLink Hub: Appointment confirmed for ${full_name} on ${formattedDate} at ${appointment_time}. Purpose: ${purpose}.`;
      const emailSubject = 'BloodLink Hub appointment confirmation';
      const emailText = [
        `Hello ${full_name},`,
        '',
        'Your appointment has been booked successfully.',
        `Date: ${formattedDate}`,
        `Time: ${appointment_time}`,
        `Purpose: ${purpose}`,
        '',
        'Thank you for supporting BloodLink Hub.'
      ].join('\n');

      const [smsResult, emailResult] = await Promise.all([
        sendSmsNotification({
          userId: user_id || null,
          relatedEntityType: 'appointment',
          relatedEntityId: appointmentId,
          to: phone,
          templateKey: 'appointment_booking_confirmation',
          text: smsMessage
        }),
        sendEmailNotification({
          userId: user_id || null,
          relatedEntityType: 'appointment',
          relatedEntityId: appointmentId,
          to: email,
          templateKey: 'appointment_booking_confirmation',
          subject: emailSubject,
          text: emailText,
          html: `
            <p>Hello ${full_name},</p>
            <p>Your appointment has been booked successfully.</p>
            <ul>
              <li><strong>Date:</strong> ${formattedDate}</li>
              <li><strong>Time:</strong> ${appointment_time}</li>
              <li><strong>Purpose:</strong> ${purpose}</li>
            </ul>
            <p>Thank you for supporting BloodLink Hub.</p>
          `
        })
      ]);

      await db.query(
        `UPDATE appointments
         SET sms_delivery_status = ?,
             sms_error = ?,
             sms_provider_message_id = ?,
             email_delivery_status = ?,
             email_error = ?,
             email_provider_message_id = ?
         WHERE id = ?`,
        [
          smsResult.status,
          smsResult.error ? String(smsResult.error).slice(0, 255) : null,
          smsResult.providerMessageId || null,
          emailResult.status,
          emailResult.error ? String(emailResult.error).slice(0, 255) : null,
          emailResult.providerMessageId || null,
          appointmentId
        ]
      );

      res.status(201).json({
        message: 'Appointment booked successfully',
        appointment_id: appointmentId,
        sms_status: smsResult.status,
        email_status: emailResult.status
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// POST /api/interactions/contact
router.post(
  '/contact',
  body('name').isString().trim().isLength({ min: 2, max: 120 }),
  body('email').isEmail(),
  body('subject').isString().trim().isLength({ min: 2, max: 180 }),
  body('message').isString().trim().isLength({ min: 5 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { user_id = null, name, email, subject, message } = req.body;

    try {
      await db.query(
        `INSERT INTO contact_messages (user_id, name, email, subject, message, status)
         VALUES (?, ?, ?, ?, ?, 'new')`,
        [user_id, name, email, subject, message]
      );
      res.status(201).json({ message: 'Message sent successfully' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// POST /api/interactions/newsletter
router.post(
  '/newsletter',
  body('email').isEmail(),
  body('full_name').optional().isString().trim().isLength({ min: 1, max: 120 }),
  body('source_page').optional().isString().trim().isLength({ min: 1, max: 100 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, full_name = null, source_page = null } = req.body;

    try {
      await db.query(
        `INSERT INTO newsletter_subscriptions (email, full_name, source_page, is_active)
         VALUES (?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           full_name = VALUES(full_name),
           source_page = VALUES(source_page),
           is_active = 1,
           unsubscribed_at = NULL`,
        [email, full_name, source_page]
      );
      res.status(201).json({ message: 'Subscribed successfully' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// GET /api/interactions/admin/appointments
router.get('/admin/appointments', requireAuth, requireAdmin, async (req, res) => {
  const { status, from_date, to_date } = req.query;
  const limit = safeLimit(req.query.limit, 100);

  try {
    await ensureAppointmentNotificationColumns();
    let sql = `SELECT id, user_id, full_name, email, phone, appointment_date, appointment_time, purpose, status,
              sms_delivery_status, sms_error, email_delivery_status, email_error, created_at
               FROM appointments WHERE 1=1`;
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (from_date) {
      sql += ' AND appointment_date >= ?';
      params.push(from_date);
    }
    if (to_date) {
      sql += ' AND appointment_date <= ?';
      params.push(to_date);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/interactions/admin/appointments/:id/status
router.put(
  '/admin/appointments/:id/status',
  requireAuth,
  requireAdmin,
  body('status').isIn(['booked', 'confirmed', 'completed', 'cancelled']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });

    try {
      const [result] = await db.query('UPDATE appointments SET status = ? WHERE id = ?', [req.body.status, id]);
      if (!result.affectedRows) return res.status(404).json({ error: 'Appointment not found' });
      return res.json({ message: 'Appointment status updated' });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

// GET /api/interactions/admin/contact-messages
router.get('/admin/contact-messages', requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.query;
  const limit = safeLimit(req.query.limit, 100);

  try {
    let sql = `SELECT id, user_id, name, email, subject, message, status, replied_at, created_at
               FROM contact_messages WHERE 1=1`;
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/interactions/admin/contact-messages/:id/status
router.put(
  '/admin/contact-messages/:id/status',
  requireAuth,
  requireAdmin,
  body('status').isIn(['new', 'in_progress', 'resolved', 'closed']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });

    const status = req.body.status;
    const shouldSetRepliedAt = status === 'resolved' || status === 'closed';

    try {
      const [result] = await db.query(
        `UPDATE contact_messages
         SET status = ?, replied_at = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE replied_at END
         WHERE id = ?`,
        [status, shouldSetRepliedAt ? 1 : 0, id]
      );

      if (!result.affectedRows) return res.status(404).json({ error: 'Message not found' });
      return res.json({ message: 'Message status updated' });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

// GET /api/interactions/admin/newsletter-subscriptions
router.get('/admin/newsletter-subscriptions', requireAuth, requireAdmin, async (req, res) => {
  const { is_active } = req.query;
  const limit = safeLimit(req.query.limit, 200);

  try {
    let sql = `SELECT id, email, full_name, source_page, is_active, subscribed_at, unsubscribed_at
               FROM newsletter_subscriptions WHERE 1=1`;
    const params = [];

    if (typeof is_active !== 'undefined') {
      sql += ' AND is_active = ?';
      params.push(is_active === '1' ? 1 : 0);
    }

    sql += ' ORDER BY subscribed_at DESC LIMIT ?';
    params.push(limit);

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/interactions/admin/notification-logs
router.get('/admin/notification-logs', requireAuth, requireAdmin, async (req, res) => {
  const limit = safeLimit(req.query.limit, 100);

  try {
    const rows = await listNotificationLogs({
      channel: req.query.channel,
      deliveryStatus: req.query.delivery_status,
      relatedEntityType: req.query.related_entity_type,
      limit
    });

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
