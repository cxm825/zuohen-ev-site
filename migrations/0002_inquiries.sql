-- Inquiries submitted from the public site, plus admin login throttling.
CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  product TEXT NOT NULL DEFAULT '',
  power TEXT NOT NULL DEFAULT '',
  standard TEXT NOT NULL DEFAULT '',
  quantity TEXT NOT NULL DEFAULT '',
  market TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  -- Source page path, e.g. /contact or / (helps admins see where leads come from).
  source_path TEXT NOT NULL DEFAULT '',
  -- New | In progress | Quoted | Won | Closed
  status TEXT NOT NULL DEFAULT 'New',
  -- Free-text notes written by the admin following up.
  admin_note TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);

-- Password-protected admin sessions. Tokens are stored hashed, never in plain text.
CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- Login attempt throttling, keyed by a hash of the client IP.
CREATE TABLE IF NOT EXISTS login_attempts (
  ip_hash TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  first_attempt_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  locked_until TEXT
);
