export const CONTENT_COLLECTIONS = ['articles', 'notes', 'shorts', 'videos', 'projects'] as const;

export type CollectionType = (typeof CONTENT_COLLECTIONS)[number];

export const PUBLISH_MATRIX = {
  articles: ['nostr', 'activitypub', 'atproto', 'facebook'],
  projects: ['nostr', 'activitypub', 'atproto', 'facebook'],
  notes: ['nostr', 'activitypub', 'atproto', 'facebook', 'twitter', 'instagram'],
  shorts: ['youtube-shorts', 'tiktok', 'instagram-reels', 'facebook-reels'],
  videos: ['youtube', 'instagram', 'facebook'],
} as const;

export type Platform = (typeof PUBLISH_MATRIX)[CollectionType][number];

export const PLATFORM_CREDENTIALS: Record<string, string[]> = {
  nostr: ['NOSTR_PRIVATE_KEY'],
  atproto: ['BLUESKY_HANDLE', 'BLUESKY_APP_PASSWORD'],
  facebook: ['FACEBOOK_PAGE_ID', 'FACEBOOK_PAGE_ACCESS_TOKEN'],
  'facebook-reels': ['FACEBOOK_PAGE_ID', 'FACEBOOK_PAGE_ACCESS_TOKEN'],
  twitter: ['X_CONSUMER_KEY', 'X_SECRET_KEY', 'X_BEARER_TOKEN'],
  instagram: ['INSTAGRAM_ACCESS_TOKEN', 'INSTAGRAM_BUSINESS_ACCOUNT_ID'],
  'instagram-reels': ['INSTAGRAM_ACCESS_TOKEN', 'INSTAGRAM_BUSINESS_ACCOUNT_ID'],
  'youtube-shorts': ['YOUTUBE_CLIENT_ID', 'YOUTUBE_REFRESH_TOKEN'],
  youtube: ['YOUTUBE_CLIENT_ID', 'YOUTUBE_REFRESH_TOKEN'],
  tiktok: ['TIKTOK_ACCESS_TOKEN'],
};

export function getAvailablePlatforms(): string[] {
  return Object.entries(PLATFORM_CREDENTIALS)
    .filter(([, vars]) => vars.every((v) => process.env[v] && process.env[v]!.length > 0))
    .map(([platform]) => platform);
}
