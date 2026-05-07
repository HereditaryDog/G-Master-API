/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import { useMemo } from 'react';

export const DEFAULT_HEADER_NAV_MODULES = {
  home: true,
  gaster_code: true,
  console: true,
  pricing: {
    enabled: true,
    requireAuth: false,
  },
  docs: true,
  about: true,
};

export const normalizeHeaderNavModules = (headerNavModules) => {
  const modules = headerNavModules || {};
  const pricing = modules.pricing;

  return {
    ...DEFAULT_HEADER_NAV_MODULES,
    ...modules,
    pricing:
      typeof pricing === 'object' && pricing !== null
        ? {
            ...DEFAULT_HEADER_NAV_MODULES.pricing,
            ...pricing,
          }
        : {
            ...DEFAULT_HEADER_NAV_MODULES.pricing,
            enabled:
              typeof pricing === 'boolean'
                ? pricing
                : DEFAULT_HEADER_NAV_MODULES.pricing.enabled,
          },
  };
};

export const createMainNavLinks = (t, docsLink, headerNavModules) => {
  const isInternalDocsLink =
    typeof docsLink === 'string' && docsLink.startsWith('/');

  const modules = normalizeHeaderNavModules(headerNavModules);

  const allLinks = [
    {
      text: t('首页'),
      itemKey: 'home',
      to: '/',
    },
    {
      text: 'Gaster Code',
      itemKey: 'gaster_code',
      to: '/gaster-code',
    },
    {
      text: t('控制台'),
      itemKey: 'console',
      to: '/console',
    },
    {
      text: t('模型广场'),
      itemKey: 'pricing',
      to: '/pricing',
    },
    ...(docsLink
      ? [
          {
            text: t('文档'),
            itemKey: 'docs',
            ...(isInternalDocsLink
              ? { to: docsLink }
              : {
                  isExternal: true,
                  externalLink: docsLink,
                }),
          },
        ]
      : []),
    {
      text: t('关于'),
      itemKey: 'about',
      to: '/about',
    },
  ];

  return allLinks.filter((link) => {
    if (link.itemKey === 'docs') {
      return docsLink && modules.docs;
    }
    if (link.itemKey === 'pricing') {
      return modules.pricing.enabled;
    }
    return modules[link.itemKey] === true;
  });
};

export const useNavigation = (t, docsLink, headerNavModules) => {
  const mainNavLinks = useMemo(() => {
    return createMainNavLinks(t, docsLink, headerNavModules);
  }, [t, docsLink, headerNavModules]);

  return {
    mainNavLinks,
  };
};
