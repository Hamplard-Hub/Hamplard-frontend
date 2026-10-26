'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'hamplard-low-bandwidth';

function detectSlowConnection(): boolean {
  if (typeof navigator === 'undefined') return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (!conn) return false;
  if (conn.saveData) return true;
  const slow = ['slow-2g', '2g', '3g'];
  return slow.includes(conn.effectiveType ?? '');
}

export function useLowBandwidth() {
  const [enabled, setEnabled] = useState(false);
  const [autoSuggested, setAutoSuggested] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setEnabled(stored === 'true');
        return;
      }
    } catch {}
    const slow = detectSlowConnection();
    if (slow) {
      setAutoSuggested(true);
    }
  }, []);

  const toggle = (value: boolean) => {
    setEnabled(value);
    setAutoSuggested(false);
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {}
  };

  return { enabled, toggle, autoSuggested };
}
