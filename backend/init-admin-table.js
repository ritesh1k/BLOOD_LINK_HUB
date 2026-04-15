import db from './db.js';
import bcrypt from 'bcryptjs';

async function initAdminTable() {
  await db.query(
    'CREATE TABLE IF NOT EXISTS admin (id TINYINT PRIMARY KEY DEFAULT 1, admin_id VARCHAR(100) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)'
  );

  const hash = await bcrypt.hash('admin123', 10);
  await db.query(
    'INSERT INTO admin (id, admin_id, password_hash) VALUES (1, ?, ?) ON DUPLICATE KEY UPDATE admin_id = admin_id',
    ['admin', hash]
  );

  const [tables] = await db.query("SHOW TABLES LIKE 'admin'");
  const [rows] = await db.query('SELECT id, admin_id, created_at FROM admin');

  console.log('Admin table exists:', tables.length === 1);
  console.log('Admin rows:', rows.length);
  console.log(rows);
}

initAdminTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
