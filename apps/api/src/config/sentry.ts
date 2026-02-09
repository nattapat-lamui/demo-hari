import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

/**
 * Initialize Sentry for backend error tracking
 *
 * Setup Instructions:
 * 1. Create account at https://sentry.io
 * 2. Create new project for Node.js
 * 3. Copy your DSN from project settings
 * 4. Add SENTRY_DSN to .env file
 * 5. Uncomment the initialization code below
 */

export const initSentry = () => {
  // Only initialize in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('Sentry: Skipped (not in production)');
    return;
  }

  const sentryDsn = process.env.SENTRY_DSN;

  if (!sentryDsn) {
    console.warn('Sentry DSN not configured. Set SENTRY_DSN in .env file.');
    return;
  }

  // Uncomment to enable Sentry
  /*
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV,

    // Performance Monitoring
    integrations: [
      // Profiling
      new ProfilingIntegration(),
    ],

    // Set tracesSampleRate to 1.0 to capture 100% of transactions
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Set sampling rate for profiling
    profilesSampleRate: 0.1,

    // Capture unhandled promise rejections
    attachStacktrace: true,

    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive data
      if (event.request) {
        // Remove authorization headers
        if (event.request.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }

        // Remove sensitive body data
        if (event.request.data) {
          const data = event.request.data as any;
          if (data.password) data.password = '[REDACTED]';
          if (data.currentPassword) data.currentPassword = '[REDACTED]';
          if (data.newPassword) data.newPassword = '[REDACTED]';
        }
      }

      return event;
    },

    // Ignore specific errors
    ignoreErrors: [
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
    ],
  });

  console.log('Sentry initialized successfully');
  */

  console.log('Sentry: Ready (uncomment init code to enable)');
};

/**
 * Express error handler middleware for Sentry
 */
export const sentryErrorHandler = () => {
  // return Sentry.Handlers.errorHandler();
  return (err: any, req: any, res: any, next: any) => {
    // Placeholder - would capture to Sentry
    console.log('Sentry would capture:', err.message);
    next(err);
  };
};

/**
 * Express request handler middleware for Sentry
 */
export const sentryRequestHandler = () => {
  // return Sentry.Handlers.requestHandler();
  return (req: any, res: any, next: any) => {
    // Placeholder - would add request context
    next();
  };
};

/**
 * Express tracing middleware for performance monitoring
 */
export const sentryTracingHandler = () => {
  // return Sentry.Handlers.tracingHandler();
  return (req: any, res: any, next: any) => {
    // Placeholder - would track performance
    next();
  };
};
