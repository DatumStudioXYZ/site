CREATE TABLE IF NOT EXISTS websub_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT NOT NULL,
  callback TEXT NOT NULL,
  secret TEXT,
  lease_seconds INTEGER DEFAULT 604800,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_websub_topic
  ON websub_subscribers(topic);

CREATE UNIQUE INDEX IF NOT EXISTS idx_websub_callback_topic
  ON websub_subscribers(callback, topic);
