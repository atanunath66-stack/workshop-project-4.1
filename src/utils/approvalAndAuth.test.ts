import test from 'node:test';
import assert from 'node:assert/strict';

// Test status matching logic
const isPendingStatus = (s?: string) => {
  if (!s) return true;
  const clean = String(s).trim().toLowerCase();
  if (
    clean === 'suspended' ||
    clean === 'rejected' ||
    clean === 'declined' ||
    clean === 'inactive' ||
    clean === 'active' ||
    clean === 'approved' ||
    clean === 'published'
  ) {
    return false;
  }
  return (
    clean === 'pending' ||
    clean === 'pending_approval' ||
    clean === 'submitted' ||
    clean === 'review' ||
    clean === 'under_review' ||
    clean === 'new' ||
    clean.startsWith('pend') ||
    clean.includes('review') ||
    clean.includes('submit')
  );
};

// Test city filter matching logic
const matchCityFilter = (cityStr?: string, filter?: string) => {
  if (!filter || filter === 'all') return true;
  if (!cityStr) return false;
  const c = cityStr.toLowerCase();
  const f = filter.toLowerCase();
  if (c.includes(f) || f.includes(c)) return true;
  if ((f.includes('tumakur') || f.includes('tumkur')) && (c.includes('tumakur') || c.includes('tumkur') || c.includes('kyatsandra') || c.includes('siddaganga'))) return true;
  if ((f.includes('bengalur') || f.includes('bangalor')) && (c.includes('bengalur') || c.includes('bangalor') || c.includes('koramangala') || c.includes('indiranagar'))) return true;
  if ((f.includes('mysur') || f.includes('mysor')) && (c.includes('mysur') || c.includes('mysor'))) return true;
  return false;
};

test('isPendingStatus correctly recognizes diverse pending status representations', () => {
  assert.equal(isPendingStatus('pending'), true);
  assert.equal(isPendingStatus('PENDING_APPROVAL'), true);
  assert.equal(isPendingStatus('submitted'), true);
  assert.equal(isPendingStatus('under_review'), true);
  assert.equal(isPendingStatus('new'), true);
  assert.equal(isPendingStatus(undefined), true);
  assert.equal(isPendingStatus('active'), false);
  assert.equal(isPendingStatus('suspended'), false);
  assert.equal(isPendingStatus('rejected'), false);
});

test('matchCityFilter supports Tumakuru, Tumkur, and Kyatsandra aliases', () => {
  assert.equal(matchCityFilter('Tumakuru (Tumkur)', 'tumakuru'), true);
  assert.equal(matchCityFilter('Tumkur, Karnataka', 'tumakuru'), true);
  assert.equal(matchCityFilter('Kyatsandra, Tumakuru', 'tumakuru'), true);
  assert.equal(matchCityFilter('Bengaluru', 'bengaluru'), true);
  assert.equal(matchCityFilter('Bangalore Urban', 'bengaluru'), true);
  assert.equal(matchCityFilter('Mysuru', 'mysuru'), true);
  assert.equal(matchCityFilter('Mysore Heritage', 'mysuru'), true);
  assert.equal(matchCityFilter('Davanagere', 'tumakuru'), false);
});

test('Multiple store owners produce distinct owner records and listings', () => {
  const storeOwner1 = {
    id: 'owner-google-1',
    name: 'Ramesh Gowda',
    email: 'ramesh.gowda@gmail.com',
    role: 'owner',
  };
  const storeOwner2 = {
    id: 'owner-google-2',
    name: 'Suresh Kumar',
    email: 'suresh.kumar@gmail.com',
    role: 'owner',
  };

  const restaurant1 = {
    id: 'rest-1',
    name: 'Sri Siddaganga Thatte Idli',
    ownerId: storeOwner1.id,
    ownerName: storeOwner1.name,
    email: storeOwner1.email,
    city: 'Tumakuru',
    status: 'pending',
  };

  const restaurant2 = {
    id: 'rest-2',
    name: 'Tumkur Hot Idli Mane',
    ownerId: storeOwner2.id,
    ownerName: storeOwner2.name,
    email: storeOwner2.email,
    city: 'Tumakuru',
    status: 'pending',
  };

  const restaurants = [restaurant1, restaurant2];

  // Verify unique owners count
  const uniqueOwners = new Set(restaurants.map((r) => r.email.toLowerCase()));
  assert.equal(uniqueOwners.size, 2);

  // Both are pending approval
  const pending = restaurants.filter((r) => isPendingStatus(r.status));
  assert.equal(pending.length, 2);

  // Both match Tumakuru filter
  const inTumakuru = restaurants.filter((r) => matchCityFilter(r.city, 'tumakuru'));
  assert.equal(inTumakuru.length, 2);
});
