/**
 * Firebase Authentication Error Diagnostics & Structured Logging
 *
 * Implements strict error code mapping for Firebase Phone Authentication,
 * E.164 phone number formatting, and non-sensitive structured logging.
 */

export interface FormattedPhoneResult {
  isValid: boolean;
  formatted: string;
  error?: string;
}

/**
 * Validates and formats a phone number to international E.164 standard.
 * Default country is India (+91) if no country code is supplied.
 */
export function formatE164PhoneNumber(raw: string): FormattedPhoneResult {
  if (!raw || typeof raw !== 'string') {
    return {
      isValid: false,
      formatted: '',
      error: 'Please enter a mobile phone number.',
    };
  }

  // Strip whitespaces, dashes, dots, parentheses
  let cleaned = raw.trim().replace(/[\s\-\(\)\.]/g, '');

  if (!cleaned) {
    return {
      isValid: false,
      formatted: '',
      error: 'Please enter a mobile phone number.',
    };
  }

  // If already starts with '+', validate international E.164 (e.g. +919845012345)
  if (cleaned.startsWith('+')) {
    const digitsOnly = cleaned.slice(1);
    if (!/^\d+$/.test(digitsOnly)) {
      return {
        isValid: false,
        formatted: '',
        error: 'Phone number must contain only numeric digits after the country code (+).',
      };
    }
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      return {
        isValid: false,
        formatted: '',
        error: 'International phone numbers must be between 10 and 15 digits including country code.',
      };
    }
    return { isValid: true, formatted: cleaned };
  }

  // If starts with leading 0 (trunk prefix e.g. 09845012345), strip it
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.replace(/^0+/, '');
  }

  // If 10 digits, assume India (+91)
  if (/^\d{10}$/.test(cleaned)) {
    return {
      isValid: true,
      formatted: `+91${cleaned}`,
    };
  }

  // If 12 digits starting with 91, add '+'
  if (/^91\d{10}$/.test(cleaned)) {
    return {
      isValid: true,
      formatted: `+${cleaned}`,
    };
  }

  // Invalid length or non-digits
  if (!/^\d+$/.test(cleaned)) {
    return {
      isValid: false,
      formatted: '',
      error: 'Phone number can only contain numeric digits.',
    };
  }

  return {
    isValid: false,
    formatted: '',
    error: 'Please enter a valid 10-digit mobile number (e.g., 9845012345) or international format (+919845012345).',
  };
}

export interface AuthErrorInfo {
  code: string;
  message: string;
  actionRequired?: string;
}

/**
 * Maps Firebase Auth error codes to user-friendly messages and provides
 * clear guidance for Firebase Console configuration requirements.
 */
export function getFirebaseAuthErrorMessage(error: any): AuthErrorInfo {
  const code: string = error?.code || (typeof error === 'string' ? error : 'auth/unknown');
  const rawMessage: string = error?.message || String(error);

  switch (code) {
    case 'auth/invalid-phone-number':
      return {
        code,
        message: 'The phone number format is invalid. Please ensure it includes the country code (e.g., +91 for India).',
        actionRequired: 'Check phone number format in E.164 (+91XXXXXXXXXX).',
      };

    case 'auth/missing-phone-number':
      return {
        code,
        message: 'Phone number is missing. Please enter your mobile number.',
      };

    case 'auth/too-many-requests':
      return {
        code,
        message: 'We have blocked all requests from this device due to unusual activity. Please wait a few minutes and try again.',
        actionRequired: 'Firebase rate limiter triggered. Wait 15-30 minutes or test using a different IP/device.',
      };

    case 'auth/quota-exceeded':
      return {
        code,
        message: 'SMS quota for this Firebase project has been exceeded. Please contact the administrator or add test phone numbers.',
        actionRequired: 'Enable Firebase Blaze plan in Firebase Console or configure phone numbers for testing under Authentication -> Sign-in method -> Phone.',
      };

    case 'auth/captcha-check-failed':
      return {
        code,
        message: 'reCAPTCHA verification failed or timed out. Please refresh the page and try again.',
        actionRequired: 'Verify that the current domain is added to Authorized Domains in Firebase Console -> Authentication -> Settings -> Authorized domains.',
      };

    case 'auth/invalid-verification-code':
      return {
        code,
        message: 'The 6-digit OTP code entered is incorrect. Please check the code sent to your phone and retry.',
      };

    case 'auth/code-expired':
      return {
        code,
        message: 'The OTP code has expired. Please request a new verification code.',
      };

    case 'auth/operation-not-allowed':
      return {
        code,
        message: "Firebase Phone Authentication is not enabled in the Firebase Console. Please enable the 'Phone' sign-in provider.",
        actionRequired: "Go to Firebase Console -> Authentication -> Sign-in method -> Click 'Phone' -> Enable and save.",
      };

    case 'auth/billing-not-enabled':
      return {
        code,
        message: 'SMS sending requires an active billing account on the Firebase project.',
        actionRequired: 'Upgrade the Firebase project to the Blaze (Pay as you go) plan, or configure test numbers for free testing.',
      };

    case 'auth/network-request-failed':
      return {
        code,
        message: 'Network connection error. Please verify your internet connection and try again.',
      };

    case 'auth/popup-closed-by-user':
      return {
        code,
        message: 'Sign-in popup was closed before completing verification.',
      };

    case 'auth/cancelled-popup-request':
      return {
        code,
        message: 'Sign-in request was cancelled. Please try again.',
      };

    default:
      // Check if message contains known keywords
      if (rawMessage.toLowerCase().includes('recaptcha')) {
        return {
          code: 'auth/captcha-check-failed',
          message: 'reCAPTCHA verification issue. Please reload the page and try again.',
          actionRequired: 'Check Authorized Domains in Firebase Console.',
        };
      }
      return {
        code,
        message: rawMessage || 'An unexpected error occurred during authentication. Please try again.',
      };
  }
}

/**
 * Structured non-sensitive logging for Phone OTP workflow
 */
export function logOtpEvent(event: string, details?: Record<string, any>) {
  const sanitized: Record<string, any> = {};
  if (details) {
    for (const [key, val] of Object.entries(details)) {
      // Strictly redact any sensitive fields
      if (['otp', 'code', 'token', 'password', 'secret'].includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else if (key.toLowerCase().includes('phone') && typeof val === 'string') {
        // Mask phone number: show first 3 and last 4 digits
        sanitized[key] = val.length > 7 ? `${val.slice(0, 3)}****${val.slice(-4)}` : '***';
      } else {
        sanitized[key] = val;
      }
    }
  }
  console.log(`[OTP Debug] ${event}`, sanitized);
}

/**
 * Structured non-sensitive logging for Restaurant Registration & Approval workflow
 */
export function logRestaurantEvent(event: string, details?: Record<string, any>) {
  console.log(`[Restaurant Debug] ${event}`, details || {});
}
