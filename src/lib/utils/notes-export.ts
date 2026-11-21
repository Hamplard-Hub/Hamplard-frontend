import { formatDuration } from './index';

export interface ExportableNote {
  timestamp: number; // seconds
  text: string;
  createdAt: string; // ISO string
}

export interface NotesExportMeta {
  courseTitle?: string;
  lectureTitle?: string;
}

/** Notes are stored newest-first; exports read better in video order. */
const sortByTimestamp = (notes: ExportableNote[]) =>
  [...notes].sort((a, b) => a.timestamp - b.timestamp);

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

export const notesFilename = (
  meta: NotesExportMeta,
  fallback: string,
  extension: 'md' | 'pdf',
) => {
  const base = slugify([meta.courseTitle, meta.lectureTitle].filter(Boolean).join(' ')) || fallback;
  return `notes-${base}.${extension}`;
};

/** Build a Markdown document with one section per timestamped note. */
export const notesToMarkdown = (notes: ExportableNote[], meta: NotesExportMeta = {}): string => {
  const lines: string[] = [];
  lines.push(`# ${meta.lectureTitle ? `Notes: ${meta.lectureTitle}` : 'Lecture Notes'}`);
  if (meta.courseTitle) lines.push('', `**Course:** ${meta.courseTitle}`);
  lines.push('', `_Exported ${new Date().toLocaleString()} · ${notes.length} note${notes.length === 1 ? '' : 's'}_`, '');

  for (const note of sortByTimestamp(notes)) {
    lines.push(`## [${formatDuration(note.timestamp)}]`, '', note.text.trim(), '');
  }

  return lines.join('\n');
};

export const downloadMarkdown = (filename: string, markdown: string): void => {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 0);
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Export notes as PDF by rendering a print-ready document in a hidden iframe
 * and opening the browser's print dialog ("Save as PDF"). This avoids shipping
 * a PDF library for a single feature.
 */
export const printNotesAsPdf = (notes: ExportableNote[], meta: NotesExportMeta = {}): void => {
  const title = meta.lectureTitle ? `Notes: ${meta.lectureTitle}` : 'Lecture Notes';

  const items = sortByTimestamp(notes)
    .map(
      (note) => `
        <article class="note">
          <span class="ts">${formatDuration(note.timestamp)}</span>
          <p>${escapeHtml(note.text.trim())}</p>
        </article>`,
    )
    .join('');

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { margin: 18mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .meta { font-size: 12px; color: #666; margin: 0 0 20px; }
    .note { break-inside: avoid; border-top: 1px solid #e5e5e5; padding: 10px 0; }
    .ts { display: inline-block; font-size: 11px; font-weight: 600; color: #b45309;
          background: #fef3c7; padding: 2px 6px; border-radius: 4px; }
    .note p { font-size: 13px; line-height: 1.5; margin: 6px 0 0; white-space: pre-wrap; word-break: break-word; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="meta">${meta.courseTitle ? `${escapeHtml(meta.courseTitle)} · ` : ''}${notes.length} note${notes.length === 1 ? '' : 's'} · Exported ${escapeHtml(new Date().toLocaleString())}</p>
  ${items}
</body>
</html>`;

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => setTimeout(() => iframe.remove(), 500);
  win.addEventListener('afterprint', cleanup, { once: true });

  // Give the iframe a tick to lay out before printing.
  setTimeout(() => {
    win.focus();
    win.print();
    // Fallback for browsers that don't fire afterprint on iframes.
    setTimeout(() => iframe.isConnected && iframe.remove(), 60_000);
  }, 100);
};
