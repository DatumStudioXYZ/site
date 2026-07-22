export interface D1Database {
  prepare(sql: string): D1PreparedStatement;
}

export interface D1PreparedStatement {
  bind(...params: unknown[]): D1PreparedStatement;
  run(): Promise<{ success: boolean; meta?: { changes: number } }>;
  first<T = Record<string, unknown>>(col?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
}

export interface PublishLogEntry {
  content_id: string;
  collection: string;
  platform: string;
  status: string;
  external_id?: string;
  attempts: number;
  last_error?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export async function hasPublished(
  db: D1Database,
  contentId: string,
  platform: string
): Promise<boolean> {
  const row = await db
    .prepare('SELECT 1 FROM publish_log WHERE content_id = ? AND platform = ? AND status = ?')
    .bind(contentId, platform, 'success')
    .first();
  return row !== null;
}

export async function logPublishAttempt(
  db: D1Database,
  contentId: string,
  collection: string,
  platform: string
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO publish_log (content_id, collection, platform, status, attempts)
       VALUES (?, ?, ?, 'pending', 1)
       ON CONFLICT(content_id, platform)
       DO UPDATE SET attempts = attempts + 1, updated_at = datetime('now')`
    )
    .bind(contentId, collection, platform)
    .run();
}

export async function logPublishSuccess(
  db: D1Database,
  contentId: string,
  platform: string,
  externalId?: string
): Promise<void> {
  await db
    .prepare(
      `UPDATE publish_log
       SET status = 'success', external_id = ?, published_at = datetime('now'), updated_at = datetime('now')
       WHERE content_id = ? AND platform = ?`
    )
    .bind(externalId ?? null, contentId, platform)
    .run();
}

export async function logPublishFailure(
  db: D1Database,
  contentId: string,
  platform: string,
  error: string
): Promise<void> {
  await db
    .prepare(
      `UPDATE publish_log
       SET status = 'failed', last_error = ?, updated_at = datetime('now')
       WHERE content_id = ? AND platform = ?`
    )
    .bind(error, contentId, platform)
    .run();
}

export async function getPublishStatus(
  db: D1Database,
  contentId: string
): Promise<PublishLogEntry[]> {
  const { results } = await db
    .prepare('SELECT * FROM publish_log WHERE content_id = ? ORDER BY platform')
    .bind(contentId)
    .all<PublishLogEntry>();
  return results;
}
