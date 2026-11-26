// src/lib/api/config.ts

/**
 * Get the API base URL. 
 * - Uses NEXT_PUBLIC_API_URL if available
 * - Falls back to localhost in development
 * - Warns in production if not configured
 */
export const getApiUrl = (): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (!apiUrl) {
    // Only warn on client-side in production
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      console.warn(
        'Warning: NEXT_PUBLIC_API_URL is not configured. ' +
        'Using localhost fallback which will not work in production.',
      );
    }
    return 'http://localhost:3000/api/v1';
  }
  
  return apiUrl;
};
