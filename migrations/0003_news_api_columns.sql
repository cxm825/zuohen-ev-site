-- Columns the POST /api/news publisher fills (see src/news-api.js and
-- docs/api/news-publish.md). scripts/sync-news.mjs keeps inserting its original
-- column subset; these defaults cover those rows.
ALTER TABLE news ADD COLUMN kind TEXT NOT NULL DEFAULT '';
ALTER TABLE news ADD COLUMN author TEXT NOT NULL DEFAULT '';
ALTER TABLE news ADD COLUMN read_minutes INTEGER NOT NULL DEFAULT 1;
ALTER TABLE news ADD COLUMN source_name TEXT NOT NULL DEFAULT '';
ALTER TABLE news ADD COLUMN source_url TEXT NOT NULL DEFAULT '';
