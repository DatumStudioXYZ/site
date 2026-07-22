CREATE TABLE IF NOT EXISTS publish_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id TEXT NOT NULL,
  collection TEXT NOT NULL,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  external_id TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_publish_log_content_platform
  ON publish_log(content_id, platform);

CREATE INDEX IF NOT EXISTS idx_publish_log_status
  ON publish_log(status);

CREATE INDEX IF NOT EXISTS idx_publish_log_platform
  ON publish_log(platform);
