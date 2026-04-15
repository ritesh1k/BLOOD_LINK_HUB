import nodemailer from 'nodemailer';
import twilio from 'twilio';
import db from '../db.js';

const {
  NODE_ENV,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  NOTIFICATIONS_MOCK,
  SMS_PROVIDER,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_FROM_NUMBER
} = process.env;

let notificationLogsTableEnsured = false;
let transporter = null;
let twilioClient = null;

function getBoolean(value) {
  return String(value || '').toLowerCase() === 'true';
}

function isMockNotificationsEnabled() {
  const explicit = String(NOTIFICATIONS_MOCK || '').toLowerCase();
  if (explicit === 'true') return true;
  if (explicit === 'false') return false;
  return String(NODE_ENV || '').toLowerCase() !== 'production';
}

function hasSmtpConfig() {
  return Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && SMTP_FROM);
}

function hasTwilioConfig() {
  return (
    String(SMS_PROVIDER || '').toLowerCase() === 'twilio' &&
    TWILIO_ACCOUNT_SID &&
    TWILIO_AUTH_TOKEN &&
    TWILIO_FROM_NUMBER
  );
}

function getTransporter() {
  if (!hasSmtpConfig() && !isMockNotificationsEnabled()) return null;
  if (transporter) return transporter;

  if (hasSmtpConfig()) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: getBoolean(SMTP_SECURE),
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
  } else {
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }

  return transporter;
}

function getTwilioClient() {
  if (!hasTwilioConfig()) return null;
  if (twilioClient) return twilioClient;

  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  return twilioClient;
}

