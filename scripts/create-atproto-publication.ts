const BLUESKY_HANDLE = process.env.BLUESKY_HANDLE;
const BLUESKY_APP_PASSWORD = process.env.BLUESKY_APP_PASSWORD;

async function main() {
  if (!BLUESKY_HANDLE || !BLUESKY_APP_PASSWORD) {
    console.error('BLUESKY_HANDLE and BLUESKY_APP_PASSWORD must be set');
    process.exit(1);
  }

  const { AtpAgent } = await import('@atproto/api');

  console.log(`Connecting to bsky.social...`);
  const agent = new AtpAgent({ service: 'https://bsky.social' });

  console.log(`Logging in as ${BLUESKY_HANDLE}...`);
  const { did, handle } = await agent.login({
    identifier: BLUESKY_HANDLE,
    password: BLUESKY_APP_PASSWORD,
  });

  console.log('');
  console.log('Account verified:');
  console.log(`  DID:     ${did}`);
  console.log(`  Handle:  ${handle}`);
  console.log('');

  const profile = await agent.getProfile({ actor: did });
  console.log('Profile:');
  console.log(`  Display name: ${profile.data.displayName ?? '(none)'}`);
  console.log(`  Description:  ${profile.data.description ?? '(none)'}`);
  console.log(`  Posts:        ${profile.data.postsCount}`);
  console.log(`  Followers:    ${profile.data.followersCount}`);
  console.log('');

  const TEST_POST = `Datum AT Protocol integration verified. ${new Date().toISOString()}`;

  const res = await agent.post({
    $type: 'app.bsky.feed.post',
    text: TEST_POST,
    createdAt: new Date().toISOString(),
  });

  console.log(`Test post published: ${res.uri}`);
  console.log('');
  console.log('Setup complete. The account is ready for automated publishing.');
}

main().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
