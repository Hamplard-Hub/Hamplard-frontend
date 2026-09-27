'use client';

import { useCallback, useId, useRef, useState, useEffect } from 'react';
import { UploadCloud, FileText, X, RotateCcw, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────

export interface UploadedFileResult {
  fileName: string;
  size: number;
  url: string;
  duration?: number; // For video files, duration in seconds
}

interface FileUploadProps {
  /** Upload endpoint the file is POSTed to (multipart/form-data, field name "file") */
  uploadUrl: string;
  /** Extra form fields sent alongside the file, e.g. `{ type: 'thumbnail' }` */
  extraFields?: Record<string, string>;
  /** Accepted MIME types or extensions, e.g. `['image/png','image/jpeg']` or `['.pdf']` */
  accept?: string[];
  /** Max file size in bytes. Defaults to 100MB. */
  maxSizeBytes?: number;
  /** Allow selecting/dropping more than one file at once. Defaults to true. */
  multiple?: boolean;
  /** Max number of files allowed. When exceeded, extra files are rejected with a message. */
  maxFiles?: number;
  /** Called after a file finishes uploading successfully */
  onUploadComplete?: (file: UploadedFileResult) => void;
  /** Called if a file fails validation or upload */
  onUploadError?: (fileName: string, error: string) => void;
  /** Called with progress percentage (0-100) for single file uploads */
  onProgress?: (progress: number) => void;
  label?: string;
  hint?: string;
  className?: string;
}

type ItemStatus = 'uploading' | 'success' | 'error';

interface UploadItem {
  id: string;
  file: File;
  previewUrl: string | null;
  videoDuration?: number; // For video files
  status: ItemStatus;
  progress: number;
  errorMessage?: string;
  resultUrl?: string;
}

const DEFAULT_MAX_SIZE = 100 * 1024 * 1024; // 100MB

// ── Helpers ───────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function matchesAccept(file: File, accept?: string[]): boolean {
  if (!accept || accept.length === 0) return true;
  return accept.some((pattern) => {
    if (pattern.startsWith('.')) {
      return file.name.toLowerCase().endsWith(pattern.toLowerCase());
    }
    if (pattern.endsWith('/*')) {
      return file.type.startsWith(pattern.slice(0, -1));
    }
    return file.type === pattern;
  });
}

function describeAccept(accept?: string[]): string {
  if (!accept || accept.length === 0) return 'Any file type';
  return accept.map((a) => a.replace('.', '').replace('/*', '')).join(', ').toUpperCase();
}

// ── Component ────────────────────────────────────────────────────────────

