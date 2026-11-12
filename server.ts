import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import QRCode from 'qrcode';
import { verifyRazorpayWebhookSignature } from './src/utils/webhookVerification.ts';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration & Environment Secrets
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || RAZORPAY_KEY_SECRET;

const isRazorpayConfigured = Boolean(
  RAZORPAY_KEY_ID &&
  RAZORPAY_KEY_SECRET &&
  !RAZORPAY_KEY_ID.includes('placeholder') &&
  !RAZORPAY_KEY_SECRET.includes('placeholder')
);

// Razorpay Client Instance
const razorpay = isRazorpayConfigured
  ? new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    })
  : null;

// In-Memory Idempotency & Transaction Store
// (Guarantees duplicate webhook / verification requests never process twice)
const verifiedTransactions = new Map<string, any>();
const processedWebhookEventIds = new Set<string>();
const pendingOrders = new Map<string, any>();

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  // Capture raw request body for Razorpay Webhook HMAC signature verification
  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));

  // -------------------------------------------------------------
  // API: Gateway Configuration
  // -------------------------------------------------------------
  app.get('/api/payments/config', (_req: Request, res: Response) => {
    res.json({
      isConfigured: isRazorpayConfigured,
      keyId: isRazorpayConfigured ? RAZORPAY_KEY_ID : null,
      merchantName: 'ZAikya Hyperlocal Dining',
      currency: 'INR',
      message: isRazorpayConfigured
        ? 'Razorpay UPI payment gateway is ready'
        : 'Online payments are currently unavailable. No money has been charged.',
    });
  });

  // -------------------------------------------------------------
  // API: Create Payment Order on Trusted Backend
  // -------------------------------------------------------------
  app.post('/api/payments/create-order', async (req: Request, res: Response) => {
    try {
      const {
        bookingId,
        amount,
        currency = 'INR',
        restaurantName = 'ZAikya Restaurant',
        customerName = 'Diner',
        customerEmail = '',
        customerPhone = '',
        paymentType = 'ADVANCE',
      } = req.body;

      if (!bookingId || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid booking order request. Booking ID and positive amount are required.',
        });
      }

      // If Razorpay gateway credentials are not configured, display exact requirement message
      if (!isRazorpayConfigured || !razorpay) {
        return res.status(503).json({
          success: false,
          isConfigured: false,
          message: 'Online payments are currently unavailable. No money has been charged.',
        });
      }

      // Amount in paise (1 INR = 100 paise)
      const amountInPaise = Math.round(amount * 100);

      // Create Razorpay Order securely using server secret
      const receiptId = `rcpt_${bookingId.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}_${Date.now().toString().slice(-4)}`;
      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency,
        receipt: receiptId,
        notes: {
          bookingId,
          restaurantName,
          paymentType,
          customerName,
          customerPhone,
        },
      });

      // Save order metadata in server store
      pendingOrders.set(order.id, {
        orderId: order.id,
        bookingId,
        amount,
        amountInPaise,
        currency,
        createdAt: new Date().toISOString(),
      });

      return res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: RAZORPAY_KEY_ID,
        bookingId,
        restaurantName,
        customerName,
        customerEmail,
        customerPhone,
      });
    } catch (err: any) {
      console.error('[Payment Backend] Error creating Razorpay order:', err);
      return res.status(500).json({
        success: false,
        message: err?.error?.description || err?.message || 'Failed to create payment order on gateway.',
      });
    }
  });

  // -------------------------------------------------------------
  // API: Secure Payment Verification (Signature + Gateway API Fetch)
  // -------------------------------------------------------------
  app.post('/api/payments/verify', async (req: Request, res: Response) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        bookingId,
        amount,
      } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
        return res.status(400).json({
          success: false,
          message: 'Missing verification parameters (order_id, payment_id, signature, bookingId are required).',
        });
      }

      if (!isRazorpayConfigured || !razorpay) {
        return res.status(503).json({
          success: false,
          isConfigured: false,
          message: 'Online payments are currently unavailable. No money has been charged.',
        });
      }

      // Step 1: Idempotency check — prevent duplicate payments or multiple processing
      if (verifiedTransactions.has(razorpay_payment_id)) {
        const existing = verifiedTransactions.get(razorpay_payment_id);
        return res.json({
          success: true,
          verified: true,
          alreadyProcessed: true,
          ...existing,
        });
      }

      // Step 2: Backend Cryptographic Signature Verification
      const generatedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        console.warn('[Payment Backend] Signature mismatch on payment verification:', {
          received: razorpay_signature,
          expected: generatedSignature,
        });
        return res.status(400).json({
          success: false,
          verified: false,
          message: 'Payment verification failed: Signature mismatch.',
        });
      }

      // Step 3: Server-side API verification directly against Razorpay
      const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);

      if (!paymentDetails) {
        return res.status(404).json({
          success: false,
          verified: false,
          message: 'Payment details could not be retrieved from gateway.',
        });
      }

      // Step 4: Validate transaction state & consistency
      if (paymentDetails.status !== 'captured' && paymentDetails.status !== 'authorized') {
        return res.status(400).json({
          success: false,
          verified: false,
          status: 'FAILED',
          message: `Payment status is ${paymentDetails.status}. Only captured transactions can confirm reservations.`,
        });
      }

      if (paymentDetails.order_id !== razorpay_order_id) {
        return res.status(400).json({
          success: false,
          verified: false,
          message: 'Order ID mismatch between signature and gateway record.',
        });
      }

      const verifiedAmountINR = Number(paymentDetails.amount) / 100;
      const merchantPayoutAmount = Math.round(verifiedAmountINR * 0.98); // 98% Merchant credit
      const adminPlatformCommission = Math.round(verifiedAmountINR * 0.02); // 2% ZAikya platform facilitation fee

      // Step 5: Store verified transaction securely
      const transactionRecord = {
        transactionId: razorpay_payment_id,
        orderId: razorpay_order_id,
        bookingId,
        amount: verifiedAmountINR,
        status: 'SUCCESS',
        method: paymentDetails.method || 'upi',
        upiApp: (paymentDetails as any).vpa ? 'custom_upi' : 'generic',
        vpa: (paymentDetails as any).vpa || null,
        merchantPayoutAmount,
        adminPlatformCommission,
        verifiedAt: new Date().toISOString(),
      };

      verifiedTransactions.set(razorpay_payment_id, transactionRecord);

      return res.json({
        success: true,
        verified: true,
        ...transactionRecord,
      });
    } catch (err: any) {
      console.error('[Payment Backend] Error verifying payment:', err);
      return res.status(500).json({
        success: false,
        message: err?.error?.description || err?.message || 'Server-side payment verification failed.',
      });
    }
  });

  // -------------------------------------------------------------
  // API: Razorpay Webhook Endpoint with Signature Verification
  // -------------------------------------------------------------
  app.post('/api/payments/webhook', async (req: any, res: Response) => {
    try {
      const webhookSignature = req.headers['x-razorpay-signature'];
      const rawBody = req.rawBody;

      if (!webhookSignature || !rawBody) {
        return res.status(400).json({ error: 'Missing webhook signature or raw body' });
      }

      // Verify webhook HMAC signature using timing-safe comparison
      const isValidSignature = verifyRazorpayWebhookSignature(
        rawBody,
        String(webhookSignature),
        RAZORPAY_WEBHOOK_SECRET
      );

      if (!isValidSignature) {
        console.warn('[Payment Webhook] Webhook signature verification failed');
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }

      const event = req.body;
      const eventId =
        (req.headers['x-razorpay-event-id'] as string) ||
        event?.event_id ||
        event?.id ||
        `${event?.event}_${event?.payload?.payment?.entity?.id}`;

      // Deduplicate webhook events
      if (processedWebhookEventIds.has(eventId)) {
        return res.status(200).json({ status: 'already_processed', eventId });
      }
      processedWebhookEventIds.add(eventId);

      console.log(`[Payment Webhook] Verified event received: ${event.event}`, {
        eventId,
        paymentId: event?.payload?.payment?.entity?.id,
        amount: event?.payload?.payment?.entity?.amount,
      });

      if (event.event === 'payment.captured' || event.event === 'order.paid') {
        const paymentEntity = event?.payload?.payment?.entity;
        if (paymentEntity?.id) {
          const bookingId = paymentEntity.notes?.bookingId || paymentEntity.notes?.booking_id;
          const amountINR = Number(paymentEntity.amount) / 100;
          verifiedTransactions.set(paymentEntity.id, {
            transactionId: paymentEntity.id,
            orderId: paymentEntity.order_id,
            bookingId,
            amount: amountINR,
            status: 'SUCCESS',
            method: paymentEntity.method,
            vpa: paymentEntity.vpa || null,
            merchantPayoutAmount: Math.round(amountINR * 0.98),
            adminPlatformCommission: Math.round(amountINR * 0.02),
            verifiedAt: new Date().toISOString(),
          });
        }
      } else if (event.event === 'payment.failed') {
        const paymentEntity = event?.payload?.payment?.entity;
        if (paymentEntity?.id) {
          const bookingId = paymentEntity.notes?.bookingId || paymentEntity.notes?.booking_id;
          verifiedTransactions.set(paymentEntity.id, {
            transactionId: paymentEntity.id,
            orderId: paymentEntity.order_id,
            bookingId,
            status: 'FAILED',
            errorCode: paymentEntity.error_code,
            errorDescription: paymentEntity.error_description || 'Payment failed',
            verifiedAt: new Date().toISOString(),
          });
        }
      }

      return res.status(200).json({ status: 'ok', received: true, eventId });
    } catch (err: any) {
      console.error('[Payment Webhook] Error processing webhook:', err);
      return res.status(500).json({ error: 'Webhook processing failure' });
    }
  });

  // -------------------------------------------------------------
  // API: Dynamic UPI QR Code Generation (per booking)
  // -------------------------------------------------------------
  app.post('/api/payments/dynamic-qr', async (req: Request, res: Response) => {
    try {
      const {
        bookingId,
        amount,
        restaurantName = 'ZAikya Restaurant',
        payeeUpi = 'merchant.zaikya@oksbi',
      } = req.body;

      if (!bookingId || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Booking ID and positive amount are required to generate a dynamic UPI QR code.',
        });
      }

      // Unique transaction reference for this booking session
      const transactionRef = `ZA${bookingId.replace(/[^a-zA-Z0-9]/g, '').slice(-6)}${Date.now().toString().slice(-4)}`;
      const note = `ZAikya Table Booking ${bookingId}`;

      // NPCI standard UPI payment intent URL
      const upiUrl = `upi://pay?pa=${encodeURIComponent(payeeUpi)}&pn=${encodeURIComponent(
        restaurantName
      )}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}&tr=${encodeURIComponent(
        transactionRef
      )}`;

      // Generate high-resolution, high-contrast dynamic QR code
      const qrCodeDataUrl = await QRCode.toDataURL(upiUrl, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 320,
        color: {
          dark: '#25152F', // Midnight Plum for QR dark modules
          light: '#FFFFFF', // Clean White background
        },
      });

      // QR Code valid for 15 minutes
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      return res.json({
        success: true,
        qrCodeDataUrl,
        upiUrl,
        transactionRef,
        amount,
        currency: 'INR',
        bookingId,
        restaurantName,
        payeeUpi,
        expiresAt,
      });
    } catch (err: any) {
      console.error('[Payment Backend] Error generating dynamic QR code:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate dynamic UPI QR code.',
      });
    }
  });

  // -------------------------------------------------------------
  // API: UPI ID Collect Request Endpoint
  // -------------------------------------------------------------
  app.post('/api/payments/upi-collect', async (req: Request, res: Response) => {
    try {
      const { bookingId, upiId, amount, restaurantName = 'ZAikya' } = req.body;

      // Validate UPI ID format
      const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
      if (!upiId || !upiRegex.test(upiId.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid UPI ID (e.g. yourname@oksbi, mobile@paytm).',
        });
      }

      if (!isRazorpayConfigured || !razorpay) {
        return res.status(503).json({
          success: false,
          isConfigured: false,
          message: 'Online payments are currently unavailable. No money has been charged.',
        });
      }

      // Check merchant eligibility for S2S collect requests
      // Standard Razorpay accounts use checkout collect or UPI intent
      // We inform the user honestly without building an unsupported direct SMS/notification system
      return res.json({
        success: false,
        collectSupported: false,
        message:
          'Direct merchant collect request is not enabled for this gateway account tier. Please use the Dynamic UPI QR Code or launch Google Pay / PhonePe directly.',
        alternative: 'qr_or_intent',
        validatedUpiId: upiId.trim(),
      });
    } catch (err: any) {
      console.error('[Payment Backend] Error processing UPI collect:', err);
      return res.status(500).json({
        success: false,
        message: err?.message || 'Error checking UPI collect availability.',
      });
    }
  });

  // -------------------------------------------------------------
  // API: Real-Time Payment Status Query
  // -------------------------------------------------------------
  app.get('/api/payments/status/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Check server verified store first
      if (verifiedTransactions.has(id)) {
        return res.json({
          success: true,
          status: 'SUCCESS',
          ...verifiedTransactions.get(id),
        });
      }

      if (!isRazorpayConfigured || !razorpay) {
        return res.json({
          success: true,
          status: 'PENDING',
          isConfigured: false,
          message: 'Payment status is PENDING.',
        });
      }

      // If id is a payment ID, fetch from Razorpay
      if (id.startsWith('pay_')) {
        const payment = await razorpay.payments.fetch(id);
        const isSuccess = payment.status === 'captured' || payment.status === 'authorized';
        return res.json({
          success: true,
          status: isSuccess ? 'SUCCESS' : payment.status.toUpperCase(),
          amount: Number(payment.amount) / 100,
          method: payment.method,
          vpa: (payment as any).vpa || null,
        });
      }

      // If id is an order ID, fetch payments for order
      if (id.startsWith('order_')) {
        const orderPayments = await razorpay.orders.fetchPayments(id);
        const capturedPayment = orderPayments.items?.find((p: any) => p.status === 'captured');
        if (capturedPayment) {
          return res.json({
            success: true,
            status: 'SUCCESS',
            transactionId: capturedPayment.id,
            amount: Number(capturedPayment.amount) / 100,
            method: capturedPayment.method,
          });
        }
      }

      return res.json({
        success: true,
        status: 'PENDING',
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err?.message || 'Could not query transaction status from gateway.',
      });
    }
  });

  // -------------------------------------------------------------
  // Mount Vite or Serve Static Frontend
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`[ZAikya Server] Running on http://0.0.0.0:${port}`);
    console.log(`[ZAikya Server] Razorpay Gateway Configured: ${isRazorpayConfigured}`);
  });
}

startServer();
