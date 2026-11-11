import {
  Restaurant,
  User,
  DiscountCampaign,
  Booking,
  Review,
  AuditLog,
  NotificationItem,
} from '../types';

/**
 * Clean initial database state: Zero dummy restaurants, zero mock bookings,
 * zero fake reviews, zero fake orders, zero hardcoded revenue statistics.
 * Only the configured authorized Super Admin account for platform management.
 */

export const INITIAL_USERS: User[] = [
  {
    id: 'user-atanunath66',
    name: 'Atanu Nath (Admin)',
    email: 'atanunath66@gmail.com',
    role: 'admin',
    phone: '+91 98765 43210',
    authProvider: 'email',
    createdAt: new Date().toISOString(),
  },
];

// Clean empty collections
export const INITIAL_RESTAURANTS: Restaurant[] = [];
export const INITIAL_DISCOUNTS: DiscountCampaign[] = [];
export const INITIAL_BOOKINGS: Booking[] = [];
export const INITIAL_REVIEWS: Review[] = [];
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
