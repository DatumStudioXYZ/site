const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nos.lol',
];

const RELAY_TIMEOUT_MS = 5000;

interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

interface PublishRequest {
  event: NostrEvent;
  relays?: string[];
}

interface RelayResult {
  relay: string;
  ok: boolean;
  message?: string;
}

async function publishToRelay(
  relayUrl: string,
  event: NostrEvent
): Promise<RelayResult> {
  return new Promise((resolve) => {
    const ws = new WebSocket(relayUrl);
    const timer = setTimeout(() => {
      ws.close();
      resolve({ relay: relayUrl, ok: false, message: 'timeout' });
    }, RELAY_TIMEOUT_MS);

    ws.addEventListener('open', () => {
      ws.send(JSON.stringify(['EVENT', event]));
    });

    ws.addEventListener('message', (msg) => {
      try {
        const data = JSON.parse(typeof msg.data === 'string' ? msg.data : msg.data.toString());
        if (Array.isArray(data) && data[0] === 'OK' && data[1] === event.id) {
          clearTimeout(timer);
          ws.close();
          const accepted = data[2] === true;
          resolve({
            relay: relayUrl,
            ok: accepted,
            message: accepted ? 'accepted' : (data[3] ?? 'rejected'),
          });
        }
      } catch {
        // ignore non-JSON messages
      }
    });

    ws.addEventListener('error', () => {
      clearTimeout(timer);
      resolve({ relay: relayUrl, ok: false, message: 'connection error' });
    });

    ws.addEventListener('close', () => {
      clearTimeout(timer);
      resolve({ relay: relayUrl, ok: false, message: 'closed before OK' });
    });
  });
}

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const body = (await context.request.json()) as PublishRequest;

    if (!body.event || typeof body.event.id !== 'string') {
      return Response.json(
        { ok: false, error: 'Missing or invalid event' },
        { status: 400 }
      );
    }

    const relays = body.relays?.length ? body.relays : DEFAULT_RELAYS;

    const results = await Promise.all(
      relays.map((relay) => publishToRelay(relay, body.event))
    );

    const allOk = results.every((r) => r.ok);

    return Response.json({ ok: allOk, results });
  } catch (error) {
    console.error('Nostr publish error:', error);
    return Response.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
};