async function ensureNotificationLogsTable() {
  if (notificationLogsTableEnsured) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS notification_logs (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      related_entity_type ENUM('password_reset','appointment') NOT NULL,
      related_entity_id BIGINT NULL,
      channel ENUM('email','sms') NOT NULL,
      recipient VARCHAR(180) NOT NULL,
      template_key VARCHAR(80) NOT NULL,
      subject VARCHAR(180) NULL,
      message_preview VARCHAR(255) NULL,
      provider VARCHAR(40) NULL,
      provider_message_id VARCHAR(140) NULL,
      delivery_status ENUM('sent','failed','skipped') NOT NULL,
      error_message VARCHAR(500) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_notification_logs_entity (related_entity_type, related_entity_id),
      INDEX idx_notification_logs_status (delivery_status),
      INDEX idx_notification_logs_created_at (created_at),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  notificationLogsTableEnsured = true;
}

async function logNotificationAttempt(payload) {
  await ensureNotificationLogsTable();

  const {
    userId = null,
    relatedEntityType,
    relatedEntityId = null,
    channel,
    recipient,
    templateKey,
    subject = null,
    messagePreview = null,
    provider = null,
    providerMessageId = null,
    deliveryStatus,
    errorMessage = null
  } = payload;

  await db.query(
    `INSERT INTO notification_logs
      (user_id, related_entity_type, related_entity_id, channel, recipient, template_key, subject, message_preview,
       provider, provider_message_id, delivery_status, error_message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      relatedEntityType,
      relatedEntityId,
      channel,
      recipient,
      templateKey,
      subject,
      messagePreview,
      provider,
      providerMessageId,
      deliveryStatus,
      errorMessage
    ]
  );
}

function asPreview(text, max = 255) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export async function sendEmailNotification({
  userId = null,
  relatedEntityType,
  relatedEntityId = null,
  to,
  templateKey,
  subject,
  text,
  html
}) {
  const provider = hasSmtpConfig() ? 'smtp' : 'mock';
  const recipient = String(to || '').trim();

  if (!recipient) {
    return { ok: false, status: 'failed', error: 'Missing recipient email' };
  }

  const mailTransporter = getTransporter();
  if (!mailTransporter) {
    await logNotificationAttempt({
      userId,
      relatedEntityType,
      relatedEntityId,
      channel: 'email',
      recipient,
      templateKey,
      subject,
      messagePreview: asPreview(text || subject),
      provider,
      deliveryStatus: 'skipped',
      errorMessage: 'SMTP not configured'
    });

    return { ok: false, status: 'skipped', error: 'SMTP not configured' };
  }

  try {
    const info = await mailTransporter.sendMail({
      from: SMTP_FROM,
      to: recipient,
      subject,
      text,
      html
    });

    await logNotificationAttempt({
      userId,
      relatedEntityType,
      relatedEntityId,
      channel: 'email',
      recipient,
      templateKey,
      subject,
      messagePreview: asPreview(text || subject),
      provider,
      providerMessageId: info?.messageId || null,
      deliveryStatus: 'sent'
    });

    return { ok: true, status: 'sent', providerMessageId: info?.messageId || null };
  } catch (error) {
    await logNotificationAttempt({
      userId,
      relatedEntityType,
      relatedEntityId,
      channel: 'email',
      recipient,
      templateKey,
      subject,
      messagePreview: asPreview(text || subject),
      provider,
      deliveryStatus: 'failed',
      errorMessage: String(error?.message || 'Email send failed').slice(0, 500)
    });

    return { ok: false, status: 'failed', error: error?.message || 'Email send failed' };
  }
}

export async function sendSmsNotification({
  userId = null,
  relatedEntityType,
  relatedEntityId = null,
  to,
  templateKey,
  text
}) {
  const provider = String(SMS_PROVIDER || '').toLowerCase() || 'none';
  const recipient = String(to || '').trim();

  if (!recipient) {
    return { ok: false, status: 'failed', error: 'Missing recipient phone' };
  }

  const client = getTwilioClient();
  if (!client) {
    if (isMockNotificationsEnabled()) {
      const fakeId = `mock-sms-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      await logNotificationAttempt({
        userId,
        relatedEntityType,
        relatedEntityId,
        channel: 'sms',
        recipient,
        templateKey,
        subject: null,
        messagePreview: asPreview(text),
        provider: 'mock',
        providerMessageId: fakeId,
        deliveryStatus: 'sent'
      });

      return { ok: true, status: 'sent', providerMessageId: fakeId };
    }

    await logNotificationAttempt({
      userId,
      relatedEntityType,
      relatedEntityId,
      channel: 'sms',
      recipient,
      templateKey,
      subject: null,
      messagePreview: asPreview(text),
      provider,
      deliveryStatus: 'skipped',
      errorMessage: 'SMS provider not configured'
    });

    return { ok: false, status: 'skipped', error: 'SMS provider not configured' };
  }

  try {
    const message = await client.messages.create({
      body: text,
      from: TWILIO_FROM_NUMBER,
      to: recipient
    });

    await logNotificationAttempt({
      userId,
      relatedEntityType,
      relatedEntityId,
      channel: 'sms',
      recipient,
      templateKey,
      subject: null,
      messagePreview: asPreview(text),
      provider,
      providerMessageId: message?.sid || null,
      deliveryStatus: 'sent'
    });

    return { ok: true, status: 'sent', providerMessageId: message?.sid || null };
  } catch (error) {
    await logNotificationAttempt({
      userId,
      relatedEntityType,
      relatedEntityId,
      channel: 'sms',
      recipient,
      templateKey,
      subject: null,
      messagePreview: asPreview(text),
      provider,
      deliveryStatus: 'failed',
      errorMessage: String(error?.message || 'SMS send failed').slice(0, 500)
    });

    return { ok: false, status: 'failed', error: error?.message || 'SMS send failed' };
  }
}

export async function listNotificationLogs({
  channel,
  deliveryStatus,
  relatedEntityType,
  limit = 100
}) {
  await ensureNotificationLogsTable();

  let sql = `
    SELECT
      id,
      user_id,
      related_entity_type,
      related_entity_id,
      channel,
      recipient,
      template_key,
      subject,
      message_preview,
      provider,
      provider_message_id,
      delivery_status,
      error_message,
      created_at
    FROM notification_logs
    WHERE 1=1
  `;
  const params = [];

  if (channel) {
    sql += ' AND channel = ?';
    params.push(channel);
  }

  if (deliveryStatus) {
    sql += ' AND delivery_status = ?';
    params.push(deliveryStatus);
  }

  if (relatedEntityType) {
    sql += ' AND related_entity_type = ?';
    params.push(relatedEntityType);
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(safeLimit);

  const [rows] = await db.query(sql, params);
  return rows;
}
