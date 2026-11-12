"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.razorpayWebhook = void 0;
exports.verifyRazorpayWebhookSignature = verifyRazorpayWebhookSignature;
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * Verify Razorpay Webhook Signature using HMAC SHA-256 and the exact raw request body buffer.
 */
function verifyRazorpayWebhookSignature(rawBody, signature, secret) {
    if (!signature || !secret || !rawBody) {
        return false;
    }
    try {
        const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8');
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(bodyBuffer)
            .digest('hex');
        const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
        const actualBuffer = Buffer.from(signature, 'utf8');
        if (expectedBuffer.length !== actualBuffer.length) {
            return false;
        }
        return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
    }
    catch (err) {
        logger.error('[Webhook Signature] Verification error:', err);
        return false;
    }
}
/**
 * Cloud Function: razorpayWebhook
 *
 * Secure HTTPS endpoint triggered by Razorpay payment events.
 * Verifies authenticity, enforces idempotency, and updates Firestore state.
 */
exports.razorpayWebhook = (0, https_1.onRequest)({
    region: 'asia-south1', // Default low-latency region for Indian UPI payments
    cors: false, // Webhooks from Razorpay servers do not need browser CORS
    maxInstances: 10,
    timeoutSeconds: 60,
}, async (req, res) => {
    // 1. Enforce POST method only
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed. Webhooks only accept POST.' });
        return;
    }
    // 2. Retrieve Webhook Secret from environment configuration
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
        logger.error('[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET is not configured in environment.');
        res.status(500).json({ error: 'Webhook secret is not configured on server.' });
        return;
    }
    // 3. Extract and validate incoming signature header
    const rawSignature = req.headers['x-razorpay-signature'] || '';
    if (!rawSignature) {
        logger.warn('[Razorpay Webhook] Missing x-razorpay-signature header in request.');
        res.status(400).json({ error: 'Missing x-razorpay-signature header.' });
        return;
    }
    // 4. Extract raw request body
    const rawBody = req.rawBody ||
        (Buffer.isBuffer(req.body) ? req.body : null) ||
        (typeof req.body === 'string' ? Buffer.from(req.body) : null);
    if (!rawBody || rawBody.length === 0) {
        logger.warn('[Razorpay Webhook] Empty raw request body received.');
        res.status(400).json({ error: 'Empty request payload.' });
        return;
    }
    // 5. Cryptographic signature check
    const isValid = verifyRazorpayWebhookSignature(rawBody, rawSignature, webhookSecret);
    if (!isValid) {
        logger.warn('[Razorpay Webhook] Cryptographic signature check failed. Rejected unauthorized webhook.');
        res.status(400).json({ error: 'Invalid webhook signature.' });
        return;
    }
    // 6. Parse payload
    let eventPayload;
    try {
        eventPayload = typeof req.body === 'object' && req.body !== null
            ? req.body
            : JSON.parse(rawBody.toString('utf8'));
    }
    catch (parseError) {
        logger.error('[Razorpay Webhook] Failed to parse JSON body:', parseError);
        res.status(400).json({ error: 'Invalid JSON payload in webhook body.' });
        return;
    }
    const eventName = eventPayload.event || '';
    const eventId = req.headers['x-razorpay-event-id'] ||
        eventPayload.event_id ||
        eventPayload.id ||
        `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    logger.info(`[Razorpay Webhook] Verified event: ${eventName} (ID: ${eventId})`);
    // 7. Enforce Idempotency via Firestore event registry
    const eventDocRef = db.collection('webhook_events').doc(eventId);
    try {
        const alreadyProcessed = await db.runTransaction(async (transaction) => {
            const docSnapshot = await transaction.get(eventDocRef);
            if (docSnapshot.exists) {
                const data = docSnapshot.data();
                if (data?.status === 'PROCESSED') {
                    return true;
                }
            }
            transaction.set(eventDocRef, {
                eventId,
                event: eventName,
                status: 'PROCESSING',
                receivedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            return false;
        });
        if (alreadyProcessed) {
            logger.info(`[Razorpay Webhook] Event ${eventId} was already processed. Skipping duplicate.`);
            res.status(200).json({ status: 'already_processed', eventId });
            return;
        }
    }
    catch (txnErr) {
        logger.error('[Razorpay Webhook] Error checking event idempotency in Firestore:', txnErr);
        res.status(500).json({ error: 'Database transaction error checking idempotency.' });
        return;
    }
    // 8. Handle Event Types
    try {
        if (eventName === 'payment.captured') {
            const payment = eventPayload.payload?.payment?.entity;
            if (!payment) {
                logger.warn('[Razorpay Webhook] payment.captured missing payment entity.');
                res.status(400).json({ error: 'Missing payment entity in payload.' });
                return;
            }
            const paymentId = payment.id || '';
            const orderId = payment.order_id || '';
            const amountInPaise = payment.amount || 0;
            const amountInRupees = amountInPaise / 100;
            const method = payment.method || 'upi';
            const vpa = payment.vpa || null;
            const currency = payment.currency || 'INR';
            // Extract booking identifier from notes or description
            const notes = payment.notes || {};
            const bookingId = notes.bookingId ||
                notes.booking_id ||
                notes.orderId ||
                notes.order_id ||
                '';
            const adminPlatformCommission = Math.round(amountInRupees * 0.02 * 100) / 100;
            const merchantPayoutAmount = Math.max(0, Math.round((amountInRupees - adminPlatformCommission) * 100) / 100);
            const batch = db.batch();
            // A. Record Verified Payment in /payments/{paymentId}
            const paymentDocRef = db.collection('payments').doc(paymentId);
            batch.set(paymentDocRef, {
                paymentId,
                orderId,
                bookingId: bookingId || null,
                amount: amountInRupees,
                currency,
                status: 'CAPTURED',
                paymentMethod: method === 'upi' ? 'UPI' : method,
                vpa,
                customerEmail: payment.email || null,
                customerContact: payment.contact || null,
                adminPlatformCommission,
                merchantPayoutAmount,
                verifiedVia: 'RAZORPAY_WEBHOOK',
                webhookEventId: eventId,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            // B. Update Booking in /bookings/{bookingId}
            if (bookingId) {
                const bookingDocRef = db.collection('bookings').doc(bookingId);
                batch.set(bookingDocRef, {
                    status: 'CONFIRMED',
                    paymentStatus: 'ADVANCE_PAID',
                    paymentMethod: method === 'upi' ? 'UPI' : method,
                    adminPlatformCommission,
                    merchantPayoutAmount,
                    paymentDetails: {
                        transactionId: paymentId,
                        orderId,
                        amountPaid: amountInRupees,
                        paymentMethod: method === 'upi' ? 'UPI' : method,
                        status: 'SUCCESS',
                        verifiedAt: new Date().toISOString(),
                    },
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
            }
            // C. Mark Webhook Event as PROCESSED
            batch.update(eventDocRef, {
                status: 'PROCESSED',
                paymentId,
                orderId,
                bookingId: bookingId || null,
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            await batch.commit();
            logger.info(`[Razorpay Webhook] Successfully processed payment.captured for payment ${paymentId}, booking ${bookingId}`);
            res.status(200).json({ status: 'success', event: eventName, paymentId, bookingId });
            return;
        }
        if (eventName === 'payment.failed') {
            const payment = eventPayload.payload?.payment?.entity;
            const paymentId = payment?.id || '';
            const orderId = payment?.order_id || '';
            const notes = payment?.notes || {};
            const bookingId = notes.bookingId || notes.booking_id || '';
            const errorCode = payment?.error_code || 'PAYMENT_FAILED';
            const errorDescription = payment?.error_description || 'Payment failed or declined.';
            const batch = db.batch();
            if (paymentId) {
                const paymentDocRef = db.collection('payments').doc(paymentId);
                batch.set(paymentDocRef, {
                    paymentId,
                    orderId,
                    bookingId: bookingId || null,
                    status: 'FAILED',
                    errorCode,
                    errorDescription,
                    verifiedVia: 'RAZORPAY_WEBHOOK',
                    webhookEventId: eventId,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
            }
            if (bookingId) {
                const bookingDocRef = db.collection('bookings').doc(bookingId);
                batch.set(bookingDocRef, {
                    paymentStatus: 'FAILED',
                    paymentDetails: {
                        transactionId: paymentId,
                        orderId,
                        status: 'FAILED',
                        errorDescription,
                    },
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
            }
            batch.update(eventDocRef, {
                status: 'PROCESSED',
                paymentId,
                orderId,
                bookingId: bookingId || null,
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            await batch.commit();
            logger.info(`[Razorpay Webhook] Processed payment.failed for payment ${paymentId}`);
            res.status(200).json({ status: 'failure_recorded', event: eventName, paymentId, bookingId });
            return;
        }
        // Other events acknowledged gracefully without modifying payment state
        await eventDocRef.update({
            status: 'IGNORED',
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        logger.info(`[Razorpay Webhook] Acknowledged event ${eventName}`);
        res.status(200).json({ status: 'acknowledged', event: eventName });
    }
    catch (processError) {
        logger.error('[Razorpay Webhook] Error processing event in database:', processError);
        res.status(500).json({ error: 'Failed to process webhook event in database.' });
    }
});
//# sourceMappingURL=index.js.map