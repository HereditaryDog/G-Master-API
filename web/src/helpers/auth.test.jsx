import { describe, expect, test } from 'bun:test';

import {
  getSafeLoginRedirectTarget,
  shouldUseDocumentNavigationForLoginRedirect,
  shouldShowAuthPageForRedirectLogin,
  shouldVerifyExistingSessionForRedirectLogin,
} from './authRedirect.js';

describe('auth redirect helpers', () => {
  test('keeps login route mounted for safe desktop authorization redirects', () => {
    expect(
      shouldShowAuthPageForRedirectLogin({
        hasUser: true,
        pathname: '/login',
        search:
          '?redirect=%2Fgaster-code%2Fdesktop-login%3Frequest_id%3Dgcr_test',
      }),
    ).toBe(true);
  });

  test('detects existing-session verification for desktop authorization redirects', () => {
    expect(
      shouldVerifyExistingSessionForRedirectLogin({
        hasUser: true,
        pathname: '/login',
        search:
          '?redirect=%2Fgaster-code%2Fdesktop-login%3Frequest_id%3Dgcr_test',
      }),
    ).toBe(true);
    expect(
      shouldVerifyExistingSessionForRedirectLogin({
        hasUser: false,
        pathname: '/login',
        search:
          '?redirect=%2Fgaster-code%2Fdesktop-login%3Frequest_id%3Dgcr_test',
      }),
    ).toBe(false);
    expect(
      shouldVerifyExistingSessionForRedirectLogin({
        hasUser: true,
        pathname: '/login',
        search: '?redirect=https%3A%2F%2Fevil.test',
      }),
    ).toBe(false);
  });

  test('does not keep login page visible for ordinary safe redirects', () => {
    expect(
      shouldShowAuthPageForRedirectLogin({
        hasUser: true,
        pathname: '/login',
        search: '?redirect=%2Fconsole',
      }),
    ).toBe(false);
  });

  test('rejects unsafe login redirect targets', () => {
    expect(
      getSafeLoginRedirectTarget('?redirect=https%3A%2F%2Fevil.test'),
    ).toBe('');
    expect(getSafeLoginRedirectTarget('?redirect=%2F%2Fevil.test')).toBe('');
  });

  test('uses document navigation for backend desktop authorization routes', () => {
    expect(
      shouldUseDocumentNavigationForLoginRedirect(
        '/gaster-code/desktop-login?request_id=gcr_test',
      ),
    ).toBe(true);
    expect(shouldUseDocumentNavigationForLoginRedirect('/console')).toBe(false);
  });
});
