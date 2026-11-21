import DOMPurify from 'isomorphic-dompurify';

/** Safe subset of HTML allowed in instructor-authored lesson content. */
const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr', 'blockquote',
  'ul', 'ol', 'li',
  'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup',
  'a', 'img',
  'code', 'pre',
];

const ALLOWED_ATTR = ['href', 'src', 'alt', 'title', 'target', 'rel'];

// Only http(s), mailto and relative URLs. Blocks javascript:, data:, vbscript:, etc.
const ALLOWED_URI_REGEXP = /^(?:https?:|mailto:|\/|#|\.{1,2}\/)/i;

let hookRegistered = false;

function registerLinkHook() {
  if (hookRegistered) return;
  hookRegistered = true;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.nodeName === 'A' && node.hasAttribute('href')) {
      node.setAttribute('rel', 'noopener noreferrer');
      const href = node.getAttribute('href') ?? '';
      if (/^https?:/i.test(href)) node.setAttribute('target', '_blank');
    }
  });
}

/**
 * Sanitizes untrusted HTML before it is injected with dangerouslySetInnerHTML.
 * Strips scripts, event handlers and unsafe URLs; external links get
 * rel="noopener noreferrer".
 */
export function sanitizeHtml(dirty: string): string {
  registerLinkHook();
  return DOMPurify.sanitize(dirty ?? '', {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP,
    ALLOW_DATA_ATTR: false,
  });
}
