'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, Trash2, Download, FileText, Plus, FileDown, ChevronDown } from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import {
  downloadMarkdown,
  notesFilename,
  notesToMarkdown,
  printNotesAsPdf,
} from '@/lib/utils/notes-export';

// ── Types ──────────────────────────────────────────────────────────

export interface Note {
  id: string;
  timestamp: number; // seconds
  text: string;
  createdAt: string; // ISO string
}

interface NotesPanelProps {
  courseId: string;
  lectureId: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  courseTitle?: string;
  lectureTitle?: string;
}

// ── Helpers ────────────────────────────────────────────────────────

const STORAGE_PREFIX = 'hamplard_notes';

const storageKey = (courseId: string, lectureId: string) =>
  `${STORAGE_PREFIX}_${courseId}_${lectureId}`;

const loadNotes = (courseId: string, lectureId: string): Note[] => {
  try {
    const raw = localStorage.getItem(storageKey(courseId, lectureId));
    return raw ? (JSON.parse(raw) as Note[]) : [];
  } catch {
    return [];
  }
};

const saveNotes = (courseId: string, lectureId: string, notes: Note[]) => {
  try {
    localStorage.setItem(storageKey(courseId, lectureId), JSON.stringify(notes));
  } catch (e) {
    console.error('Failed to save notes to localStorage:', e);
  }
};

const generateId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// ── Component ──────────────────────────────────────────────────────

export default function NotesPanel({
  courseId,
  lectureId,
  videoRef,
  courseTitle,
  lectureTitle,
}: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close the export menu on outside click / Escape
  useEffect(() => {
    if (!exportMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!exportMenuRef.current?.contains(e.target as Node)) setExportMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExportMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [exportMenuOpen]);

  // Load notes on mount / when lecture changes
  useEffect(() => {
    setNotes(loadNotes(courseId, lectureId));
    setText('');
  }, [courseId, lectureId]);

  // Persist notes whenever they change
  const updateNotes = useCallback(
    (updater: (prev: Note[]) => Note[]) => {
      setNotes((prev) => {
        const next = updater(prev);
        saveNotes(courseId, lectureId, next);
        return next;
      });
    },
    [courseId, lectureId],
  );

  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setIsSaving(true);

    // Capture current video timestamp
    const timestamp = videoRef?.current ? Math.floor(videoRef.current.currentTime) : 0;

    const newNote: Note = {
      id: generateId(),
      timestamp,
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    updateNotes((prev) => [newNote, ...prev]);
    setText('');
    setIsSaving(false);
    textareaRef.current?.focus();
  };

  const handleDelete = (id: string) => {
    updateNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleTimestampClick = (timestamp: number) => {
    if (videoRef?.current) {
      videoRef.current.currentTime = timestamp;
      videoRef.current.play().catch(() => {
        // Autoplay may be blocked; that's fine
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  const exportMeta = { courseTitle, lectureTitle };
  const fallbackName = `${courseId}-${lectureId}`;

  const handleExportMarkdown = () => {
    setExportMenuOpen(false);
    if (notes.length === 0) return;
    downloadMarkdown(
      notesFilename(exportMeta, fallbackName, 'md'),
      notesToMarkdown(notes, exportMeta),
    );
  };

  const handleExportPdf = () => {
    setExportMenuOpen(false);
    if (notes.length === 0) return;
    printNotesAsPdf(notes, exportMeta);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-ink-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-ink-900 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-saffron-500" />
            Notes
          </h3>
          {notes.length > 0 && (
            <div ref={exportMenuRef} className="relative">
              <button
                onClick={() => setExportMenuOpen((o) => !o)}
                className="flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-700 transition-colors"
                aria-haspopup="menu"
                aria-expanded={exportMenuOpen}
                title="Export notes"
              >
                <Download className="w-3.5 h-3.5" />
                Export
                <ChevronDown className="w-3 h-3" />
              </button>
              {exportMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-1 w-40 z-20 bg-white border border-ink-100 rounded-lg shadow-lg py-1"
                >
                  <button
                    role="menuitem"
                    onClick={handleExportMarkdown}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-ink-700 hover:bg-ink-50 text-left"
                  >
                    <FileText className="w-3.5 h-3.5 text-ink-400" />
                    Markdown (.md)
                  </button>
                  <button
                    role="menuitem"
                    onClick={handleExportPdf}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-ink-700 hover:bg-ink-50 text-left"
                  >
                    <FileDown className="w-3.5 h-3.5 text-ink-400" />
                    PDF
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="space-y-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a note… (Ctrl+Enter to save)"
            rows={3}
            className="w-full resize-none text-sm bg-ink-50 border border-ink-200 rounded-xl px-3 py-2.5
                       placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-saffron-400
                       focus:border-transparent transition-all"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-ink-400">
              Timestamp will be captured automatically
            </span>
            <button
              onClick={handleSave}
              disabled={!text.trim() || isSaving}
              className="flex items-center gap-1 text-xs font-medium text-white bg-saffron-500
                         hover:bg-saffron-600 disabled:opacity-40 disabled:cursor-not-allowed
                         px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-3 h-3" />
              Save note
            </button>
          </div>
        </div>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-ink-400 px-4 py-12">
            <FileText className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs text-center">No notes yet. Start typing above to add timestamped notes.</p>
          </div>
        ) : (
          <div className="divide-y divide-ink-50">
            {notes.map((note) => (
              <div key={note.id} className="group px-4 py-3 hover:bg-ink-50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <button
                    onClick={() => handleTimestampClick(note.timestamp)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-saffron-600
                               bg-saffron-50 hover:bg-saffron-100 px-2 py-0.5 rounded-md
                               transition-colors flex-shrink-0 mt-0.5"
                    title="Click to seek video to this timestamp"
                  >
                    <Clock className="w-3 h-3" />
                    {formatDuration(note.timestamp)}
                  </button>

                  <button
                    onClick={() => handleDelete(note.id)}
                    className="opacity-0 group-hover:opacity-100 text-ink-400 hover:text-red-500
                               transition-all p-0.5 flex-shrink-0"
                    title="Delete note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-ink-700 mt-1.5 leading-relaxed whitespace-pre-wrap break-words">
                  {note.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}