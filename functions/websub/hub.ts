const DEFAULT_LEASE_SECONDS = 604800; // 7 days

interface Env {
  WEBSUB_HUB_SECRET: string;
  PUBLISH_LOG: D1Database;
}

interface Subscriber {
  id: number;
  topic: string;
  callback: string;
  secret: string | null;
  lease_seconds: number;
  created_at: string;
  expires_at: string;
  verified: number;
}

async function computeHmac(secret: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const dataBytes = encoder.encode(data);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign('HMAC', key, dataBytes);
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyIntent(
  db: D1Database,
  mode: string,
  topic: string,
  callback: string,
  leaseSeconds: number,
  secret: string | null
): Promise<Response> {
  if (mode === 'subscribe') {
    const expiresAt = new Date(
      Date.now() + leaseSeconds * 1000
    ).toISOString();

    await db
      .prepare(
        `INSERT INTO websub_subscribers (topic, callback, secret, lease_seconds, expires_at, verified)
         VALUES (?, ?, ?, ?, ?, 1)
         ON CONFLICT(callback, topic)
         DO UPDATE SET secret = excluded.secret, lease_seconds = excluded.lease_seconds,
                      expires_at = excluded.expires_at, verified = 1`
      )
      .bind(topic, callback, secret, leaseSeconds, expiresAt)
      .run();

    const challenge = crypto.randomUUID();

    try {
      const verifyUrl = new URL(callback);
      verifyUrl.searchParams.set('hub.mode', 'subscribe');
      verifyUrl.searchParams.set('hub.topic', topic);
      verifyUrl.searchParams.set('hub.challenge', challenge);
      verifyUrl.searchParams.set('hub.lease_seconds', String(leaseSeconds));

      const res = await fetch(verifyUrl.toString(), {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      const body = await res.text();
      if (res.ok && body.trim() === challenge.trim()) {
        return new Response('Subscription verified', { status: 202 });
      }

      return new Response('Callback verification failed', { status: 403 });
    } catch {
      return new Response('Callback unreachable', { status: 403 });
    }
  }

  if (mode === 'unsubscribe') {
    await db
      .prepare(
        'DELETE FROM websub_subscribers WHERE topic = ? AND callback = ?'
      )
      .bind(topic, callback)
      .run();

    const challenge = crypto.randomUUID();
    try {
      const verifyUrl = new URL(callback);
      verifyUrl.searchParams.set('hub.mode', 'unsubscribe');
      verifyUrl.searchParams.set('hub.topic', topic);
      verifyUrl.searchParams.set('hub.challenge', challenge);

      const res = await fetch(verifyUrl.toString(), {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        return new Response('Unsubscription verified', { status: 202 });
      }
    } catch {
      // ignore — still remove the subscriber
    }

    return new Response('Unsubscribed', { status: 202 });
  }

  return new Response('Invalid hub.mode', { status: 400 });
}

async function distributeContent(
  db: D1Database,
  feedUrl: string
): Promise<Response> {
  let feedContent: string;
  try {
    const res = await fetch(feedUrl, { signal: AbortSignal.timeout(10000) });
    feedContent = await res.text();
  } catch {
    return new Response('Failed to fetch feed', { status: 502 });
  }

  const { results } = await db
    .prepare(
      `SELECT * FROM websub_subscribers
       WHERE topic = ? AND verified = 1 AND expires_at > datetime('now')`
    )
    .bind(feedUrl)
    .all<Subscriber>();

  if (!results.length) {
    return new Response('No subscribers', { status: 200 });
  }

  const results_out = await Promise.allSettled(
    results.map(async (sub) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/atom+xml',
        Link: `<${feedUrl}>; rel="hub", <${feedUrl}>; rel="self"`,
      };

      if (sub.secret) {
        const signature = await computeHmac(sub.secret, feedContent);
        headers['X-Hub-Signature'] = `sha256=${signature}`;
      }

      const res = await fetch(sub.callback, {
        method: 'POST',
        headers,
        body: feedContent,
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
    })
  );

  const successful = results_out.filter(
    (r) => r.status === 'fulfilled'
  ).length;
  const failed = results_out.filter(
    (r) => r.status === 'rejected'
  ).length;

  return new Response(
    `Distributed to ${successful} subscribers (${failed} failed)`,
    { status: 200 }
  );
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const mode = url.searchParams.get('hub.mode');
  const topic = url.searchParams.get('hub.topic');
  const callback = url.searchParams.get('hub.callback');
  const leaseSeconds = parseInt(
    url.searchParams.get('hub.lease_seconds') ?? String(DEFAULT_LEASE_SECONDS),
    10
  );
  const secret = url.searchParams.get('hub.secret');

  if (!mode || !topic || !callback) {
    return new Response('Missing required parameters', { status: 400 });
  }

  return verifyIntent(
    context.env.PUBLISH_LOG,
    mode,
    topic,
    callback,
    leaseSeconds,
    secret
  );
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const feedUrl = url.searchParams.get('hub.topic') ?? url.searchParams.get('url');

  if (!feedUrl) {
    return new Response('Missing hub.topic', { status: 400 });
  }

  return distributeContent(context.env.PUBLISH_LOG, feedUrl);
};
