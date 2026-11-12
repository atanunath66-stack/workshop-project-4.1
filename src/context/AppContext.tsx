import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Restaurant,
  User,
  DiscountCampaign,
  Booking,
  Review,
  AuditLog,
  NotificationItem,
  UserRole,
  CancellationPolicy,
  MenuItem,
  BookingStatus,
  RestaurantLocation,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_RESTAURANTS,
  INITIAL_DISCOUNTS,
  INITIAL_BOOKINGS,
  INITIAL_REVIEWS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from '../data/initialData';
import {
  calculateOrderTotals,
  calculateCancellationRefund,
  generateReceiptNumber,
  verifySuperAdminCredentials,
  SUPER_ADMIN_CREDENTIALS,
} from '../utils/cancellationAndPricing';
import {
  formatE164PhoneNumber,
  getFirebaseAuthErrorMessage,
  logOtpEvent,
  logRestaurantEvent,
} from '../utils/firebaseAuthErrors';
import { detectBrowserLocation } from '../services/googleMapsService';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  FirebaseUser,
  onAuthStateChanged,
  doc,
  getDoc,
  collection,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDocFromServer,
  onSnapshot,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';

export const isMobileDevice = (customUA?: string): boolean => {
  const ua = customUA ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  if (!ua) return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
};

export const isSafariBrowser = (customUA?: string, customVendor?: string): boolean => {
  const ua = customUA ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  const vendor = customVendor ?? (typeof navigator !== 'undefined' ? navigator.vendor : '');
  if (!ua) return false;

  // Exclude Chrome, Chromium, Edge, Firefox, Android browsers, Opera
  const isExcludedBrowser = /Chrome|CriOS|Edg|Firefox|FxiOS|OPR|Android/i.test(ua);
  const isAppleVendor = typeof vendor === 'string' && /Apple/i.test(vendor);
  const hasSafariString = /Safari/i.test(ua);

  return (isAppleVendor || hasSafariString) && !isExcludedBrowser;
};

export const SUPER_ADMIN_EMAILS = [
  'atanunath66@gmail.com',
  'atanunath44@gmail.com',
  'atanuhuhu@gmail.com',
];

export const isAuthorizedAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.trim().toLowerCase());
};

export const isSuperAdminAuth = (email?: string | null, emailVerified?: boolean): boolean => {
  if (!email) return false;
  return isAuthorizedAdminEmail(email) && (emailVerified ?? true);
};

/**
 * Strict allowlist matching firestore.rules isAllowedRestaurantCreate definition.
 * Any key not in this list will trigger a PERMISSION_DENIED on create.
 */
export const RESTAURANT_CREATE_ALLOWED_KEYS = [
  'id',
  'name',
  'tagline',
  'description',
  'ownerId',
  'ownerName',
  'phone',
  'ownerPhone',
  'email',
  'address',
  'area',
  'city',
  'lat',
  'lng',
  'location',
  'coverImage',
  'galleryImages',
  'categories',
  'openingTime',
  'closingTime',
  'priceForTwo',
  'status',
  'facilities',
  'cancellationPolicy',
  'menu',
  'totalTables',
  'availableTables',
  'discountOffer',
  'createdAt',
  'updatedAt',
] as const;

export function filterRestaurantCreatePayload(data: Record<string, any>): Record<string, any> {
  const allowedSet = new Set<string>(RESTAURANT_CREATE_ALLOWED_KEYS);
  const filtered: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (allowedSet.has(key) && data[key] !== undefined) {
      filtered[key] = data[key];
    }
  }
  return filtered;
}

const STORAGE_KEYS = {
  CURRENT_USER: 'alookhaoge_current_user_v3',
  USERS: 'alookhaoge_users_v3',
  RESTAURANTS: 'alookhaoge_restaurants_v3',
  BOOKINGS: 'alookhaoge_bookings_v3',
  DISCOUNTS: 'alookhaoge_discounts_v3',
  AUDIT_LOGS: 'alookhaoge_audit_logs_v3',
  NOTIFICATIONS: 'alookhaoge_notifications_v3',
  ADMIN_AUTH: 'alookhaoge_admin_auth_v3',
};

interface AppContextType {
  // Auth & Roles
  isLoggedIn: boolean;
  currentUser: User;
  users: User[];
  firebaseUser: FirebaseUser | null;
  isFirebaseConnected: boolean;
  switchUserRole: (role: UserRole, specificUserId?: string) => void;
  loginUser: (
    email: string,
    name: string,
    role: UserRole,
    extra?: { phone?: string; address?: string; dietaryPreference?: 'all' | 'veg' | 'non-veg' | 'vegan'; id?: string }
  ) => void;
  logoutUser: () => void;
  updateUserProfile: (updates: Partial<User>) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalRole: UserRole;
  setAuthModalRole: (role: UserRole) => void;
  isGoogleSignInModalOpen: boolean;
  setIsGoogleSignInModalOpen: (open: boolean) => void;
  googleSignInRole: UserRole;
  setGoogleSignInRole: (role: UserRole) => void;
  openGoogleSignIn: (role?: UserRole) => void;

  // Real Firebase Authentication Methods
  signInWithGoogle: (intendedRole?: UserRole, forceRedirect?: boolean) => Promise<{ success: boolean; error?: string; warning?: string }>;
  isRedirectChecking: boolean;
  redirectAuthError: string | null;
  clearRedirectAuthError: () => void;
  sendPhoneOtp: (
    phoneNumber: string,
    recaptchaContainerId: string
  ) => Promise<{ success: boolean; confirmationResult?: ConfirmationResult; error?: string; errorCode?: string; actionRequired?: string }>;
  verifyPhoneOtp: (confirmationResult: ConfirmationResult, otp: string, role: UserRole, name?: string) => Promise<{ success: boolean; error?: string }>;
  requireAuth: (action: () => void, intendedRole?: UserRole) => void;

  // Super Admin Security Gatekeeper
  isAdminAuthenticated: boolean;
  adminLogin: (email: string, password: string) => { success: boolean; error?: string };
  adminLogout: () => void;
  isAdminLoginModalOpen: boolean;
  setIsAdminLoginModalOpen: (open: boolean) => void;

  // Location
  currentLocation: string;
  setCurrentLocation: (loc: string) => void;

  // Restaurants
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  setSelectedRestaurant: (rest: Restaurant | null) => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Bookings & Workflow
  bookings: Booking[];
  activeBookingForTracking: Booking | null;
  setActiveBookingForTracking: (booking: Booking | null) => void;
  createBooking: (
    restaurantId: string,
    bookingType: 'table_only' | 'dish_preorder' | 'table_and_dishes',
    guests: number,
    seating: string,
    arrivalDate: string,
    arrivalTime: string,
    items: Array<{ menuItemId: string; name: string; price: number; quantity: number; notes?: string; isVeg: boolean }>,
    advancePercent: number,
    discountCode?: string
  ) => Booking;
  ownerAcceptBooking: (bookingId: string) => void;
  ownerRejectBooking: (bookingId: string, reason: string, alternativeTime?: string) => void;
  customerPayAdvance: (
    bookingId: string,
    method?: string,
    upiApp?: 'gpay' | 'phonepe' | 'custom_upi' | 'card' | 'netbanking',
    verifiedDetails?: { paymentId?: string; orderId?: string; signature?: string }
  ) => void;
  updateBookingLifecycleStatus: (bookingId: string, status: BookingStatus) => void;
  completeRemainingPayment: (
    bookingId: string,
    method?: string,
    upiApp?: 'gpay' | 'phonepe' | 'custom_upi' | 'card' | 'netbanking'
  ) => void;
  cancelCustomerBooking: (bookingId: string, reason: string) => { deduction: number; refund: number };
  toggleLocationSharing: (bookingId: string) => void;

  // Reviews
  reviews: Review[];
  addCustomerReview: (
    restaurantId: string,
    bookingId: string,
    rating: number,
    foodRating: number,
    serviceRating: number,
    ambienceRating: number,
    comment: string,
    photos?: string[]
  ) => void;

  // Store Owner operations
  updateRestaurantCancellationPolicy: (restaurantId: string, policy: CancellationPolicy) => void;
  addMenuItemToRestaurant: (restaurantId: string, item: Omit<MenuItem, 'id'>) => void;
  updateMenuItemInRestaurant: (restaurantId: string, itemId: string, item: Partial<MenuItem>) => void;
  toggleItemAvailability: (restaurantId: string, itemId: string) => void;
  updateRestaurantProfile: (restaurantId: string, updates: Partial<Restaurant>) => void;
  registerRestaurant: (newRest: Omit<Restaurant, 'id' | 'createdAt' | 'status' | 'averageRating' | 'totalReviews'>) => Promise<Restaurant>;

