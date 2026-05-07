import { describe, expect, test } from 'bun:test';

import { createMainNavLinks } from './useNavigation.js';

const passthrough = (value) => value;

describe('header navigation links', () => {
  test('shows Gaster Code after home when saved config predates the module', () => {
    const links = createMainNavLinks(passthrough, '/docs', {
      home: true,
      console: true,
      pricing: true,
      docs: true,
      about: true,
    });

    expect(links.map((link) => link.itemKey).slice(0, 3)).toEqual([
      'home',
      'gaster_code',
      'console',
    ]);
    expect(links.find((link) => link.itemKey === 'gaster_code')).toMatchObject({
      text: 'Gaster Code',
      to: '/gaster-code',
    });
  });

  test('allows admins to hide the Gaster Code navigation link', () => {
    const links = createMainNavLinks(passthrough, '/docs', {
      home: true,
      gaster_code: false,
      console: true,
      pricing: true,
      docs: true,
      about: true,
    });

    expect(links.map((link) => link.itemKey)).not.toContain('gaster_code');
  });
});
