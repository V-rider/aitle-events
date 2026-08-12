import type { Env } from "./types";
import {
  DEFAULT_CERTIFICATE_TEMPLATE,
  DEFAULT_MESSAGE_TEMPLATE,
} from "./types";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  start_at TEXT NOT NULL,
  end_at TEXT,
  location TEXT NOT NULL DEFAULT '',
  capacity INTEGER,
  published INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS event_fields (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'checkbox')),
  required INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY,
  registration_id TEXT NOT NULL UNIQUE,
  event_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  answers TEXT NOT NULL DEFAULT '{}',
  attended_at TEXT,
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reg_event_email ON registrations(event_id, email);
CREATE INDEX IF NOT EXISTS idx_reg_phone ON registrations(event_id, phone);
CREATE INDEX IF NOT EXISTS idx_reg_event ON registrations(event_id);

CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'admin',
  last_signed_in TEXT,
  google_sub TEXT
);

CREATE TABLE IF NOT EXISTS admin_invites (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

let ready: Promise<void> | null = null;

export function ensureSchema(env: Env): Promise<void> {
  if (!ready) {
    ready = (async () => {
      const statements = SCHEMA.split(";")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((sql) => env.DB.prepare(sql));
      await env.DB.batch(statements);

      const existing = await env.DB.prepare(
        "SELECT COUNT(*) AS n FROM events",
      ).first<{ n: number }>();

      if (!existing || existing.n === 0) {
        await seed(env);
      } else {
        await seedSettings(env);
      }
    })().catch((err) => {
      ready = null;
      throw err;
    });
  }
  return ready;
}

async function seedSettings(env: Env) {
  await env.DB.batch([
    env.DB.prepare(
      "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
    ).bind("email_enabled", "1"),
    env.DB.prepare(
      "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
    ).bind("whatsapp_enabled", "0"),
    env.DB.prepare(
      "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
    ).bind("message_template", DEFAULT_MESSAGE_TEMPLATE),
    env.DB.prepare(
      "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
    ).bind(
      "certificate_template",
      JSON.stringify(DEFAULT_CERTIFICATE_TEMPLATE),
    ),
  ]);
}

async function seed(env: Env) {
  const now = new Date().toISOString();
  const e1 = crypto.randomUUID();
  const e2 = crypto.randomUUID();

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO events (id, slug, title, description, start_at, end_at, location, capacity, published, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    ).bind(
      e1,
      "aitle-ai-for-all-subject-admin-summit",
      "Sharing for AiTLE AI for All Subject & Admin Summit",
      "A full-day sharing on using AI across subjects and school administration.",
      "2026-08-29T01:30:00.000Z",
      "2026-08-29T09:00:00.000Z",
      "Ying Wa College",
      null,
      now,
    ),
    env.DB.prepare(
      `INSERT INTO events (id, slug, title, description, start_at, end_at, location, capacity, published, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    ).bind(
      e2,
      "cisco-networking-academy-instructor-forum-2026",
      "AiTLE x Cisco Networking Academy x CPTTM x HKIIT : 2026 Cisco Networking Academy (HK & Macau) Instructor Forum (Mini-Conference)",
      "Instructor forum for Cisco Networking Academy partners in Hong Kong and Macau.",
      "2026-07-26T01:30:00.000Z",
      "2026-07-26T04:30:00.000Z",
      "新界青衣島青衣路 20A 號 「香港資訊科技學院 (HKIIT)」 數碼創新共創中心 (DICC)",
      null,
      now,
    ),
    env.DB.prepare(
      "INSERT OR IGNORE INTO admin_invites (id, email, status, created_at) VALUES (?, ?, 'pending', ?)",
    ).bind(crypto.randomUUID(), "jasperlee016@gmail.com", now),
  ]);

  await seedSettings(env);
}
