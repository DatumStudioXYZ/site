import { readdir, readFile } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import { createEvent, createLongFormArticle } from '../lib/nostr.js';

const SITE_URL = process.env.SITE_URL ?? 'https://datumstudio.xyz';
const NOSTR_PRIVATE_KEY = process.env.NOSTR_PRIVATE_KEY;
const RELAYS = process.env.NOSTR_RELAYS?.split(',') ?? [];

const CONTENT_DIR = join(import.meta.dirname ?? '.', '..', 'src', 'content');

interface ContentItem {
  collection: 'articles' | 'notes';
  slug: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

function parseFrontmatter(raw: string): { frontmatter: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: raw };

  const fm: Record<string, unknown> = {};
  let currentKey = '';
  let inArray = false;
  let arrayItems: string[] = [];

  for (const line of match[1].split('\n')) {
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kvMatch && !inArray) {
      currentKey = kvMatch[1];
      const val = kvMatch[2].trim();
      if (val === '' || val === '[]') {
        inArray = true;
        arrayItems = [];
      } else if (val === 'true') {
        fm[currentKey] = true;
      } else if (val === 'false') {
        fm[currentKey] = false;
      } else {
        fm[currentKey] = val.replace(/^["']|["']$/g, '');
      }
    } else if (inArray && line.match(/^  - (.+)$/)) {
      arrayItems.push(line.replace(/^  - /, '').replace(/^["']|["']$/g, ''));
    } else if (inArray && !line.match(/^  - /)) {
      fm[currentKey] = arrayItems;
      inArray = false;
      if (kvMatch) {
        currentKey = kvMatch[1];
        const val = kvMatch[2].trim();
        if (val === '' || val === '[]') {
          inArray = true;
          arrayItems = [];
        } else if (val === 'true') {
          fm[currentKey] = true;
        } else if (val === 'false') {
          fm[currentKey] = false;
        } else {
          fm[currentKey] = val.replace(/^["']|["']$/g, '');
        }
      }
    }
  }
  if (inArray) fm[currentKey] = arrayItems;

  return { frontmatter: fm, body: match[2] };
}

async function readCollection(dir: string): Promise<ContentItem[]> {
  const items: ContentItem[] = [];
  try {
    const files = await readdir(dir, { withFileTypes: true });
    for (const file of files) {
      if (!file.isFile()) continue;
      const ext = extname(file.name);
      if (ext !== '.md' && ext !== '.mdx') continue;
      const slug = basename(file.name, ext);
      const raw = await readFile(join(dir, file.name), 'utf-8');
      const { frontmatter, body } = parseFrontmatter(raw);
      items.push({ collection: dir.includes('articles') ? 'articles' : 'notes', slug, frontmatter, body });
    }
  } catch {
    // directory may not exist yet
  }
  return items;
}

async function publishToRelays(event: { id: string; pubkey: string; created_at: number; kind: number; tags: string[][]; content: string; sig: string }): Promise<Record<string, boolean>> {
  const endpoint = `${SITE_URL}/api/nostr-publish`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, relays: RELAYS.length ? RELAYS : undefined }),
  });
  const data = await res.json() as { ok: boolean; results: { relay: string; ok: boolean }[] };
  const relayMap: Record<string, boolean> = {};
  for (const r of data.results) {
    relayMap[r.relay] = r.ok;
  }
  return relayMap;
}

async function main() {
  if (!NOSTR_PRIVATE_KEY) {
    console.error('NOSTR_PRIVATE_KEY not set');
    process.exit(1);
  }

  const articles = await readCollection(join(CONTENT_DIR, 'articles'));
  const notes = await readCollection(join(CONTENT_DIR, 'notes'));
  const all = [...articles, ...notes];

  let published = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of all) {
    const isDraft = item.frontmatter.draft === true;
    if (isDraft) {
      console.log(`  skipped (draft): ${item.collection}/${item.slug}`);
      skipped++;
      continue;
    }

    let event;
    if (item.collection === 'articles') {
      event = createLongFormArticle(
        {
          slug: item.slug,
          title: item.frontmatter.title as string,
          content: item.body,
          summary: item.frontmatter.description as string | undefined,
          tags: item.frontmatter.tags as string[] | undefined,
        },
        NOSTR_PRIVATE_KEY
      );
    } else {
      const tags: string[][] = (item.frontmatter.tags as string[] | undefined)?.map((t) => ['t', t]) ?? [];
      event = createEvent(1, item.body, tags, NOSTR_PRIVATE_KEY);
    }

    console.log(`  publishing: ${item.collection}/${item.slug}`);
    try {
      const results = await publishToRelays(event);
      const allRelaysOk = Object.values(results).every(Boolean);
      if (allRelaysOk) {
        published++;
        console.log(`    ok`);
      } else {
        const failedRelays = Object.entries(results)
          .filter(([, ok]) => !ok)
          .map(([r]) => r);
        console.warn(`    partial failure on: ${failedRelays.join(', ')}`);
        published++;
      }
    } catch (err) {
      console.error(`    failed:`, err);
      failed++;
    }
  }

  console.log(`\nDone: ${published} published, ${skipped} skipped (draft), ${failed} failed`);
}

main();
