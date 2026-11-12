export type UserRole = 'customer' | 'owner' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  authProvider: 'google' | 'phone' | 'email' | 'facebook';
  createdAt: string;
  restaurantId?: string; // If owner
  dietaryPreference?: 'all' | 'veg' | 'non-veg' | 'vegan';
  defaultAddress?: string;
  preferredLocation?: UserPreferredLocation;
}

export type FoodCategory =
  | 'Street Food'
  | 'Fast Food'
  | 'Chinese'
  | 'Indian'
  | 'Bengali Food'
  | 'South Indian'
  | 'Cafés'
  | 'Bakeries'
  | 'Desserts'
  | 'Beverages'
  | 'Family Restaurants'
  | 'Local Specialties';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isVeg: boolean;
  isAvailable: boolean;
  prepTimeMinutes: number;
  image: string;
  discountPercent?: number;
  bestseller?: boolean;
}

export interface CancellationPolicy {
  type: 'fixed' | 'percentage';
  deductionValue: number; // e.g. 15 for 15% or 40 for ₹40
  minDeductionCharge: number; // minimum deduction charge, e.g. ₹40
  maxDeductionCharge?: number;
  freeCancellationDeadlineMinutes: number; // e.g. 30 minutes before arrival
  allowCancellationAfterPrepStarts: boolean;
  termsText: string;
}

export type RestaurantStatus =
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'pending'
  | 'active'
  | 'suspended'
  | 'rejected';

export interface RestaurantLocation {
  address: string;
  locality: string;
  city: string;
  district: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number;
  longitude: number;
  placeId: string;
  formattedAddress: string;
  geocodingProvider: 'Google Maps' | 'Browser Geolocation' | 'GPS Verified';
  locationVerified: boolean;
  updatedAt: string;
}

export interface UserPreferredLocation {
  address: string;
  locality: string;
  city: string;
  latitude: number;
  longitude: number;
  placeId?: string;
  radiusKm?: number;
}

export interface Restaurant {
  id: string;
  name: string;
  tagline: string;
  description: string;
  ownerId: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  area: string;
  city: string;
  lat: number;
  lng: number;
  location?: RestaurantLocation;
  coverImage: string;
  galleryImages: string[];
  categories: FoodCategory[];
  openingTime: string; // "10:00 AM"
  closingTime: string; // "11:00 PM"
  averageRating: number;
  totalReviews: number;
  priceForTwo: number;
  status: RestaurantStatus;
  facilities: string[]; // e.g. "Outdoor Seating", "AC Seating", "Street Parking", "Takeaway", "UPI Accepted"
  featured?: boolean;
  discountOffer?: string; // e.g. "Flat 20% OFF", "Save up to 40%"
  cancellationPolicy: CancellationPolicy;
  menu: MenuItem[];
  totalTables: number;
  availableTables: number;
  upiId?: string; // Shop owner's UPI ID for direct payouts (never exposed unmasked in public UI)
  rejectionReason?: string;
  ownerPhone?: string;
  createdAt: string;
  updatedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
}

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'ACCEPTED'
  | 'CUSTOMER ARRIVING'
  | 'ARRIVED'
  | 'SERVED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export type PaymentStatus =
  | 'PENDING'
  | 'ADVANCE_PAID'
  | 'FULLY_PAID'
  | 'PARTIALLY_REFUNDED'
  | 'FULLY_REFUNDED'
  | 'FAILED';

export interface BookingItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  isVeg: boolean;
}

export interface Booking {
  id: string;
  receiptNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantOwnerId?: string;
  bookingType: 'table_only' | 'dish_preorder' | 'table_and_dishes';
  numberOfGuests: number;
  seatingPreference: string;
  arrivalDate: string; // "2026-11-10"
  arrivalTime: string; // "19:30" or "In 15 mins"
  items: BookingItem[];
  subtotal: number;
  discountAmount: number;
  discountCode?: string;
  taxes: number; // 5% GST
  platformFee: number; // ₹10
  totalAmount: number;
  advancePercentage: number; // e.g. 50 or 100
  advanceAmount: number;
  remainingAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string; // e.g. 'Google Pay (UPI)' | 'PhonePe (UPI)' | 'Direct UPI'
  upiApp?: 'gpay' | 'phonepe' | 'custom_upi' | 'card' | 'netbanking';
  merchantPayoutAmount?: number; // 98% of amount paid
  adminPlatformCommission?: number; // 2% of amount paid
  rejectionReason?: string;
  suggestedAlternativeTime?: string;
  cancellationPolicySnapshot: CancellationPolicy;
  cancellationReason?: string;
  cancellationDeduction?: number;
  refundAmount?: number;
  refundStatus?: 'PENDING' | 'PROCESSED' | 'FAILED' | 'OVERRIDDEN';
  refundTransactionId?: string;
  customerLocationShared?: boolean;
  customerCurrentLocation?: {
    lat: number;
    lng: number;
    updatedAt: string;
  };
  date?: string;
  timeSlot?: string;
  guests?: number;
  paymentDetails?: {
    transactionId?: string;
    orderId?: string;
    amountPaid?: number;
    paymentMethod?: string;
    status?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransaction {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  restaurantId: string;
  restaurantName: string;
  amount: number;
  merchantPayoutAmount?: number; // 98%
  adminPlatformCommission?: number; // 2% (credited to atanunath66@oksbi)
  paymentType: 'ADVANCE' | 'REMAINING' | 'FULL' | 'REFUND';
  method: 'GPay' | 'PhonePe' | 'UPI' | 'Card' | 'NetBanking';
  upiApp?: 'gpay' | 'phonepe' | 'custom_upi' | 'other';
  maskedMerchantUpi?: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
  status: 'SUCCESS' | 'FAILED' | 'REFUNDED';
  timestamp: string;
}

export interface Review {
  id: string;
  restaurantId: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  bookingId: string;
  rating: number; // 1-5
  foodRating: number;
  serviceRating: number;
  ambienceRating: number;
  comment: string;
  photos?: string[];
  verifiedDiner: boolean;
  createdAt: string;
}

export interface DiscountCampaign {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number; // e.g. 20 for 20% or 50 for ₹50
  minOrderValue: number;
  maxDiscountCap: number; // e.g. ₹100
  applicableToAll: boolean;
  restaurantIds?: string[];
  startDate: string;
  expiryDate: string;
  maxRedemptions: number;
  redemptionCount: number;
  isActive: boolean;
}

export interface NotificationItem {
  id: string;
  userId: string;
  role: UserRole;
  title: string;
  message: string;
  bookingId?: string;
  type: 'booking' | 'payment' | 'approval' | 'cancellation' | 'info';
  isRead: boolean;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminUsername: string;
  action: string;
  targetType: 'restaurant' | 'booking' | 'discount' | 'user' | 'refund' | 'settings';
  targetId: string;
  details: string;
  timestamp: string;
}