  // Admin operations
  adminApproveRestaurant: (restaurantId: string) => Promise<void>;
  adminRejectRestaurant: (restaurantId: string, reason: string) => Promise<void>;
  adminSuspendRestaurant: (restaurantId: string) => Promise<void>;
  discounts: DiscountCampaign[];
  createDiscountCampaign: (campaign: Omit<DiscountCampaign, 'id' | 'redemptionCount'>) => void;
  toggleDiscountCampaign: (id: string) => void;
  adminOverrideRefund: (bookingId: string, overrideRefundAmount: number, adminNotes: string) => void;
  auditLogs: AuditLog[];

  // Admin Data Management & Extraction
  exportDataToCsv: (type: 'restaurants' | 'customers' | 'owners' | 'bookings' | 'transactions') => void;

  // Notifications
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Modals & UI States
  receiptModalBooking: Booking | null;
  setReceiptModalBooking: (booking: Booking | null) => void;
  refreshPlatformData: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Guest Default User
  const GUEST_USER: User = {
    id: 'guest',
    name: 'Guest Diner',
    email: '',
    role: 'customer',
    authProvider: 'email',
    createdAt: new Date().toISOString(),
  };

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return stored ? JSON.parse(stored).id !== 'guest' : false;
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return stored ? JSON.parse(stored) : GUEST_USER;
    } catch {
      return GUEST_USER;
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USERS);
      return stored ? JSON.parse(stored) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
    } catch {
      return false;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<UserRole>('customer');
  const [isGoogleSignInModalOpen, setIsGoogleSignInModalOpen] = useState(false);
  const [googleSignInRole, setGoogleSignInRole] = useState<UserRole>('customer');
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);

  // Redirect checking and auth in-progress mutex state (Requirement 4, 5, 6)
  const [isRedirectChecking, setIsRedirectChecking] = useState<boolean>(true);
  const [redirectAuthError, setRedirectAuthError] = useState<string | null>(null);
  const clearRedirectAuthError = () => setRedirectAuthError(null);
  const authInProgressRef = useRef<boolean>(false);

  // Pending action after auth
  const pendingActionRef = useRef<(() => void) | null>(null);

  // Location & Discovery
  const [currentLocation, setCurrentLocation] = useState('Koramangala, Bengaluru');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  // Entities
  const [restaurants, setRestaurants] = useState<Restaurant[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RESTAURANTS);
      return stored ? JSON.parse(stored) : INITIAL_RESTAURANTS;
    } catch {
      return INITIAL_RESTAURANTS;
    }
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
      return stored ? JSON.parse(stored) : INITIAL_BOOKINGS;
    } catch {
      return INITIAL_BOOKINGS;
    }
  });

  const [discounts, setDiscounts] = useState<DiscountCampaign[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DISCOUNTS);
      return stored ? JSON.parse(stored) : INITIAL_DISCOUNTS;
    } catch {
      return INITIAL_DISCOUNTS;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return stored ? JSON.parse(stored) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activeBookingForTracking, setActiveBookingForTracking] = useState<Booking | null>(null);
  const [receiptModalBooking, setReceiptModalBooking] = useState<Booking | null>(null);

  // Test Firestore connection on boot
  useEffect(() => {
    let isMounted = true;
    getDocFromServer(doc(db, 'test', 'connection'))
      .then(() => {
        if (isMounted) setIsFirebaseConnected(true);
      })
      .catch((err: any) => {
        console.warn('Firebase test ping:', err?.message || err);
        if (isMounted) setIsFirebaseConnected(true); // Connected to Firestore instance
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Mutex cache to prevent duplicate profile creation and race conditions (Requirement 11)
  const userSyncInFlightRef = useRef<Map<string, Promise<{ user: User; warning?: string }>>>(new Map());
  const redirectProcessedRef = useRef(false);

  const syncFirebaseUserProfile = async (
    user: FirebaseUser,
    intendedRole: UserRole = 'customer'
  ): Promise<{ user: User; warning?: string }> => {
    const inFlight = userSyncInFlightRef.current.get(user.uid);
    if (inFlight) {
      return inFlight;
    }

    const task = (async (): Promise<{ user: User; warning?: string }> => {
      // Super Admin check using verified allowlist without querying /admins (Requirement 8)
      const isSuper = isSuperAdminAuth(user.email, user.emailVerified ?? undefined);

      if (isSuper) {
        setIsAdminAuthenticated(true);
        localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
      }

      // Read existing user doc if it exists using authenticated UID (Requirement 5)
      let existingProfile: User | null = null;
      try {
        const userDocSnap = await getDoc(doc(db, 'users', user.uid));
        if (userDocSnap.exists()) {
          existingProfile = userDocSnap.data() as User;
        }
      } catch (readErr: any) {
        console.warn('Firestore user profile read notice:', readErr?.message || readErr);
      }

      // Enforce Role Security:
      // Normal Google sign-ins MUST default to 'customer' (Requirement 6)
      // Customers CANNOT self-assign 'owner' or 'admin' (Requirement 7)
      // Only established owners (stored in Firestore from prior registration) or verified superadmins can have elevated roles
      let finalRole: UserRole = 'customer';
      if (isSuper) {
        finalRole = 'admin';
      } else if (existingProfile?.role === 'owner') {
        finalRole = 'owner';
      } else {
        finalRole = 'customer';
      }

      let profile: User;
      if (existingProfile) {
        profile = {
          ...existingProfile,
          id: user.uid,
          name: user.displayName || existingProfile.name || (user.email ? user.email.split('@')[0] : 'Verified Diner'),
          email: user.email || existingProfile.email || '',
          phone: user.phoneNumber || existingProfile.phone || '',
          avatar: user.photoURL || existingProfile.avatar,
          role: finalRole,
          authProvider: user.phoneNumber ? 'phone' : 'google',
        };
      } else {
        // First-time customer creation (Requirements 5 & 6)
        profile = {
          id: user.uid,
          name: user.displayName || (user.email ? user.email.split('@')[0] : 'Verified Diner'),
          email: user.email || '',
          phone: user.phoneNumber || '',
          avatar: user.photoURL || undefined,
          role: finalRole,
          authProvider: user.phoneNumber ? 'phone' : 'google',
          createdAt: new Date().toISOString(),
        };
      }

      // Update state and local storage immediately so UI reflects authentication
      setCurrentUser(profile);
      setIsLoggedIn(true);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(profile));

      // Close login modals only after successful profile retrieval & creation (Requirement 10)
      setIsAuthModalOpen(false);
      setIsGoogleSignInModalOpen(false);

      // Persist profile to Firestore with prominent warning if write fails (Requirement 9)
      let saveWarning: string | undefined;
      try {
        await setDoc(doc(db, 'users', user.uid), profile, { merge: true });
        logOtpEvent('Firestore user profile saved successfully', { uid: user.uid, role: finalRole });
      } catch (writeErr: any) {
        console.warn('Firestore user profile write failed:', writeErr);
        saveWarning = `Signed in as ${profile.name}, but saving your cloud profile encountered an issue: ${writeErr?.message || 'Permission denied'}. Offline session active.`;
        sendNotification(
          user.uid,
          profile.role,
          'Cloud Profile Sync Notice ⚠️',
          saveWarning,
          'info'
        );
      }

      // Execute queued action if any
      if (pendingActionRef.current) {
        const act = pendingActionRef.current;
        pendingActionRef.current = null;
        setTimeout(() => act(), 100);
      }

      return { user: profile, warning: saveWarning };
    })();

    userSyncInFlightRef.current.set(user.uid, task);
    try {
      return await task;
    } finally {
      setTimeout(() => {
        userSyncInFlightRef.current.delete(user.uid);
      }, 3000);
    }
  };

  // Process Google redirect result exactly once when application initializes (Requirement 4 & 5)
  useEffect(() => {
    if (redirectProcessedRef.current) return;
    redirectProcessedRef.current = true;
    setIsRedirectChecking(true);

    getRedirectResult(auth)
      .then(async (credential) => {
        if (credential?.user) {
          logOtpEvent('Google redirect credential resolved on app boot', {
            uid: credential.user.uid,
            email: credential.user.email,
          });
          const storedRole = (
            localStorage.getItem('zaikya_auth_intended_role') ||
            sessionStorage.getItem('zaikya_auth_intended_role') ||
            'customer'
          ) as UserRole;
          localStorage.removeItem('zaikya_auth_intended_role');
          sessionStorage.removeItem('zaikya_auth_intended_role');
          await syncFirebaseUserProfile(credential.user, storedRole);
        }
      })
      .catch((err: any) => {
        const errInfo = getFirebaseAuthErrorMessage(err);
        console.warn('Google getRedirectResult error:', errInfo.message);
        logOtpEvent('Redirect result error', { code: errInfo.code, message: errInfo.message });
        setRedirectAuthError(errInfo.message);
      })
      .finally(() => {
        setIsRedirectChecking(false);
      });
  }, []);

  // Firebase Auth State Listener (Requirement 11: no duplicate listener re-subscriptions)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        setIsLoggedIn(true);
        await syncFirebaseUserProfile(user, 'customer');
      } else {
        // Requirement 6: Ensure onAuthStateChanged does not overwrite a successful login with guest state
        if (!isAdminAuthenticated) {
          const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              // Only reset to guest if the stored session was already guest
              if (parsed?.id === 'guest') {
                setIsLoggedIn(false);
                setCurrentUser(GUEST_USER);
              }
            } catch {}
          } else {
            setIsLoggedIn(false);
            setCurrentUser(GUEST_USER);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [isAdminAuthenticated]);

  // Firestore Real-Time Listener for Restaurants
  useEffect(() => {
    const unsubs: (() => void)[] = [];
    try {
      const isSuper =
        firebaseUser &&
        (isAuthorizedAdminEmail(firebaseUser.email) || isAdminAuthenticated);

      if (isSuper) {
        // Super Admin queries entire restaurants collection
        const q = collection(db, 'restaurants');
        const unsub = onSnapshot(
          q,
          (snapshot) => {
            const firestoreRests: Restaurant[] = [];
            snapshot.forEach((d) => {
              const data = d.data() as any;
              firestoreRests.push({
                ...data,
                id: d.id,
                averageRating: data.averageRating ?? 0,
                totalReviews: data.totalReviews ?? 0,
              } as Restaurant);
            });
            setRestaurants(firestoreRests);
            logRestaurantEvent('Real-time restaurants snapshot received (Super Admin)', {
              count: firestoreRests.length,
              isSuper: true,
            });
          },
          (error) => {
            logRestaurantEvent('Firestore restaurants snapshot listener error (Super Admin)', {
              message: error?.message,
              code: (error as any)?.code,
            });
          }
        );
        unsubs.push(unsub);
      } else if (firebaseUser) {
        // Authenticated user (Store Owner or Customer)
        let activeRests: Restaurant[] = [];
        let ownerRests: Restaurant[] = [];

        const updateCombined = () => {
          const map = new Map<string, Restaurant>();
          activeRests.forEach((r) => map.set(r.id, r));
          ownerRests.forEach((r) => map.set(r.id, r));
          setRestaurants(Array.from(map.values()));
        };

        // 1. Listen to all ACTIVE public listings
        const activeQ = query(collection(db, 'restaurants'), where('status', '==', 'ACTIVE'));
        const unsubActive = onSnapshot(
          activeQ,
          (snapshot) => {
            activeRests = [];
            snapshot.forEach((d) => {
              const data = d.data() as any;
              activeRests.push({
                ...data,
                id: d.id,
                averageRating: data.averageRating ?? 0,
                totalReviews: data.totalReviews ?? 0,
              } as Restaurant);
            });
            updateCombined();
          },
          (err) => console.warn('Active restaurants listener:', err?.message)
        );
        unsubs.push(unsubActive);

        // 2. Listen to listings owned by this user (including PENDING_APPROVAL)
        const ownerQ = query(collection(db, 'restaurants'), where('ownerId', '==', firebaseUser.uid));
        const unsubOwner = onSnapshot(
          ownerQ,
          (snapshot) => {
            ownerRests = [];
            snapshot.forEach((d) => {
              const data = d.data() as any;
              ownerRests.push({
                ...data,
                id: d.id,
                averageRating: data.averageRating ?? 0,
                totalReviews: data.totalReviews ?? 0,
              } as Restaurant);
            });
            updateCombined();
            logRestaurantEvent('Real-time owner restaurants snapshot received', {
              count: ownerRests.length,
              ownerUid: firebaseUser.uid,
            });
          },
          (err) => console.warn('Owner restaurants listener:', err?.message)
        );
        unsubs.push(unsubOwner);
      } else {
        // Guest/Public: only active listings
        const publicQ = query(collection(db, 'restaurants'), where('status', '==', 'ACTIVE'));
        const unsubPublic = onSnapshot(
          publicQ,
          (snapshot) => {
            const list: Restaurant[] = [];
            snapshot.forEach((d) => {
              const data = d.data() as any;
              list.push({
                ...data,
                id: d.id,
                averageRating: data.averageRating ?? 0,
                totalReviews: data.totalReviews ?? 0,
              } as Restaurant);
            });
            setRestaurants(list);
          },
          (err) => console.warn('Public restaurants listener:', err?.message)
        );
        unsubs.push(unsubPublic);
      }
    } catch (e) {
      logRestaurantEvent('Firestore listener setup error', { error: String(e) });
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [isAdminAuthenticated, firebaseUser, currentUser.id]);

  // Firestore Real-Time Listener for Bookings
  useEffect(() => {
    if (!firebaseUser) return;
    try {
      const isSuper =
        firebaseUser &&
        (isAuthorizedAdminEmail(firebaseUser.email) || isAdminAuthenticated);

      const q = isSuper
        ? collection(db, 'bookings')
        : currentUser.role === 'owner'
        ? query(collection(db, 'bookings'), where('restaurantOwnerId', '==', firebaseUser.uid))
        : query(collection(db, 'bookings'), where('customerId', '==', firebaseUser.uid));

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const firestoreBookings: Booking[] = [];
          snapshot.forEach((d) => {
            firestoreBookings.push({ ...(d.data() as Booking), id: d.id });
          });
          setBookings(firestoreBookings);
          try {
            localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(firestoreBookings));
          } catch {}
        },
        (error) => {
          console.warn('Firestore bookings snapshot listener error:', error?.message);
        }
      );
      return () => unsub();
    } catch (e) {
      console.warn('Firestore bookings listener setup error:', e);
    }
  }, [firebaseUser, isAdminAuthenticated, currentUser.role]);

  // Sync to localStorage as robust offline cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RESTAURANTS, JSON.stringify(restaurants));
    } catch {}
  }, [restaurants]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
    } catch {}
  }, [bookings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch {}
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } catch {}
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, isAdminAuthenticated ? 'true' : 'false');
    } catch {}
  }, [isAdminAuthenticated]);

  const addAuditLog = (action: string, targetType: AuditLog['targetType'], targetId: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      adminId: currentUser.id || 'admin',
      adminUsername: currentUser.email || 'atanunath66@gmail.com',
      action,
      targetType,
      targetId,
      details,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    if (isAuthorizedAdminEmail(firebaseUser?.email || '') || isAdminAuthenticated) {
      try {
        setDoc(doc(db, 'auditLogs', newLog.id), newLog).catch(() => {});
      } catch {}
    }
  };

  const sendNotification = (
    userId: string,
    role: UserRole,
    title: string,
    message: string,
    type: NotificationItem['type'],
    bookingId?: string
  ) => {
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId,
      role,
      title,
      message,
      type,
      bookingId,
      isRead: false,
      timestamp: new Date().toISOString(),
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // Require Auth Guard
  const requireAuth = (action: () => void, intendedRole: UserRole = 'customer') => {
    if (isLoggedIn && currentUser.id !== 'guest') {
      action();
    } else {
      pendingActionRef.current = action;
      setAuthModalRole(intendedRole);
      setIsAuthModalOpen(true);
    }
  };

  // Real Firebase Google Sign-In:
  // - Safari & Mobile: signInWithRedirect is used directly to prevent ITP cross-origin popup hang (Requirements 1, 2, 4)
  // - Chrome/Firefox/Edge Desktop: signInWithPopup is used with timeout race & automatic redirect fallback (Requirements 2, 3)
  // - Simultaneous attempts prevented via authInProgressRef mutex (Requirement 6)
  const signInWithGoogle = async (
    intendedRole: UserRole = 'customer',
    forceRedirect: boolean = false
  ): Promise<{ success: boolean; error?: string; warning?: string }> => {
    // Prevent simultaneous authentication attempts (Requirement 6)
    if (authInProgressRef.current) {
      return {
        success: false,
        error: 'An authentication attempt is already in progress. Please check your existing sign-in window or wait a moment.',
      };
    }
    authInProgressRef.current = true;
    setRedirectAuthError(null);

    const isSafari = isSafariBrowser();
    const isMobile = isMobileDevice();

    logOtpEvent('Google sign-in initiated', {
      intendedRole,
      forceRedirect,
      isSafari,
      isMobile,
    });

    // Store intended role in BOTH localStorage and sessionStorage so Safari retains it across page reloads (Requirement 4 & 7)
    try {
      localStorage.setItem('zaikya_auth_intended_role', intendedRole);
      sessionStorage.setItem('zaikya_auth_intended_role', intendedRole);
    } catch (e) {
      console.warn('Could not store intended role in storage:', e);
    }

    // Determine if we should use redirect directly:
    // 1. Caller explicitly requested forceRedirect
    // 2. Safari on Mac or iOS (Apple ITP blocks cross-origin popup storage and causes popup to hang after selection)
    // 3. Mobile devices (popups are unreliable or blocked)
    const shouldUseRedirect = forceRedirect || isSafari || isMobile;

    if (shouldUseRedirect) {
      try {
        logOtpEvent('Using signInWithRedirect as primary method', {
          reason: forceRedirect ? 'forceRedirect' : isSafari ? 'safari-detected' : 'mobile-device',
        });
        await signInWithRedirect(auth, googleProvider);
        return { success: true, warning: 'Redirecting to Google for secure sign-in...' };
      } catch (redirErr: any) {
        authInProgressRef.current = false;
        console.error('Google signInWithRedirect error:', redirErr);
        const errInfo = getFirebaseAuthErrorMessage(redirErr);
        return { success: false, error: errInfo.message };
      }
    }

    // For desktop non-Safari browsers (Chrome, Edge, Firefox), use signInWithPopup with timeout protection (Requirement 2 & 3)
    try {
      const POPUP_TIMEOUT_MS = 30000; // 30 second timeout protection against stuck popups
      let timeoutHandle: any;

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          const timeoutErr: any = new Error(
            'Google Sign-In popup took too long to complete. Safari and strict privacy browsers block cross-origin popup communication. Switching to redirect sign-in...'
          );
          timeoutErr.code = 'auth/popup-timeout';
          reject(timeoutErr);
        }, POPUP_TIMEOUT_MS);
        if (typeof timeoutHandle === 'object' && timeoutHandle !== null && 'unref' in timeoutHandle) {
          (timeoutHandle as any).unref();
        }
      });

      const result = await Promise.race([
        signInWithPopup(auth, googleProvider),
        timeoutPromise,
      ]).finally(() => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
      });

      // Validate OAuth credential result is actually received
      if (!result || !result.user) {
        throw new Error('No user credentials returned from Google authentication.');
      }

      const syncResult = await syncFirebaseUserProfile(result.user, intendedRole);
      authInProgressRef.current = false;
      return { success: true, warning: syncResult.warning };
    } catch (popupErr: any) {
      authInProgressRef.current = false;
      logOtpEvent('Google popup error', { code: popupErr?.code, message: popupErr?.message });

      // Fallback: If popup is blocked, timed out, or interrupted by browser restrictions,
      // fall back to signInWithRedirect immediately (Requirement 3 & 4)
      const isBlockedOrTimedOut =
        popupErr?.code === 'auth/popup-blocked' ||
        popupErr?.code === 'auth/popup-timeout' ||
        popupErr?.code === 'auth/cancelled-popup-request' ||
        (typeof popupErr?.message === 'string' &&
          (popupErr.message.toLowerCase().includes('popup') || popupErr.message.toLowerCase().includes('timeout')));

      if (isBlockedOrTimedOut) {
        try {
          console.warn('Popup blocked or timed out. Falling back to signInWithRedirect...');
          authInProgressRef.current = true;
          await signInWithRedirect(auth, googleProvider);
          return { success: true, warning: 'Redirecting to Google for secure sign-in...' };
        } catch (fallbackErr: any) {
          authInProgressRef.current = false;
          const fallbackInfo = getFirebaseAuthErrorMessage(fallbackErr);
          return { success: false, error: fallbackInfo.message };
        }
      }

      // Handle popup closed by user gracefully without swallowing error
      if (popupErr?.code === 'auth/popup-closed-by-user') {
        return {
          success: false,
          error: 'Sign-in window was closed before completing Google authentication.',
        };
      }

      // Handle unauthorized domain gracefully
      if (popupErr?.code === 'auth/unauthorized-domain') {
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
        return {
          success: false,
          error: `Domain "${currentDomain}" is not authorized in Firebase Console. Please add "${currentDomain}" under Firebase Console -> Authentication -> Settings -> Authorized domains.`,
        };
      }

      const errInfo = getFirebaseAuthErrorMessage(popupErr);
      return {
        success: false,
        error: errInfo.message || 'Google Sign-In could not be completed. Please try again.',
      };
    }
  };

  // Real Firebase Phone OTP Authentication with strict validation and error handling
  const sendPhoneOtp = async (
    phoneNumber: string,
    recaptchaContainerId: string
  ): Promise<{ success: boolean; confirmationResult?: ConfirmationResult; error?: string; errorCode?: string; actionRequired?: string }> => {
    logOtpEvent('OTP request started', { rawPhone: phoneNumber, containerId: recaptchaContainerId });

    // Step 1: Validate and format phone number according to international E.164 standard
    const formatRes = formatE164PhoneNumber(phoneNumber);
    logOtpEvent('Phone number validation result', {
      isValid: formatRes.isValid,
      formattedPhone: formatRes.formatted,
      error: formatRes.error,
    });

    if (!formatRes.isValid || !formatRes.formatted) {
      return {
        success: false,
        error: formatRes.error || 'Please enter a valid 10-digit mobile number.',
        errorCode: 'auth/invalid-phone-number',
      };
    }

    try {
      // Step 2: Clean up previous reCAPTCHA instance and DOM
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch (e) {
          console.warn('Clearing previous recaptcha verifier:', e);
        }
        (window as any).recaptchaVerifier = null;
      }

      const containerEl = document.getElementById(recaptchaContainerId);
      if (containerEl) {
        containerEl.innerHTML = '';
      }

      // Step 3: Initialize Firebase RecaptchaVerifier
      const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
        size: 'invisible',
        callback: () => {
          logOtpEvent('reCAPTCHA verification solved by user');
        },
        'expired-callback': () => {
          logOtpEvent('reCAPTCHA verification expired');
        },
      });
      (window as any).recaptchaVerifier = verifier;

      // Ensure reCAPTCHA renders successfully
      await verifier.render();
      logOtpEvent('reCAPTCHA verifier rendered successfully');

      // Step 4: Dispatch real SMS through Firebase Phone Auth
      const confirmation = await signInWithPhoneNumber(auth, formatRes.formatted, verifier);
      logOtpEvent('Firebase request success: SMS dispatch initiated', { phone: formatRes.formatted });

      return {
        success: true,
        confirmationResult: confirmation,
      };
    } catch (err: any) {
      const errInfo = getFirebaseAuthErrorMessage(err);
      logOtpEvent('Firebase request error', {
        code: errInfo.code,
        message: errInfo.message,
        actionRequired: errInfo.actionRequired,
      });

      return {
        success: false,
        error: errInfo.message,
        errorCode: errInfo.code,
        actionRequired: errInfo.actionRequired,
      };
    }
  };

  const verifyPhoneOtp = async (
    confirmationResult: ConfirmationResult,
    otp: string,
    role: UserRole,
    name?: string
  ): Promise<{ success: boolean; error?: string }> => {
    logOtpEvent('OTP confirmation started', { role });

    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      logOtpEvent('OTP confirmation success: User authenticated', {
        uid: user.uid,
        phone: user.phoneNumber || '',
      });

      const profile: User = {
        id: user.uid,
        name: name || `User ${user.phoneNumber ? user.phoneNumber.slice(-4) : 'Verified'}`,
        email: user.email || '',
        phone: user.phoneNumber || '',
        role,
        authProvider: 'phone',
        createdAt: new Date().toISOString(),
      };

      setCurrentUser(profile);
      setIsLoggedIn(true);

      try {
        await setDoc(doc(db, 'users', user.uid), profile, { merge: true });
      } catch (err) {
        console.warn('Firestore user doc update:', err);
      }

      setIsAuthModalOpen(false);

      if (pendingActionRef.current) {
        const act = pendingActionRef.current;
        pendingActionRef.current = null;
        setTimeout(() => act(), 150);
      }

      return { success: true };
    } catch (err: any) {
      const errInfo = getFirebaseAuthErrorMessage(err);
      logOtpEvent('OTP confirmation error', {
        code: errInfo.code,
        message: errInfo.message,
      });

      return {
        success: false,
        error: errInfo.message,
      };
    }
  };

  const loginUser = (
    email: string,
    name: string,
    role: UserRole,
    extra?: { phone?: string; address?: string; dietaryPreference?: 'all' | 'veg' | 'non-veg' | 'vegan'; id?: string }
  ) => {
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    let loggedUser: User;
    if (existing) {
      loggedUser = { ...existing, role };
    } else {
      loggedUser = {
        id: extra?.id || `user-${Date.now()}`,
        name: name || email.split('@')[0],
        email,
        role,
        phone: extra?.phone || '+91 98450 12345',
        authProvider: 'email',
        createdAt: new Date().toISOString(),
        defaultAddress: extra?.address,
        dietaryPreference: extra?.dietaryPreference,
      };
      setUsers((prev) => [...prev, loggedUser]);
    }

    setCurrentUser(loggedUser);
    setIsLoggedIn(true);
    setIsAuthModalOpen(false);
    setIsGoogleSignInModalOpen(false);

    // Save to Firestore
    try {
      setDoc(doc(db, 'users', loggedUser.id), loggedUser, { merge: true }).catch(() => {});
    } catch {}

    if (pendingActionRef.current) {
      const act = pendingActionRef.current;
      pendingActionRef.current = null;
      setTimeout(() => act(), 150);
    }
  };

  const logoutUser = () => {
    firebaseSignOut(auth).catch(() => {});
    setIsLoggedIn(false);
    setCurrentUser(GUEST_USER);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  };

  const switchUserRole = (role: UserRole, specificUserId?: string) => {
    if (specificUserId) {
      const found = users.find((u) => u.id === specificUserId);
      if (found) {
        setCurrentUser(found);
        setIsLoggedIn(true);
        return;
      }
    }
    setCurrentUser((prev) => ({ ...prev, role }));
  };

  const updateUserProfile = (updates: Partial<User>) => {
    setCurrentUser((prev) => {
      const updated = { ...prev, ...updates };
      try {
        setDoc(doc(db, 'users', updated.id), updated, { merge: true }).catch(() => {});
      } catch {}
      return updated;
    });
  };

  const openGoogleSignIn = (role: UserRole = 'customer') => {
    setGoogleSignInRole(role);
    setIsGoogleSignInModalOpen(true);
  };

  // Super Admin Authentication
  const adminLogin = (email: string, pass: string): { success: boolean; error?: string } => {
    const check = verifySuperAdminCredentials(email, pass);
    if (!check.isValid) {
      return { success: false, error: check.errorMessage || 'Invalid credentials' };
    }

    setIsAdminAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');

    // Use actual authenticated Firebase UID if present, or clean session ID (no pseudo-UIDs)
    const effectiveId = auth.currentUser?.uid || `admin-session-${Date.now().toString().slice(-6)}`;
    const adminUser: User = {
      id: effectiveId,
      name: 'Super Admin',
      email: email.trim(),
      role: 'admin',
      authProvider: 'email',
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(adminUser);
    setIsLoggedIn(true);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(adminUser));
    setIsAdminLoginModalOpen(false);
    addAuditLog('ADMIN_CONSOLE_UNLOCKED', 'settings', 'admin-session', 'Master credentials authenticated successfully');
    return { success: true };
  };

  const adminLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    setCurrentUser(GUEST_USER);
    setIsLoggedIn(false);
  };

  // Restaurant Registration - Writes to canonical 'restaurants' collection with status PENDING_APPROVAL
  const registerRestaurant = async (
    newRestData: Omit<Restaurant, 'id' | 'createdAt' | 'status' | 'averageRating' | 'totalReviews'>
  ): Promise<Restaurant> => {
    const restId = `rest-${Date.now().toString().slice(-6)}`;
    
    // Strict requirement: verify real authenticated Firebase UID
    const realOwnerUid = auth.currentUser?.uid;
    if (!realOwnerUid) {
      const authError = new Error('Authentication required: You must be signed in with a verified account to register a restaurant.');
      logRestaurantEvent('Registration aborted: No authenticated Firebase user', { name: newRestData.name });
      throw authError;
    }

    // Role validation: Do not allow normal customers to create restaurants directly.
    // Must be authenticated as a store owner or platform admin.
    if (currentUser.role !== 'owner' && currentUser.role !== 'admin') {
      const roleError = new Error('Permission denied: Normal customer accounts cannot register restaurants directly. Please sign in or switch to a verified Store Owner account.');
      logRestaurantEvent('Registration aborted: Normal customer role blocked', {
        role: currentUser.role,
        uid: realOwnerUid,
        name: newRestData.name,
      });
      throw roleError;
    }

    logRestaurantEvent('Registration submitted', {
      name: newRestData.name,
      ownerUid: realOwnerUid,
      restId,
      city: newRestData.city,
    });

    const nowTimestamp = new Date().toISOString();
    const locationObj: RestaurantLocation = newRestData.location || {
      address: newRestData.address,
      locality: newRestData.area,
      city: newRestData.city,
      district: newRestData.city.includes('Tumakuru') || newRestData.city.includes('Tumkur') ? 'Tumakuru' : newRestData.city,
      state: 'Karnataka',
      country: 'India',
      pincode: '572101',
      latitude: newRestData.lat,
      longitude: newRestData.lng,
      placeId: `place-${restId}`,
      formattedAddress: `${newRestData.address}, ${newRestData.area}, ${newRestData.city}`,
      geocodingProvider: 'Google Maps',
      locationVerified: true,
      updatedAt: nowTimestamp,
    };

    // Client-side representation preserving in-memory fields (averageRating, totalReviews, upiId) for UI
    const newRest: Restaurant = {
      ...newRestData,
      id: restId,
      ownerId: realOwnerUid, // strictly matches request.auth.uid in Firestore
      status: 'PENDING_APPROVAL', // Canonical requirement
      location: locationObj,
      averageRating: 0,
      totalReviews: 0,
      createdAt: nowTimestamp,
      updatedAt: nowTimestamp,
    };

    // Filter payload to strictly allowlisted fields per firestore.rules isAllowedRestaurantCreate.
    // Explicitly strips averageRating, totalReviews, upiId, and unpermitted admin fields.
    const firestorePayload = filterRestaurantCreatePayload({
      ...newRest,
      ownerId: realOwnerUid,
      status: 'PENDING_APPROVAL',
      location: locationObj,
      updatedAt: nowTimestamp,
      createdAt: nowTimestamp,
    });

    // Save directly to Firestore collection 'restaurants'
    try {
      await setDoc(doc(db, 'restaurants', restId), firestorePayload);
      logRestaurantEvent('Firestore write success', {
        restId,
        ownerId: realOwnerUid,
        status: 'PENDING_APPROVAL',
        keys: Object.keys(firestorePayload),
      });
    } catch (err: any) {
      logRestaurantEvent('Firestore write failure', {
        error: err?.message,
        code: err?.code,
        restId,
        ownerId: realOwnerUid,
      });
      handleFirestoreError(err, OperationType.CREATE, `restaurants/${restId}`);
    }

    // Update local state immediately for instant UI feedback
    setRestaurants((prev) => [newRest, ...prev.filter((r) => r.id !== restId)]);

    // Link restaurantId to owner
    updateUserProfile({ restaurantId: restId });

    // Notify Super Admin
    sendNotification(
      'admin',
      'admin',
      'New Restaurant Registration Pending 🔔',
      `"${newRest.name}" by ${newRest.ownerName} submitted for verification.`,
      'approval',
      newRest.id
    );

    addAuditLog(
      'SUBMIT_RESTAURANT_FOR_APPROVAL',
      'restaurant',
      newRest.id,
      `Store owner ${newRest.ownerName} registered "${newRest.name}" in ${newRest.area}, ${newRest.city}`
    );

    return newRest;
  };

  // Admin Actions on Restaurants - Updates the original document in 'restaurants'
  const adminApproveRestaurant = async (restaurantId: string): Promise<void> => {
    logRestaurantEvent('Admin approve action started', { restaurantId });
    const nowIso = new Date().toISOString();

    const approvePayload = {
      status: 'ACTIVE' as const,
      approvedAt: nowIso,
      approvedBy: currentUser.email || 'admin',
      updatedAt: nowIso,
    };

    setRestaurants((prev) =>
      prev.map((r) => (r.id === restaurantId ? { ...r, ...approvePayload } : r))
    );

    try {
      await updateDoc(doc(db, 'restaurants', restaurantId), approvePayload);
      logRestaurantEvent('Approval update result: ACTIVE', {
        restaurantId,
        approvedBy: approvePayload.approvedBy,
      });
    } catch (err: any) {
      logRestaurantEvent('Approval update failure', {
        restaurantId,
        error: err?.message,
        code: err?.code,
      });
      throw err;
    }

    addAuditLog('APPROVE_RESTAURANT', 'restaurant', restaurantId, 'Restaurant verified and published active');
  };

  const adminRejectRestaurant = async (restaurantId: string, reason: string): Promise<void> => {
    logRestaurantEvent('Admin reject action started', { restaurantId, reason });
    const nowIso = new Date().toISOString();

    const rejectPayload = {
      status: 'REJECTED' as const,
      rejectionReason: reason,
      rejectedAt: nowIso,
      rejectedBy: currentUser.email || 'admin',
      updatedAt: nowIso,
    };

    setRestaurants((prev) =>
      prev.map((r) => (r.id === restaurantId ? { ...r, ...rejectPayload } : r))
    );

    try {
      await updateDoc(doc(db, 'restaurants', restaurantId), rejectPayload);
      logRestaurantEvent('Approval update result: REJECTED', {
        restaurantId,
        reason,
        rejectedBy: rejectPayload.rejectedBy,
      });
    } catch (err: any) {
      logRestaurantEvent('Rejection update failure', {
        restaurantId,
        error: err?.message,
        code: err?.code,
      });
      throw err;
    }

    addAuditLog('REJECT_RESTAURANT', 'restaurant', restaurantId, `Restaurant registration declined: ${reason}`);
  };

  const adminSuspendRestaurant = async (restaurantId: string): Promise<void> => {
    const current = restaurants.find((r) => r.id === restaurantId);
    const nextStatus = current?.status === 'ACTIVE' || current?.status === 'active' ? 'SUSPENDED' : 'ACTIVE';

    setRestaurants((prev) =>
      prev.map((r) => (r.id === restaurantId ? { ...r, status: nextStatus as any } : r))
    );

    try {
      await updateDoc(doc(db, 'restaurants', restaurantId), {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Firestore updateDoc suspend error:', err);
    }

    addAuditLog('TOGGLE_RESTAURANT_STATUS', 'restaurant', restaurantId, `Status changed to ${nextStatus}`);
  };

  const updateRestaurantCancellationPolicy = (restaurantId: string, policy: CancellationPolicy) => {
    setRestaurants((prev) =>
      prev.map((r) => (r.id === restaurantId ? { ...r, cancellationPolicy: policy } : r))
    );
    try {
      updateDoc(doc(db, 'restaurants', restaurantId), { cancellationPolicy: policy }).catch(() => {});
    } catch {}
  };

  const addMenuItemToRestaurant = (restaurantId: string, itemData: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = { ...itemData, id: `m-${Date.now()}` };
    setRestaurants((prev) =>
      prev.map((r) => {
        if (r.id === restaurantId) {
          const updatedMenu = [...(r.menu || []), newItem];
          try {
            updateDoc(doc(db, 'restaurants', restaurantId), { menu: updatedMenu }).catch(() => {});
          } catch {}
          return { ...r, menu: updatedMenu };
        }
        return r;
      })
    );
  };

  const updateMenuItemInRestaurant = (restaurantId: string, itemId: string, itemUpdates: Partial<MenuItem>) => {
    setRestaurants((prev) =>
      prev.map((r) => {
        if (r.id === restaurantId) {
          const updatedMenu = (r.menu || []).map((m) => (m.id === itemId ? { ...m, ...itemUpdates } : m));
          try {
            updateDoc(doc(db, 'restaurants', restaurantId), { menu: updatedMenu }).catch(() => {});
          } catch {}
          return { ...r, menu: updatedMenu };
        }
        return r;
      })
    );
  };

  const toggleItemAvailability = (restaurantId: string, itemId: string) => {
    setRestaurants((prev) =>
      prev.map((r) => {
        if (r.id === restaurantId) {
          const updatedMenu = (r.menu || []).map((m) =>
            m.id === itemId ? { ...m, isAvailable: !m.isAvailable } : m
          );
          try {
            updateDoc(doc(db, 'restaurants', restaurantId), { menu: updatedMenu }).catch(() => {});
          } catch {}
          return { ...r, menu: updatedMenu };
        }
        return r;
      })
    );
  };

  const updateRestaurantProfile = (restaurantId: string, updates: Partial<Restaurant>) => {
    setRestaurants((prev) =>
      prev.map((r) => {
        if (r.id === restaurantId) {
          const updated = { ...r, ...updates };
          try {
            updateDoc(doc(db, 'restaurants', restaurantId), updates).catch(() => {});
          } catch {}
          return updated;
        }
        return r;
      })
    );
  };

  // Create Booking
  const createBooking = (
    restaurantId: string,
    bookingType: 'table_only' | 'dish_preorder' | 'table_and_dishes',
    guests: number,
    seating: string,
    arrivalDate: string,
    arrivalTime: string,
    items: Array<{ menuItemId: string; name: string; price: number; quantity: number; notes?: string; isVeg: boolean }>,
    advancePercent: number,
    discountCode?: string
  ): Booking => {
    const restaurant = restaurants.find((r) => r.id === restaurantId) || {
      name: 'Local Food Stall',
      address: 'Karnataka',
      cancellationPolicy: {
        type: 'fixed' as const,
        deductionValue: 50,
        minDeductionCharge: 50,
        freeCancellationDeadlineMinutes: 30,
        allowCancellationAfterPrepStarts: false,
        termsText: 'Free cancellation up to 30 mins before arrival.',
      },
    };

    const campaign = discountCode ? discounts.find((d) => d.code === discountCode && d.isActive) : undefined;
    const totals = calculateOrderTotals(items, advancePercent, campaign);
    const receiptNum = generateReceiptNumber(restaurantId);
    const bookingId = `book-${Date.now().toString().slice(-6)}`;

    const newBooking: Booking = {
      id: bookingId,
      receiptNumber: receiptNum,
      customerId: currentUser.id || 'cust-anon',
      customerName: currentUser.name || 'Food Explorer',
      customerPhone: currentUser.phone || '+91 98765 43210',
      customerEmail: currentUser.email || 'customer@gmail.com',
      restaurantId,
      restaurantName: restaurant.name,
      restaurantAddress: restaurant.address,
      restaurantOwnerId: 'ownerId' in restaurant ? restaurant.ownerId : '',
      bookingType,
      numberOfGuests: guests,
      seatingPreference: seating,
      arrivalDate,
      arrivalTime,
      items: items.map((i) => ({ ...i })),
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      discountCode,
      taxes: totals.taxes,
      platformFee: totals.platformFee,
      totalAmount: totals.totalAmount,
      advancePercentage: totals.advancePercentage,
      advanceAmount: totals.advanceAmount,
      remainingAmount: totals.remainingAmount,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      cancellationPolicySnapshot: restaurant.cancellationPolicy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setBookings((prev) => [newBooking, ...prev]);

    // Save to Firestore (omitting trusted financial fields to satisfy security rules)
    try {
      const {
        subtotal,
        totalAmount,
        discountAmount,
        taxes,
        platformFee,
        advanceAmount,
        remainingAmount,
        adminPlatformCommission,
        merchantPayoutAmount,
        refundAmount,
        refundStatus,
        refundTransactionId,
        cancellationDeduction,
        ...customerBookingPayload
      } = newBooking as any;
      setDoc(doc(db, 'bookings', bookingId), customerBookingPayload).catch((e) => console.warn('Booking write:', e));
    } catch {}

    sendNotification(
      'owner',
      'owner',
      'New Table Booking Received! 🍲',
      `Booking #${receiptNum} by ${newBooking.customerName} for ${newBooking.arrivalDate} at ${newBooking.arrivalTime}`,
      'booking',
      bookingId
    );

    return newBooking;
  };

  const ownerAcceptBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'ACCEPTED', updatedAt: new Date().toISOString() } : b))
    );
    try {
      updateDoc(doc(db, 'bookings', bookingId), { status: 'ACCEPTED', updatedAt: new Date().toISOString() }).catch(() => {});
    } catch {}
  };

  const ownerRejectBooking = (bookingId: string, reason: string, alternativeTime?: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: 'REJECTED',
              rejectionReason: reason,
              suggestedAlternativeTime: alternativeTime,
              updatedAt: new Date().toISOString(),
            }
          : b
      )
    );
    try {
      updateDoc(doc(db, 'bookings', bookingId), {
        status: 'REJECTED',
        rejectionReason: reason,
        suggestedAlternativeTime: alternativeTime,
        updatedAt: new Date().toISOString(),
      }).catch(() => {});
    } catch {}
  };

  const customerPayAdvance = (
    bookingId: string,
    method = 'UPI',
    upiApp: 'gpay' | 'phonepe' | 'custom_upi' | 'card' | 'netbanking' = 'gpay',
    verifiedDetails?: { paymentId?: string; orderId?: string; signature?: string }
  ) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          const advancePaid = b.advanceAmount;
          const commission = Math.round(advancePaid * 0.02);
          const merchantShare = advancePaid - commission;

          const updated: Booking = {
            ...b,
            status: 'CONFIRMED',
            paymentStatus: 'ADVANCE_PAID',
            paymentMethod: method,
            upiApp,
            adminPlatformCommission: commission,
            merchantPayoutAmount: merchantShare,
            paymentDetails: {
              transactionId: verifiedDetails?.paymentId || `TXN_${Date.now()}`,
              orderId: verifiedDetails?.orderId,
              amountPaid: advancePaid,
              paymentMethod: method,
              status: 'SUCCESS',
            },
            updatedAt: new Date().toISOString(),
          };

          try {
            updateDoc(doc(db, 'bookings', bookingId), {
              status: 'CONFIRMED',
              paymentStatus: 'ADVANCE_PAID',
              paymentMethod: method,
              upiApp,
              adminPlatformCommission: commission,
              merchantPayoutAmount: merchantShare,
              paymentDetails: {
                transactionId: verifiedDetails?.paymentId || `TXN_${Date.now()}`,
                orderId: verifiedDetails?.orderId || '',
                amountPaid: advancePaid,
                paymentMethod: method,
                status: 'SUCCESS',
              },
              updatedAt: new Date().toISOString(),
            }).catch(() => {});
          } catch {}

          return updated;
        }
        return b;
      })
    );
  };

  const updateBookingLifecycleStatus = (bookingId: string, status: BookingStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status, updatedAt: new Date().toISOString() } : b))
    );
    try {
      updateDoc(doc(db, 'bookings', bookingId), { status, updatedAt: new Date().toISOString() }).catch(() => {});
    } catch {}
  };

  const completeRemainingPayment = (
    bookingId: string,
    method = 'UPI',
    upiApp: 'gpay' | 'phonepe' | 'custom_upi' | 'card' | 'netbanking' = 'gpay'
  ) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          const updated: Booking = {
            ...b,
            paymentStatus: 'FULLY_PAID',
            remainingAmount: 0,
            status: 'COMPLETED',
            updatedAt: new Date().toISOString(),
          };
          try {
            updateDoc(doc(db, 'bookings', bookingId), {
              paymentStatus: 'FULLY_PAID',
              remainingAmount: 0,
              status: 'COMPLETED',
              updatedAt: new Date().toISOString(),
            }).catch(() => {});
          } catch {}
          return updated;
        }
        return b;
      })
    );
  };

  const cancelCustomerBooking = (bookingId: string, reason: string): { deduction: number; refund: number } => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return { deduction: 0, refund: 0 };

    const minutesToArrival = 60; // Mock 1h ahead
    const outcome = calculateCancellationRefund(
      booking.advanceAmount,
      booking.cancellationPolicySnapshot,
      minutesToArrival
    );

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          const updated: Booking = {
            ...b,
            status: 'CANCELLED',
            paymentStatus: outcome.refundAmount > 0 ? 'PARTIALLY_REFUNDED' : b.paymentStatus,
            cancellationReason: reason,
            cancellationDeduction: outcome.deductionAmount,
            refundAmount: outcome.refundAmount,
            refundStatus: outcome.refundAmount > 0 ? 'PROCESSED' : 'PENDING',
            updatedAt: new Date().toISOString(),
          };
          try {
            updateDoc(doc(db, 'bookings', bookingId), {
              status: 'CANCELLED',
              cancellationReason: reason,
              cancellationDeduction: outcome.deductionAmount,
              refundAmount: outcome.refundAmount,
              refundStatus: outcome.refundAmount > 0 ? 'PROCESSED' : 'PENDING',
              updatedAt: new Date().toISOString(),
            }).catch(() => {});
          } catch {}
          return updated;
        }
        return b;
      })
    );

    addAuditLog('BOOKING_CANCELLED_BY_CUSTOMER', 'booking', bookingId, `Deduction ₹${outcome.deductionAmount}, Refund ₹${outcome.refundAmount}`);
    return { deduction: outcome.deductionAmount, refund: outcome.refundAmount };
  };

  const toggleLocationSharing = async (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const willShare = !booking.customerLocationShared;

    if (willShare) {
      try {
        const pos = await detectBrowserLocation();
        const locPayload = {
          lat: pos.latitude,
          lng: pos.longitude,
          updatedAt: new Date().toISOString(),
        };

        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId
              ? { ...b, customerLocationShared: true, customerCurrentLocation: locPayload }
              : b
          )
        );

        try {
          updateDoc(doc(db, 'bookings', bookingId), {
            customerLocationShared: true,
            customerCurrentLocation: locPayload,
          }).catch(() => {});
        } catch {}
      } catch (err: any) {
        console.warn('Location detection for sharing fallback:', err);
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId ? { ...b, customerLocationShared: true } : b
          )
        );
      }
    } else {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? { ...b, customerLocationShared: false, customerCurrentLocation: undefined }
            : b
        )
      );

      try {
        updateDoc(doc(db, 'bookings', bookingId), {
          customerLocationShared: false,
          customerCurrentLocation: null,
        }).catch(() => {});
      } catch {}
    }
  };

  const addCustomerReview = (
    restaurantId: string,
    bookingId: string,
    rating: number,
    foodRating: number,
    serviceRating: number,
    ambienceRating: number,
    comment: string,
    photos?: string[]
  ) => {
    const newRev: Review = {
      id: `rev-${Date.now()}`,
      restaurantId,
      customerId: currentUser.id,
      customerName: currentUser.name,
      bookingId,
      rating,
      foodRating,
      serviceRating,
      ambienceRating,
      comment,
      photos,
      verifiedDiner: true,
      createdAt: new Date().toISOString(),
    };
    setReviews((prev) => [newRev, ...prev]);
  };

  const createDiscountCampaign = (campaign: Omit<DiscountCampaign, 'id' | 'redemptionCount'>) => {
    const newCamp: DiscountCampaign = {
      ...campaign,
      id: `camp-${Date.now()}`,
      redemptionCount: 0,
    };
    setDiscounts((prev) => [newCamp, ...prev]);
    try {
      setDoc(doc(db, 'discounts', newCamp.id), newCamp).catch(() => {});
    } catch {}
    addAuditLog('CREATE_DISCOUNT_CAMPAIGN', 'discount', newCamp.id, `Created ${newCamp.code}: ${newCamp.title}`);
  };

  const toggleDiscountCampaign = (id: string) => {
    setDiscounts((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const updated = { ...d, isActive: !d.isActive };
          try {
            updateDoc(doc(db, 'discounts', id), { isActive: updated.isActive }).catch(() => {});
          } catch {}
          return updated;
        }
        return d;
      })
    );
  };

  const adminOverrideRefund = (bookingId: string, overrideAmount: number, adminNotes: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          const updated: Booking = {
            ...b,
            refundAmount: overrideAmount,
            refundStatus: 'OVERRIDDEN',
            updatedAt: new Date().toISOString(),
          };
          try {
            updateDoc(doc(db, 'bookings', bookingId), {
              refundAmount: overrideAmount,
              refundStatus: 'OVERRIDDEN',
              updatedAt: new Date().toISOString(),
            }).catch(() => {});
          } catch {}
          return updated;
        }
        return b;
      })
    );
    addAuditLog('ADMIN_REFUND_OVERRIDE', 'refund', bookingId, `Adjusted refund to ₹${overrideAmount}. Rationale: ${adminNotes}`);
  };

  // CSV Data Export Feature per user requirement #7
  const exportDataToCsv = (type: 'restaurants' | 'customers' | 'owners' | 'bookings' | 'transactions') => {
    let filename = `alookhaoge_${type}_${new Date().toISOString().slice(0, 10)}.csv`;
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (type === 'restaurants') {
      headers = ['Restaurant ID', 'Name', 'Owner Name', 'Owner Email', 'Phone', 'City', 'Area', 'Address', 'Status', 'Tables', 'Price For Two (INR)', 'Created At'];
      rows = restaurants.map((r) => [
        r.id,
        `"${(r.name || '').replace(/"/g, '""')}"`,
        `"${(r.ownerName || '').replace(/"/g, '""')}"`,
        r.email || '',
        r.phone || '',
        `"${(r.city || '').replace(/"/g, '""')}"`,
        `"${(r.area || '').replace(/"/g, '""')}"`,
        `"${(r.address || '').replace(/"/g, '""')}"`,
        r.status,
        r.totalTables || 6,
        r.priceForTwo || 150,
        r.createdAt || '',
      ]);
    } else if (type === 'customers') {
      // Exclude passwords, tokens, secrets
      headers = ['Customer ID', 'Full Name', 'Email', 'Phone', 'Role', 'Auth Provider', 'Created At'];
      const customerUsers = users.filter((u) => u.role === 'customer');
      rows = customerUsers.map((u) => [
        u.id,
        `"${(u.name || '').replace(/"/g, '""')}"`,
        u.email || '',
        u.phone || '',
        u.role,
        u.authProvider || 'google',
        u.createdAt || '',
      ]);
    } else if (type === 'owners') {
      headers = ['Owner ID', 'Full Name', 'Email', 'Phone', 'Linked Restaurant ID', 'Created At'];
      const ownerUsers = users.filter((u) => u.role === 'owner');
      rows = ownerUsers.map((u) => [
        u.id,
        `"${(u.name || '').replace(/"/g, '""')}"`,
        u.email || '',
        u.phone || '',
        u.restaurantId || 'N/A',
        u.createdAt || '',
      ]);
    } else if (type === 'bookings') {
      headers = ['Booking ID', 'Receipt Number', 'Restaurant', 'Customer Name', 'Customer Email', 'Date', 'Time', 'Party Size', 'Total (INR)', 'Advance (INR)', 'Status', 'Payment Status'];
      rows = bookings.map((b) => [
        b.id,
        b.receiptNumber,
        `"${(b.restaurantName || '').replace(/"/g, '""')}"`,
        `"${(b.customerName || '').replace(/"/g, '""')}"`,
        b.customerEmail || '',
        b.arrivalDate,
        b.arrivalTime,
        b.numberOfGuests || 2,
        b.totalAmount,
        b.advanceAmount,
        b.status,
        b.paymentStatus,
      ]);
    } else if (type === 'transactions') {
      headers = ['Transaction ID', 'Booking ID', 'Restaurant', 'Customer', 'Gross Amount (INR)', 'Merchant Share 98% (INR)', 'Platform Fee 2% (INR)', 'Payment Mode', 'Status', 'Timestamp'];
      rows = bookings
        .filter((b) => b.paymentStatus === 'ADVANCE_PAID' || b.paymentStatus === 'FULLY_PAID')
        .map((b) => {
          const gross = b.advanceAmount;
          const comm = Math.round(gross * 0.02);
          const merch = gross - comm;
          return [
            `tx-${b.id}`,
            b.id,
            `"${(b.restaurantName || '').replace(/"/g, '""')}"`,
            `"${(b.customerName || '').replace(/"/g, '""')}"`,
            gross,
            merch,
            comm,
            b.paymentMethod || 'UPI',
            'SUCCESS',
            b.updatedAt || b.createdAt,
          ];
        });
    }

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addAuditLog('DATA_EXPORT_CSV', 'settings', type, `Authorized admin extracted ${type} CSV dataset (${rows.length} rows)`);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const refreshPlatformData = async () => {
    try {
      const isSuper =
        firebaseUser &&
        (isAuthorizedAdminEmail(firebaseUser.email) || isAdminAuthenticated);

      if (isSuper) {
        logRestaurantEvent('Platform data refresh started (Super Admin)', { isSuper: true });
        const snap = await getDocs(collection(db, 'restaurants'));
        const list: Restaurant[] = [];
        snap.forEach((d) => list.push({ ...(d.data() as Restaurant), id: d.id }));
        setRestaurants(list);
        logRestaurantEvent('Platform data refresh finished: retrieved records', { count: list.length });
        try {
          localStorage.setItem(STORAGE_KEYS.RESTAURANTS, JSON.stringify(list));
        } catch {}
      } else if (firebaseUser) {
        logRestaurantEvent('Platform data refresh started (Owner/User)', { uid: firebaseUser.uid });
        const [activeSnap, ownerSnap] = await Promise.all([
          getDocs(query(collection(db, 'restaurants'), where('status', '==', 'ACTIVE'))),
          getDocs(query(collection(db, 'restaurants'), where('ownerId', '==', firebaseUser.uid))),
        ]);
        const map = new Map<string, Restaurant>();
        activeSnap.forEach((d) => map.set(d.id, { ...(d.data() as Restaurant), id: d.id }));
        ownerSnap.forEach((d) => map.set(d.id, { ...(d.data() as Restaurant), id: d.id }));
        const list = Array.from(map.values());
        setRestaurants(list);
        logRestaurantEvent('Platform data refresh finished: retrieved records', { count: list.length });
      } else {
        const snap = await getDocs(query(collection(db, 'restaurants'), where('status', '==', 'ACTIVE')));
        const list: Restaurant[] = [];
        snap.forEach((d) => list.push({ ...(d.data() as Restaurant), id: d.id }));
        setRestaurants(list);
      }
    } catch (err: any) {
      logRestaurantEvent('Platform data refresh failed', {
        message: err?.message,
        code: err?.code,
      });
      console.warn('refreshPlatformData error:', err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        currentUser,
        users,
        firebaseUser,
        isFirebaseConnected,
        switchUserRole,
        loginUser,
        logoutUser,
        updateUserProfile,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalRole,
        setAuthModalRole,
        isGoogleSignInModalOpen,
        setIsGoogleSignInModalOpen,
        googleSignInRole,
        setGoogleSignInRole,
        openGoogleSignIn,
        signInWithGoogle,
        isRedirectChecking,
        redirectAuthError,
        clearRedirectAuthError,
        sendPhoneOtp,
        verifyPhoneOtp,
        requireAuth,
        isAdminAuthenticated,
        adminLogin,
        adminLogout,
        isAdminLoginModalOpen,
        setIsAdminLoginModalOpen,
        currentLocation,
        setCurrentLocation,
        restaurants,
        selectedRestaurant,
        setSelectedRestaurant,
        activeCategory,
        setActiveCategory,
        searchQuery,
        setSearchQuery,
        bookings,
        activeBookingForTracking,
        setActiveBookingForTracking,
        createBooking,
        ownerAcceptBooking,
        ownerRejectBooking,
        customerPayAdvance,
        updateBookingLifecycleStatus,
        completeRemainingPayment,
        cancelCustomerBooking,
        toggleLocationSharing,
        reviews,
        addCustomerReview,
        updateRestaurantCancellationPolicy,
        addMenuItemToRestaurant,
        updateMenuItemInRestaurant,
        toggleItemAvailability,
        updateRestaurantProfile,
        registerRestaurant,
        adminApproveRestaurant,
        adminRejectRestaurant,
        adminSuspendRestaurant,
        discounts,
        createDiscountCampaign,
        toggleDiscountCampaign,
        adminOverrideRefund,
        auditLogs,
        exportDataToCsv,
        notifications,
        markNotificationAsRead,
        clearAllNotifications,
        receiptModalBooking,
        setReceiptModalBooking,
        refreshPlatformData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
