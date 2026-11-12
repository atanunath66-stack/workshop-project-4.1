import crypto from 'crypto';

/**
 * Verifies Razorpay Webhook Signature using HMAC SHA-256 and exact raw body buffer.
 * Uses constant-time comparison (crypto.timingSafeEqual) to prevent timing attacks.
 */
export function verifyRazorpayWebhookSignature(
  rawBody: Buffer | string,
  signature: string,
  secret: string
): boolean {
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
  } catch {
    return false;
  }
}
