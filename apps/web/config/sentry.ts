import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

/**
 * Initialize Sentry for error tracking in production
 *
 * Setup Instructions:
 * 1. Create account at https://sentry.io
 * 2. Create new project for React
 * 3. Copy your DSN from project settings
 * 4. Add VITE_SENTRY_DSN to .env file
 * 5. Uncomment the initialization code below
 */

export const initSentry = () => {
  // Only initialize in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('Sentry: Skipped (not in production)');
    return;
  }

  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

  if (!sentryDsn) {
    console.warn('Sentry DSN not configured. Set VITE_SENTRY_DSN in .env file.');
    return;
  }

  // Uncomment to enable Sentry
  /*
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV,

    // Performance Monitoring
    integrations: [
      new BrowserTracing(),
    ],

    // Set tracesSampleRate to 1.0 to capture 100% of transactions
    // In production, consider lowering this value to reduce costs
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Capture unhandled promise rejections
    attachStacktrace: true,

    // Release tracking (optional)
    // release: 'hari-hr-system@' + process.env.npm_package_version,

    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive data from error reports
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers?.['authorization'];
        delete event.request.headers?.['cookie'];
      }

      // Filter out non-error events in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Would send to Sentry:', event);
        return null; // Don't actually send in dev
      }

      return event;
    },

    // Ignore specific errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'canvas.contentDocument',
      // Network errors that are expected
      'Network request failed',
      'NetworkError',
      // User cancelled actions
      'AbortError',
    ],

    // Sample rate for error events
    sampleRate: 1.0,
  });

  console.log('Sentry initialized successfully');
  */

  console.log('Sentry: Ready (uncomment init code to enable)');
};

/**
 * Manually capture an error to Sentry
 */
export const captureError = (error: Error, context?: Record<string, any>) => {
  if (process.env.NODE_ENV === 'production') {
    // Sentry.captureException(error, { extra: context });
    console.log('Would capture error to Sentry:', error, context);
  }
};

/**
 * Set user context for error tracking
 */
export const setUserContext = (user: { id: string; email?: string; name?: string }) => {
  if (process.env.NODE_ENV === 'production') {
    // Sentry.setUser(user);
    console.log('Would set Sentry user:', user);
  }
};

/**
 * Clear user context (on logout)
 */
export const clearUserContext = () => {
  if (process.env.NODE_ENV === 'production') {
    // Sentry.setUser(null);
    console.log('Would clear Sentry user');
  }
};

/**
 * Add breadcrumb for tracking user actions
 */
export const addBreadcrumb = (message: string, data?: Record<string, any>) => {
  if (process.env.NODE_ENV === 'production') {
    /*
    Sentry.addBreadcrumb({
      message,
      data,
      level: 'info',
      timestamp: Date.now() / 1000,
    });
    */
    console.log('Would add Sentry breadcrumb:', message, data);
  }
};