export function FileUpload({
  uploadUrl,
  extraFields,
  accept,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  multiple = true,
  maxFiles,
  onUploadComplete,
  onUploadError,
  onProgress,
  label = 'Upload files',
  hint,
  className,
}: FileUploadProps) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRefs = useRef<Record<string, XMLHttpRequest>>({});
  const inputId = useId();

  function updateItem(id: string, patch: Partial<UploadItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  // Extract video duration from file
  const getVideoDuration = useCallback((file: File): Promise<number | undefined> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('video/')) {
        resolve(undefined);
        return;
      }

      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(Math.round(video.duration));
      };
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(undefined);
      };
      video.src = URL.createObjectURL(file);
    });
  }, []);

  const startUpload = useCallback(
    (item: UploadItem) => {
      const xhr = new XMLHttpRequest();
      xhrRefs.current[item.id] = xhr;

      const form = new FormData();
      form.append('file', item.file);
      Object.entries(extraFields ?? {}).forEach(([key, value]) => form.append(key, value));

      xhr.open('POST', uploadUrl);

      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('hamplard_token');
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          updateItem(item.id, { progress });
          onProgress?.(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          let url = '';
          try {
            const parsed = JSON.parse(xhr.responseText);
            url = parsed?.data?.url ?? parsed?.url ?? '';
          } catch {
            // Non-JSON response — leave url empty
          }
          updateItem(item.id, { status: 'success', progress: 100, resultUrl: url });
          onUploadComplete?.({
            fileName: item.file.name,
            size: item.file.size,
            url,
            duration: item.videoDuration,
          });
        } else {
          const message = `Upload failed (${xhr.status})`;
          updateItem(item.id, { status: 'error', errorMessage: message });
          onUploadError?.(item.file.name, message);
        }
      };

      xhr.onerror = () => {
        const message = 'Network error — please try again.';
        updateItem(item.id, { status: 'error', errorMessage: message });
        onUploadError?.(item.file.name, message);
      };

      xhr.onabort = () => {
        const message = 'Upload cancelled.';
        updateItem(item.id, { status: 'error', errorMessage: message });
        onUploadError?.(item.file.name, message);
      };

      xhr.send(form);
    },
    [uploadUrl, extraFields, onUploadComplete, onUploadError, onProgress],
  );

  const addFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const incoming = Array.from(fileList);
      const files = multiple ? incoming : incoming.slice(0, 1);

      const newItems: UploadItem[] = [];

      // Enforce maxFiles against already-tracked items plus this batch.
      const existingCount = items.length;
      const remaining = maxFiles != null ? Math.max(0, maxFiles - existingCount) : Infinity;

      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        const id = `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;

        if (index >= remaining) {
          const message = `You can attach at most ${maxFiles} file${maxFiles === 1 ? '' : 's'}.`;
          onUploadError?.(file.name, message);
          newItems.push({
            id,
            file,
            previewUrl,
            status: 'error',
            progress: 0,
            errorMessage: message,
          });
          continue;
        }

        if (!matchesAccept(file, accept)) {
          const message = `"${file.name}" isn't an accepted file type (${describeAccept(accept)}).`;
          onUploadError?.(file.name, message);
          newItems.push({
            id,
            file,
            previewUrl,
            status: 'error',
            progress: 0,
            errorMessage: message,
          });
          continue;
        }
        if (file.size > maxSizeBytes) {
          const message = `"${file.name}" is too large. Max size is ${formatBytes(maxSizeBytes)}.`;
          onUploadError?.(file.name, message);
          newItems.push({
            id,
            file,
            previewUrl,
            status: 'error',
            progress: 0,
            errorMessage: message,
          });
          continue;
        }

        // Get video duration if applicable
        const duration = await getVideoDuration(file);

        newItems.push({
          id,
          file,
          previewUrl,
          videoDuration: duration,
          status: 'uploading',
          progress: 0,
        });
      }

      setItems((prev) => (multiple ? [...prev, ...newItems] : newItems));

      newItems.filter((it) => it.status === 'uploading').forEach((it) => startUpload(it));
    },
    [multiple, maxFiles, items.length, accept, maxSizeBytes, onUploadError, startUpload, getVideoDuration],
  );

  const removeItem = useCallback((id: string) => {
    xhrRefs.current[id]?.abort();
    delete xhrRefs.current[id];
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((it) => it.id !== id);
    });
  }, []);

  const retryItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        const target = prev.find((it) => it.id === id);
        if (target) {
          updateItem(id, { status: 'uploading', progress: 0, errorMessage: undefined });
          startUpload({ ...target, status: 'uploading', progress: 0, errorMessage: undefined });
        }
        return prev;
      });
    },
    [startUpload],
  );

  useEffect(() => {
    return () => {
      Object.values(xhrRefs.current).forEach((xhr) => xhr.abort());
      xhrRefs.current = {};
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) void addFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) void addFiles(e.dataTransfer.files);
  };

  return (
    <div className={cn('w-full', className)}>
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors',
          dragActive
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
            : 'border-slate-300 hover:border-indigo-400 dark:border-slate-700',
        )}
      >
        <UploadCloud className="h-8 w-8 text-indigo-500" aria-hidden="true" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {hint ?? `Drag & drop or click to browse · ${describeAccept(accept)} · up to ${formatBytes(maxSizeBytes)}`}
        </span>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={accept?.join(',')}
          multiple={multiple}
          onChange={handleInputChange}
          className="sr-only"
        />
      </label>

      {items.length > 0 && (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                {item.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.previewUrl} alt={item.file.name} className="h-full w-full object-cover" />
                ) : item.file.type.startsWith('video/') ? (
                  <span className="flex h-full w-full items-center justify-center">
                    <Play className="h-5 w-5 text-indigo-500" aria-hidden="true" />
                  </span>
                ) : (
                  <span className="flex h-full w-full items-center justify-center">
                    <FileText className="h-5 w-5 text-slate-400" aria-hidden="true" />
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                  {item.file.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatBytes(item.file.size)}
                  {item.videoDuration != null && ` · ${item.videoDuration}s`}
                </p>

                {item.status === 'uploading' && (
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all"
                      style={{ width: `${item.progress}%` }}
                      role="progressbar"
                      aria-valuenow={item.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                )}

                {item.status === 'error' && item.errorMessage && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                    <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    {item.errorMessage}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {item.status === 'success' && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                )}
                {item.status === 'error' && (
                  <button
                    type="button"
                    onClick={() => retryItem(item.id)}
                    className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label={`Retry ${item.file.name}`}
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label={`Remove ${item.file.name}`}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FileUpload;
