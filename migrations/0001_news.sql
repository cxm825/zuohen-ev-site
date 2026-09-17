CREATE TABLE IF NOT EXISTS news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  legacy_path TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  published_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  image TEXT NOT NULL DEFAULT '',
  source_markdown TEXT NOT NULL,
  rendered_html TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at DESC);
