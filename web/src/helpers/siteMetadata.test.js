import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const indexHtml = readFileSync(resolve(import.meta.dir, '../../index.html'), 'utf8');

describe('site search metadata', () => {
  test('exposes the current G-Master API logo through crawler-visible icons', () => {
    expect(indexHtml).toContain('href="/favicon.ico"');
    expect(indexHtml).toContain('href="/logo.svg"');
    expect(indexHtml).toContain('href="/logo.png"');
    expect(indexHtml).toContain('rel="apple-touch-icon"');
    expect(indexHtml).toContain('href="/site.webmanifest"');
  });

  test('uses the current blue-purple brand color and share image metadata', () => {
    expect(indexHtml).toContain('content="#6366f1"');
    expect(indexHtml).toContain('property="og:image"');
    expect(indexHtml).toContain('content="https://gmapi.fun/logo.png"');
  });
});
