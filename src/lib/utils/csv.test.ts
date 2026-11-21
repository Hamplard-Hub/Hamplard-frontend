import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadCsv, toCsv } from './csv';

describe('toCsv', () => {
  it('joins cells with commas and rows with CRLF', () => {
    expect(toCsv([['a', 'b'], [1, true]])).toBe('a,b\r\n1,true');
  });

  it('quotes cells containing commas, quotes or line breaks', () => {
    expect(toCsv([['Sep 24, 2026', 'say "hi"', 'two\nlines']])).toBe(
      '"Sep 24, 2026","say ""hi""","two\nlines"',
    );
  });

  it('writes null and undefined as empty cells', () => {
    expect(toCsv([[null, 'x', undefined]])).toBe(',x,');
  });

  it('neutralises text that a spreadsheet would run as a formula', () => {
    expect(toCsv([['=HYPERLINK("x")', '+1', '-2', '@SUM(A1)']])).toBe(
      `"'=HYPERLINK(""x"")",'+1,'-2,'@SUM(A1)`,
    );
  });

  it('leaves negative numbers alone', () => {
    expect(toCsv([[-5]])).toBe('-5');
  });
});

describe('downloadCsv', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('downloads the CSV as a UTF-8 blob with the given filename', async () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn(() => 'blob:csv');
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadCsv('promo-codes-2026-09-24.csv', 'a,b');

    const blob = (createObjectURL.mock.calls[0] as unknown as [Blob])[0];
    expect(blob.type).toBe('text/csv;charset=utf-8');
    // text() decodes and drops the BOM, so check the raw bytes for it.
    const bytes = Array.from(new Uint8Array(await blob.arrayBuffer()));
    expect(bytes.slice(0, 3)).toEqual([0xef, 0xbb, 0xbf]);
    expect(await blob.text()).toBe('a,b');

    const link = click.mock.contexts[0] as HTMLAnchorElement;
    expect(link.download).toBe('promo-codes-2026-09-24.csv');
    expect(link.href).toBe('blob:csv');
    expect(link.isConnected).toBe(false);

    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:csv');
  });
});
