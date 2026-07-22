import { createEvent, createLongFormArticle } from './nostr.ts';

const SITE_URL = process.env.SITE_URL ?? 'https://datumstudio.xyz';
const NOSTR_RELAYS = process.env.NOSTR_RELAYS?.split(',') ?? [];

export interface ContentItem {
  collection: string;
  slug: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

export interface PublishResult {
  ok: boolean;
  externalId?: string;
  error?: string;
}

export interface Publisher {
  name: string;
  publish(item: ContentItem): Promise<PublishResult>;
}

async function publishToNostrRelays(event: { id: string; pubkey: string; created_at: number; kind: number; tags: string[][]; content: string; sig: string }): Promise<Record<string, boolean>> {
  const endpoint = `${SITE_URL}/api/nostr-publish`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, relays: NOSTR_RELAYS.length ? NOSTR_RELAYS : undefined }),
  });
  const data = await res.json() as { ok: boolean; results: { relay: string; ok: boolean }[] };
  const relayMap: Record<string, boolean> = {};
  for (const r of data.results) {
    relayMap[r.relay] = r.ok;
  }
  return relayMap;
}

function createNostrPublisher(): Publisher {
  return {
    name: 'nostr',
    async publish(item) {
      const privateKey = process.env.NOSTR_PRIVATE_KEY;
      if (!privateKey) return { ok: false, error: 'NOSTR_PRIVATE_KEY not set' };

      let event;
      if (item.collection === 'articles' || item.collection === 'projects') {
        event = createLongFormArticle(
          {
            slug: item.slug,
            title: item.frontmatter.title as string,
            content: item.body,
            summary: item.frontmatter.description as string | undefined,
            tags: item.frontmatter.tags as string[] | undefined,
          },
          privateKey
        );
      } else {
        const tags: string[][] = (item.frontmatter.tags as string[] | undefined)?.map((t) => ['t', t]) ?? [];
        event = createEvent(1, item.body, tags, privateKey);
      }

      try {
        const results = await publishToNostrRelays(event);
        const allOk = Object.values(results).every(Boolean);
        if (allOk) return { ok: true, externalId: event.id };
        const failed = Object.entries(results).filter(([, ok]) => !ok).map(([r]) => r);
        return { ok: true, externalId: event.id, error: `Partial failure on: ${failed.join(', ')}` };
      } catch (err) {
        return { ok: false, error: String(err) };
      }
    },
  };
}

function createStubPublisher(name: string, reason = 'Not implemented'): Publisher {
  return {
    name,
    async publish() {
      return { ok: false, error: reason };
    },
  };
}

const PUBLISHERS: Record<string, () => Publisher> = {
  nostr: createNostrPublisher,
  activitypub: () => createStubPublisher('activitypub', 'Handled by separate Cloudflare Worker'),
  atproto: () => createStubPublisher('atproto'),
  facebook: () => createStubPublisher('facebook'),
  'facebook-reels': () => createStubPublisher('facebook-reels'),
  twitter: () => createStubPublisher('twitter'),
  instagram: () => createStubPublisher('instagram'),
  'instagram-reels': () => createStubPublisher('instagram-reels'),
  'youtube-shorts': () => createStubPublisher('youtube-shorts'),
  youtube: () => createStubPublisher('youtube'),
  tiktok: () => createStubPublisher('tiktok'),
};

export function createPublisher(platform: string): Publisher {
  const factory = PUBLISHERS[platform];
  if (!factory) throw new Error(`Unknown platform: ${platform}`);
  return factory();
}
