import { describe, expect, test } from 'bun:test';

import {
  DEFAULT_FOOTER_DEMO_CONTAINER_CLASS,
  DEFAULT_FOOTER_MAIN_CONTAINER_CLASS,
} from './footerLayout.js';

describe('footer layout classes', () => {
  test('centers default footer content inside the page width', () => {
    expect(DEFAULT_FOOTER_MAIN_CONTAINER_CLASS).toContain('max-w-[1110px]');
    expect(DEFAULT_FOOTER_MAIN_CONTAINER_CLASS).toContain('mx-auto');
  });

  test('centers demo footer columns with the same page width', () => {
    expect(DEFAULT_FOOTER_DEMO_CONTAINER_CLASS).toContain('max-w-[1110px]');
    expect(DEFAULT_FOOTER_DEMO_CONTAINER_CLASS).toContain('mx-auto');
  });
});
