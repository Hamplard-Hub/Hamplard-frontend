'use client';

import React, { useRef } from 'react';
import { X, Keyboard } from 'lucide-react';
import { useMobileDrawerFocusTrap } from '@/lib/hooks/use-focus-trap';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement>;
}

const SHORTCUTS = [
  { key: 'Space / K', action: 'Play / Pause video' },
  { key: 'F', action: 'Toggle Fullscreen' },
  { key: 'M', action: 'Mute / Unmute audio' },
  { key: '←  →', action: 'Seek backward / forward 10s' },
  { key: '↑  ↓', action: 'Volume up / down 10%' },
  { key: '0 – 9', action: 'Jump to 0% – 90% of video' },
];

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
  triggerRef,
}: KeyboardShortcutsModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useMobileDrawerFocusTrap({
    isOpen,
    containerRef: containerRef as React.RefObject<HTMLElement>,
    triggerRef,
    onClose,
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="keyboard-shortcuts-title"
        className="w-full max-w-md bg-ink-900 border border-white/20 text-white rounded-2xl p-6 shadow-2xl space-y-4"
        tabIndex={-1}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-saffron-400" />
            <h2 id="keyboard-shortcuts-title" className="text-lg font-semibold text-white">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full p-1 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          {SHORTCUTS.map((s) => (
            <div
              key={s.key}
              className="flex flex-col justify-between p-2.5 rounded-xl bg-white/5 border border-white/10"
            >
              <kbd className="self-start px-2 py-1 bg-white/15 rounded-md text-xs font-mono text-saffron-300 font-semibold mb-1 shadow-sm">
                {s.key}
              </kbd>
              <span className="text-xs text-slate-300 font-medium">{s.action}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-4 py-2 text-xs text-white bg-white/10 hover:bg-white/20 border-white/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
