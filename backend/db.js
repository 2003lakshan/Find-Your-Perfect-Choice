import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'bodim.db');

let db;

export async function initDB() {
  const SQL = await initSqlJs();

  // Load existing DB or create new one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      phone TEXT,
      role TEXT DEFAULT 'user',
      google_id TEXT,
      auth_provider TEXT DEFAULT 'local',
      two_factor_secret TEXT,
      two_factor_enabled BOOLEAN DEFAULT 0,
      login_otp TEXT,
      login_otp_expiry DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Attempt to add columns for existing database (will silently fail if they already exist)
  try { db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`); } catch(e) {}
  try { db.run(`ALTER TABLE users ADD COLUMN two_factor_secret TEXT`); } catch(e) {}
  try { db.run(`ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT 0`); } catch(e) {}
  try { db.run(`ALTER TABLE users ADD COLUMN google_id TEXT`); } catch(e) {}
  try { db.run(`ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'local'`); } catch(e) {}
  try { db.run(`ALTER TABLE users ADD COLUMN login_otp TEXT`); } catch(e) {}
  try { db.run(`ALTER TABLE users ADD COLUMN login_otp_expiry DATETIME`); } catch(e) {}

  db.run(`
    CREATE TABLE IF NOT EXISTS boardings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      price REAL NOT NULL,
      contact TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      gender TEXT DEFAULT 'any',
      status TEXT DEFAULT 'pending',
      payment_receipt TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Add status column for existing databases
  try { db.run(`ALTER TABLE boardings ADD COLUMN status TEXT DEFAULT 'pending'`); } catch(e) {}
  // Add gender column for existing databases
  try { db.run(`ALTER TABLE boardings ADD COLUMN gender TEXT DEFAULT 'any'`); } catch(e) {}
  // Add payment_receipt column for existing databases
  try { db.run(`ALTER TABLE boardings ADD COLUMN payment_receipt TEXT`); } catch(e) {}
  // Set existing boardings to approved
  try { db.run(`UPDATE boardings SET status = 'approved' WHERE status IS NULL`); } catch(e) {}

  db.run(`
    CREATE TABLE IF NOT EXISTS boarding_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      boarding_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (boarding_id) REFERENCES boardings(id) ON DELETE CASCADE
    )
  `);

  // Ensure default admin exists
  const adminEmail = 'rathnayakenaveenlakshan@gmail.com';
  const existingAdmin = db.exec('SELECT id FROM users WHERE email = ?', [adminEmail]);
  if (existingAdmin.length === 0 || existingAdmin[0].values.length === 0) {
    const hashedPassword = bcrypt.hashSync('200308010123', 10);
    db.run(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Admin', adminEmail, hashedPassword, 'admin']
    );
  }

  saveDB();
  return db;
}

export function saveDB() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

export function getDB() {
  return db;
}
