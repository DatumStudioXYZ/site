import { schnorr } from '@noble/curves/secp256k1.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes } from '@noble/curves/utils.js';
import { randomBytes } from '@noble/hashes/utils.js';
import { bech32 } from 'bech32';

export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export interface LongFormArticle {
  slug: string;
  title: string;
  content: string;
  summary?: string;
  image?: string;
  publishedAt?: number;
  tags?: string[];
}

const UTF8_ENCODER = new TextEncoder();

function serializeEvent(
  pubkey: string,
  createdAt: number,
  kind: number,
  tags: string[][],
  content: string
): string {
  return JSON.stringify([0, pubkey, createdAt, kind, tags, content]);
}

function generateEventId(serialized: string): string {
  const bytes = UTF8_ENCODER.encode(serialized);
  const hash = sha256(bytes);
  return bytesToHex(hash);
}

function signEvent(id: string, privateKeyHex: string): string {
  const idBytes = hexToBytes(id);
  const privBytes = hexToBytes(privateKeyHex);
  const sig = schnorr.sign(idBytes, privBytes);
  return bytesToHex(sig);
}

export function generateKeypair(): { privateKey: string; publicKey: string } {
  const privKey = randomBytes(32);
  const pubKey = schnorr.getPublicKey(privKey);
  return {
    privateKey: bytesToHex(privKey),
    publicKey: bytesToHex(pubKey),
  };
}

export function getPublicKey(privateKeyHex: string): string {
  const privBytes = hexToBytes(privateKeyHex);
  return bytesToHex(schnorr.getPublicKey(privBytes));
}

function encodeBech32(prefix: string, hex: string): string {
  const bytes = hexToBytes(hex);
  const words = bech32.toWords(bytes);
  return bech32.encode(prefix, words, 90);
}

export function hexToNpub(pubkeyHex: string): string {
  return encodeBech32('npub', pubkeyHex);
}

export function hexToNsec(privkeyHex: string): string {
  return encodeBech32('nsec', privkeyHex);
}

export function createEvent(
  kind: number,
  content: string,
  tags: string[][],
  privateKeyHex: string,
  createdAt?: number
): NostrEvent {
  const pubkey = getPublicKey(privateKeyHex);
  const created_at = createdAt ?? Math.floor(Date.now() / 1000);

  const serialized = serializeEvent(pubkey, created_at, kind, tags, content);
  const id = generateEventId(serialized);
  const sig = signEvent(id, privateKeyHex);

  return {
    id,
    pubkey,
    created_at,
    kind,
    tags,
    content,
    sig,
  };
}

export function createLongFormArticle(
  article: LongFormArticle,
  privateKeyHex: string
): NostrEvent {
  const tags: string[][] = [
    ['d', article.slug],
    ['title', article.title],
  ];

  if (article.summary) {
    tags.push(['summary', article.summary]);
  }
  if (article.image) {
    tags.push(['image', article.image]);
  }
  if (article.publishedAt) {
    tags.push(['published_at', String(article.publishedAt)]);
  }
  if (article.tags) {
    for (const tag of article.tags) {
      tags.push(['t', tag]);
    }
  }

  const createdAt = article.publishedAt
    ? Math.floor(Date.now() / 1000)
    : undefined;

  return createEvent(30023, article.content, tags, privateKeyHex, createdAt);
}

export function verifyEvent(event: NostrEvent): boolean {
  const serialized = serializeEvent(
    event.pubkey,
    event.created_at,
    event.kind,
    event.tags,
    event.content
  );
  const expectedId = generateEventId(serialized);
  if (expectedId !== event.id) return false;

  const idBytes = hexToBytes(event.id);
  const pubBytes = hexToBytes(event.pubkey);
  const sigBytes = hexToBytes(event.sig);
  return schnorr.verify(sigBytes, idBytes, pubBytes);
}
