'use client';

import { useEffect } from 'react';

/** Restore the opener's focus when an overlay closes or unmounts. */
export function useRestoreFocus(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;

    const opener = document.activeElement;

    return () => {
      if (opener instanceof HTMLElement && opener !== document.body && opener.isConnected) {
        opener.focus({ preventScroll: true });
      }
    };
  }, [isOpen]);
}
