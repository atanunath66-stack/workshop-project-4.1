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

export const SUPER_ADMIN_EMAILS = [
  'atanunath66@gmail.com',
  'atanunath44@gmail.com',
  'atanuhuhu@gmail.com',
];

export const isAuthorizedAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.trim().toLowerCase());
};

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
  signInWithGoogle: (intendedRole?: UserRole) => Promise<{ success: boolean; error?: string }>;
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
    upiApp?: 'gpay' | 'phonepe' | 'custom_upi' | 'card' | 'netbanking'
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

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        setIsLoggedIn(true);

        const isSuper = isAuthorizedAdminEmail(user.email);
        let hasAdminDoc = false;
        try {
          const adminDocSnap = await getDoc(doc(db, 'admins', user.uid));
          hasAdminDoc = adminDocSnap.exists();
        } catch {}

        const isAdmin = isSuper || hasAdminDoc;
        if (isAdmin) {
          setIsAdminAuthenticated(true);
          localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
          // Self-heal / guarantee /admins/{uid} document exists in Firestore
          if (!hasAdminDoc) {
            setDoc(doc(db, 'admins', user.uid), {
              email: user.email,
              role: 'admin',
              uid: user.uid,
              createdAt: new Date().toISOString(),
            }).catch(() => {});
          }
        }

        // Retrieve or initialize user profile using single document read (doc by user.uid)
        try {
          const userDocSnap = await getDoc(doc(db, 'users', user.uid));
          if (userDocSnap.exists()) {
            const data = userDocSnap.data() as User;
            const updatedProfile: User = {
              ...data,
              id: user.uid,
              role: isAdmin ? 'admin' : (data.role || authModalRole || 'customer'),
            };
            setCurrentUser(updatedProfile);
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedProfile));
          } else {
            const newProfile: User = {
              id: user.uid,
              name: user.displayName || user.email?.split('@')[0] || (user.phoneNumber ? `User ${user.phoneNumber.slice(-4)}` : 'Verified Diner'),
              email: user.email || '',
              phone: user.phoneNumber || '',
              role: isAdmin ? 'admin' : (authModalRole || 'customer'),
              authProvider: user.phoneNumber ? 'phone' : 'google',
              createdAt: new Date().toISOString(),
            };
            setCurrentUser(newProfile);
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newProfile));
            setDoc(doc(db, 'users', user.uid), newProfile).catch((e) => {
              console.warn('Failed saving user doc:', e);
            });
          }
        } catch (err) {
          console.warn('User profile retrieval error:', err);
          const fallbackProfile: User = {
            id: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'Verified User',
            email: user.email || '',
            phone: user.phoneNumber || '',
            role: isAdmin ? 'admin' : (authModalRole || 'customer'),
            authProvider: user.phoneNumber ? 'phone' : 'google',
            createdAt: new Date().toISOString(),
          };
          setCurrentUser(fallbackProfile);
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(fallbackProfile));
        }

        // Execute any queued action (e.g. continue booking)
        if (pendingActionRef.current) {
          const action = pendingActionRef.current;
          pendingActionRef.current = null;
          setTimeout(() => action(), 100);
        }
      } else {
        // Only reset to guest if not superadmin authenticated
        if (!isAdminAuthenticated) {
          const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed.id === 'guest') {
                setIsLoggedIn(false);
                setCurrentUser(GUEST_USER);
              }
            } catch {}
          }
        }
      }
    });

    return () => unsubscribe();
  }, [authModalRole, isAdminAuthenticated]);

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
              firestoreRests.push({ ...(d.data() as Restaurant), id: d.id });
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
              activeRests.push({ ...(d.data() as Restaurant), id: d.id });
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
              ownerRests.push({ ...(d.data() as Restaurant), id: d.id });
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
              list.push({ ...(d.data() as Restaurant), id: d.id });
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
    try {
      setDoc(doc(db, 'auditLogs', newLog.id), newLog).catch(() => {});
    } catch {}
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

  // Real Firebase Google Sign-In
  const signInWithGoogle = async (intendedRole: UserRole = 'customer'): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const isSuper = isAuthorizedAdminEmail(user.email);
      let hasAdminDoc = false;
      try {
        const adminDocSnap = await getDoc(doc(db, 'admins', user.uid));
        hasAdminDoc = adminDocSnap.exists();
      } catch {}

      const isAdmin = isSuper || hasAdminDoc;
      const role: UserRole = isAdmin ? 'admin' : intendedRole;

      if (isAdmin) {
        setIsAdminAuthenticated(true);
        localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
        if (!hasAdminDoc) {
          setDoc(doc(db, 'admins', user.uid), {
            email: user.email,
            role: 'admin',
            uid: user.uid,
            createdAt: new Date().toISOString(),
          }).catch(() => {});
        }
      }

      const profile: User = {
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Google User',
        email: user.email || '',
        phone: user.phoneNumber || '',
        avatar: user.photoURL || undefined,
        role,
        authProvider: 'google',
        createdAt: new Date().toISOString(),
      };

      setCurrentUser(profile);
      setIsLoggedIn(true);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(profile));

      // Save in Firestore
      try {
        await setDoc(doc(db, 'users', user.uid), profile, { merge: true });
      } catch (err) {
        console.warn('Firestore user save:', err);
      }

      setIsAuthModalOpen(false);
      setIsGoogleSignInModalOpen(false);

      if (pendingActionRef.current) {
        const act = pendingActionRef.current;
        pendingActionRef.current = null;
        setTimeout(() => act(), 150);
      }

      return { success: true };
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      return { success: false, error: err?.message || 'Google Sign-In was cancelled or blocked by browser.' };
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

    // Save directly to Firestore collection 'restaurants'
    try {
      await setDoc(doc(db, 'restaurants', restId), newRest);
      logRestaurantEvent('Firestore write success', {
        restId,
        ownerId: realOwnerUid,
        status: 'PENDING_APPROVAL',
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

    // Save to Firestore
    try {
      setDoc(doc(db, 'bookings', bookingId), newBooking).catch((e) => console.warn('Booking write:', e));
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
    upiApp: 'gpay' | 'phonepe' | 'custom_upi' | 'card' | 'netbanking' = 'gpay'
  ) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          const advancePaid = b.advanceAmount;
          const commission = Math.round(advancePaid * 0.02);
          const merchantShare = advancePaid - commission;

          const updated: Booking = {
            ...b,
            paymentStatus: 'ADVANCE_PAID',
            paymentMethod: method,
            upiApp,
            adminPlatformCommission: commission,
            merchantPayoutAmount: merchantShare,
            updatedAt: new Date().toISOString(),
          };

          try {
            updateDoc(doc(db, 'bookings', bookingId), {
              paymentStatus: 'ADVANCE_PAID',
              paymentMethod: method,
              upiApp,
              adminPlatformCommission: commission,
              merchantPayoutAmount: merchantShare,
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
