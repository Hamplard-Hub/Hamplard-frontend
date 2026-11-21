type WebVitalMetric = {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
};

const CORE_WEB_VITALS = new Set(['CLS', 'FID', 'INP', 'LCP']);
const ANALYTICS_ENDPOINT = '/api/analytics/web-vitals';
const THRESHOLDS = {
  CLS: 0.1,
  LCP: 2500,
} as const;

const sendToAnalytics = (metric: WebVitalMetric) => {
  if (process.env.NODE_ENV !== 'production') return;

  const payload = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    timestamp: Date.now(),
  });

  try {
    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      navigator.sendBeacon(ANALYTICS_ENDPOINT, new Blob([payload], { type: 'application/json' }));
      return;
    }

    fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Intentionally ignored: analytics is a best-effort stub in production.
  }
};

export const reportWebVitals = (metric: WebVitalMetric) => {
  if (!CORE_WEB_VITALS.has(metric.name)) return;

  const logDetails = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
  };

  if (process.env.NODE_ENV === 'development') {
    console.info('[Web Vitals]', logDetails);

    if (metric.name === 'LCP' && metric.value > THRESHOLDS.LCP) {
      console.warn(`[Web Vitals] Warning: ${metric.name} is above threshold (${metric.value}ms > ${THRESHOLDS.LCP}ms)`, logDetails);
    }

    if (metric.name === 'CLS' && metric.value > THRESHOLDS.CLS) {
      console.warn(`[Web Vitals] Warning: ${metric.name} is above threshold (${metric.value} > ${THRESHOLDS.CLS})`, logDetails);
    }
  }

  if (process.env.NODE_ENV === 'production') {
    sendToAnalytics(metric);
  }
};
