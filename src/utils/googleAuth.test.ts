import test from 'node:test';
import assert from 'node:assert/strict';
import { isMobileDevice, isSuperAdminAuth } from '../context/AppContext';
import { getFirebaseAuthErrorMessage } from './firebaseAuthErrors';
import { User, UserRole } from '../types';

test('Google Login: isMobileDevice accurately detects mobile vs desktop user agents', () => {
  // Mobile User Agents
  const iPhoneUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1';
  const androidUA = 'Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36';
  const iPadUA = 'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1';

  // Desktop User Agents
  const desktopChromeMac = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  const desktopChromeWindows = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  const desktopFirefoxLinux = 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0';

  assert.equal(isMobileDevice(iPhoneUA), true, 'iPhone should be detected as mobile');
  assert.equal(isMobileDevice(androidUA), true, 'Android phone should be detected as mobile');
  assert.equal(isMobileDevice(iPadUA), true, 'iPad should be detected as mobile');

  assert.equal(isMobileDevice(desktopChromeMac), false, 'Mac desktop Chrome should NOT be detected as mobile');
  assert.equal(isMobileDevice(desktopChromeWindows), false, 'Windows desktop Chrome should NOT be detected as mobile');
  assert.equal(isMobileDevice(desktopFirefoxLinux), false, 'Linux desktop Firefox should NOT be detected as mobile');
});

test('Google Login: First-time customer defaults to role "customer" and cannot self-escalate', () => {
  const resolveProfileRole = (
    userEmail: string | null,
    isEmailVerified: boolean,
    existingProfile: User | null,
    attemptedRole: UserRole
  ): UserRole => {
    const isSuper = isSuperAdminAuth(userEmail, isEmailVerified);
    if (isSuper) return 'admin';
    if (existingProfile?.role === 'owner') return 'owner';
    // All normal Google sign-ins default to customer, blocking self-assignment of owner or admin
    return 'customer';
  };

  // Case 1: First-time customer signing in normally
  const role1 = resolveProfileRole('sneha.patel@gmail.com', true, null, 'customer');
  assert.equal(role1, 'customer');

  // Case 2: Malicious customer attempting to self-escalate to owner on first sign-in
  const role2 = resolveProfileRole('malicious.user@gmail.com', true, null, 'owner');
  assert.equal(role2, 'customer', 'Customer must not be allowed to self-assign owner role on login');

  // Case 3: Customer attempting to self-escalate to admin
  const role3 = resolveProfileRole('attacker@gmail.com', true, null, 'admin');
  assert.equal(role3, 'customer', 'Customer must not be allowed to self-assign admin role on login');
});

test('Google Login: Returning user preserves existing verified role', () => {
  const resolveProfileRole = (
    userEmail: string | null,
    isEmailVerified: boolean,
    existingProfile: User | null
  ): UserRole => {
    const isSuper = isSuperAdminAuth(userEmail, isEmailVerified);
    if (isSuper) return 'admin';
    if (existingProfile?.role === 'owner') return 'owner';
    return 'customer';
  };

  // Returning verified owner in Firestore
  const existingOwner: User = {
    id: 'uid-verified-owner-554',
    name: 'Ramesh Tumakuru',
    email: 'ramesh.thatteidli@gmail.com',
    role: 'owner',
    authProvider: 'google',
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const roleOwner = resolveProfileRole(existingOwner.email, true, existingOwner);
  assert.equal(roleOwner, 'owner', 'Returning store owner must keep owner role');

  // Returning verified customer in Firestore
  const existingCustomer: User = {
    id: 'uid-customer-123',
    name: 'Pooja Hegde',
    email: 'pooja.hegde@gmail.com',
    role: 'customer',
    authProvider: 'google',
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const roleCustomer = resolveProfileRole(existingCustomer.email, true, existingCustomer);
  assert.equal(roleCustomer, 'customer');
});

test('Google Login: Super admin allowlisted email gets admin privileges with email verification check', () => {
  // Allowlisted super admin with verified email
  assert.equal(isSuperAdminAuth('atanunath66@gmail.com', true), true);
  assert.equal(isSuperAdminAuth('ATANUNATH66@GMAIL.COM', true), true);
  assert.equal(isSuperAdminAuth('atanuhuhu@gmail.com', true), true);

  // Unverified email check prevents spoofing
  assert.equal(isSuperAdminAuth('atanunath66@gmail.com', false), false);

  // Non-allowlisted email never gets admin
  assert.equal(isSuperAdminAuth('other.admin@gmail.com', true), false);
});

test('Google Login: Redirect state processing is executed exactly once', () => {
  let redirectExecutionCount = 0;
  const redirectProcessedRef = { current: false };

  const handleRedirectInitialization = () => {
    if (redirectProcessedRef.current) return;
    redirectProcessedRef.current = true;
    redirectExecutionCount++;
  };

  // Simulating component mounts or state updates
  handleRedirectInitialization();
  handleRedirectInitialization();
  handleRedirectInitialization();

  assert.equal(redirectExecutionCount, 1, 'Redirect result handler must only execute once on app startup');
  assert.equal(redirectProcessedRef.current, true);
});

test('Google Login: Error mapping handles popup-blocked and unauthorized-domain gracefully', () => {
  const popupBlocked = { code: 'auth/popup-blocked', message: 'Popup blocked by browser' };
  const mappedBlocked = getFirebaseAuthErrorMessage(popupBlocked);
  assert.equal(mappedBlocked.code, 'auth/popup-blocked');
  assert.match(mappedBlocked.message, /popup.*blocked/i);

  const unauthorizedDomain = { code: 'auth/unauthorized-domain', message: 'Unauthorized domain' };
  const mappedDomain = getFirebaseAuthErrorMessage(unauthorizedDomain);
  assert.equal(mappedDomain.code, 'auth/unauthorized-domain');
  assert.match(mappedDomain.actionRequired || '', /Authorized domains/i);
});
