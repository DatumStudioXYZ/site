import {
  generateKeypair,
  getPublicKey,
  hexToNpub,
  hexToNsec,
  createEvent,
  createLongFormArticle,
  verifyEvent,
} from '../lib/nostr.js';

console.log('=== Nostr Event Signing Library Test ===\n');

// 1. Generate keypair
const { privateKey, publicKey } = generateKeypair();
console.log('Generated Keypair:');
console.log('  Private key (hex):', privateKey);
console.log('  Public key (hex):', publicKey);
console.log('  npub:', hexToNpub(publicKey));
console.log('  nsec:', hexToNsec(privateKey));
console.log();

// 2. Verify getPublicKey matches
const derivedPub = getPublicKey(privateKey);
console.log('getPublicKey verification:', derivedPub === publicKey ? 'PASS' : 'FAIL');

// 3. Create a kind 1 text note
const textEvent = createEvent(1, 'Hello from Datum!', [], privateKey);
console.log('\nKind 1 Event:');
console.log('  id:', textEvent.id);
console.log('  pubkey:', textEvent.pubkey);
console.log('  created_at:', textEvent.created_at);
console.log('  kind:', textEvent.kind);
console.log('  sig:', textEvent.sig.substring(0, 32) + '...');
console.log('  Verified:', verifyEvent(textEvent) ? 'PASS' : 'FAIL');

// 4. Create a NIP-23 long-form article
const articleEvent = createLongFormArticle(
  {
    slug: 'my-first-article',
    title: 'My First Article',
    content: '# Hello World\n\nThis is a test article published to Nostr.',
    summary: 'A test article',
    tags: ['nostr', 'test'],
  },
  privateKey
);
console.log('\nNIP-23 Article Event:');
console.log('  id:', articleEvent.id);
console.log('  kind:', articleEvent.kind);
console.log('  tags:', JSON.stringify(articleEvent.tags));
console.log('  Verified:', verifyEvent(articleEvent) ? 'PASS' : 'FAIL');

// 5. Test with fixed known key for reproducibility
const testPrivKey = '0000000000000000000000000000000000000000000000000000000000000001';
const testPubKey = getPublicKey(testPrivKey);
console.log('\nFixed Key Test:');
console.log('  Private key: 0000...0001');
console.log('  Public key:', testPubKey);
console.log('  npub:', hexToNpub(testPubKey));

const testEvent = createEvent(1, 'test', [], testPrivKey, 1700000000);
console.log('  Event id:', testEvent.id);
console.log('  Verified:', verifyEvent(testEvent) ? 'PASS' : 'FAIL');

// 6. Tamper detection test
const tampered = { ...testEvent, content: 'tampered' };
console.log('\nTamper Detection:');
console.log('  Tampered event verified:', verifyEvent(tampered) ? 'FAIL (bad!)' : 'PASS (correctly rejected)');

console.log('\n=== All tests complete ===');
