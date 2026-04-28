export function isSafeLoginRedirectTarget(target) {
  if (!target || !target.startsWith('/') || target.startsWith('//')) {
    return false;
  }
  return true;
}

export function getSafeLoginRedirectTarget(search = '') {
  const params =
    search instanceof URLSearchParams ? search : new URLSearchParams(search);
  const target = params.get('redirect');
  return isSafeLoginRedirectTarget(target) ? target : '';
}

export function shouldShowAuthPageForRedirectLogin({
  hasUser,
  pathname,
  search,
}) {
  const target = getSafeLoginRedirectTarget(search);
  return (
    Boolean(hasUser) &&
    pathname === '/login' &&
    shouldUseDocumentNavigationForLoginRedirect(target)
  );
}

export function shouldUseDocumentNavigationForLoginRedirect(target) {
  return (
    target === '/gaster-code/desktop-login' ||
    target.startsWith('/gaster-code/desktop-login?')
  );
}
