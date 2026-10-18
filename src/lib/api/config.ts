// src/lib/api/config.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Fail loudly in production if API_URL is not set
if (typeof window === 'undefined') {
  // Server-side only check
  if (process.env.NODE_ENV === 'production' && !API_URL) {
    console.error(
      '❌ FATAL: NEXT_PUBLIC_API_URL is not set in production. ' +
      'The app will not work. Please set this environment variable before deploying.',
    );
  }
} else {
  // Client-side check
  if (!API_URL) {
    console.error(
      '❌ WARNING: NEXT_PUBLIC_API_URL is not set. ' +
      'Requests will fall back to http://localhost:3000/api/v1, which may not work in production.',
    );
  }
}

export const getApiUrl = () => API_URL ?? 'http://localhost:3000/api/v1';
