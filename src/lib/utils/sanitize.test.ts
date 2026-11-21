import { describe, expect, it } from 'vitest';
import { sanitizeHtml } from './sanitize';

describe('sanitizeHtml', () => {
  it('removes script tags', () => {
    expect(sanitizeHtml('<p>Hi</p><script>alert(1)</script>')).toBe('<p>Hi</p>');
  });

  it('removes inline event handlers', () => {
    const out = sanitizeHtml('<img src="/a.png" onerror="alert(1)">');
    expect(out).not.toContain('onerror');
    expect(out).toContain('src="/a.png"');
  });

  it('removes javascript: URLs', () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).not.toContain('javascript:');
  });

  it('adds rel="noopener noreferrer" to external links', () => {
    const out = sanitizeHtml('<a href="https://example.com">x</a>');
    expect(out).toContain('rel="noopener noreferrer"');
  });

  it('overrides a malicious rel value', () => {
    const out = sanitizeHtml('<a href="https://example.com" rel="opener">x</a>');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).not.toContain('rel="opener"');
  });

  it('keeps allowed formatting', () => {
    const html = '<h2>T</h2><ul><li>a</li></ul><pre><code>x</code></pre>';
    expect(sanitizeHtml(html)).toBe(html);
  });

  it('strips disallowed tags such as iframe and style attributes', () => {
    const out = sanitizeHtml('<iframe src="https://e.com"></iframe><p style="x:y">a</p>');
    expect(out).toBe('<p>a</p>');
  });
});
