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

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import SkeletonWrapper from '../components/SkeletonWrapper';

const Navigation = ({
  mainNavLinks,
  isMobile,
  isLoading,
  userState,
  pricingRequireAuth,
}) => {
  const location = useLocation();

  const renderNavLinks = () => {
    const baseClasses =
      'gm-main-nav-link flex-shrink-0 flex items-center gap-1 font-semibold transition-all duration-200 ease-in-out';

    return mainNavLinks.map((link) => {
      const linkContent = <span>{link.text}</span>;
      const spacingClasses = isMobile ? 'px-3 py-1.5' : 'px-4 py-2';
      const defaultLinkClasses = `${baseClasses} ${spacingClasses}`;

      if (link.isExternal) {
        return (
          <a
            key={link.itemKey}
            href={link.externalLink}
            target='_blank'
            rel='noopener noreferrer'
            className={defaultLinkClasses}
          >
            {linkContent}
          </a>
        );
      }

      let targetPath = link.to;
      if (link.itemKey === 'console' && !userState.user) {
        targetPath = '/login';
      }
      if (link.itemKey === 'pricing' && pricingRequireAuth && !userState.user) {
        targetPath = '/login';
      }

      const isActive =
        (link.itemKey === 'home' && location.pathname === '/') ||
        (link.itemKey === 'console' &&
          location.pathname.startsWith('/console')) ||
        (link.itemKey === 'pricing' && location.pathname.startsWith('/pricing')) ||
        (link.itemKey === 'docs' && location.pathname.startsWith('/docs'));

      const commonLinkClasses = `${defaultLinkClasses} ${isActive ? 'gm-main-nav-link-active' : ''}`;

      return (
        <Link key={link.itemKey} to={targetPath} className={commonLinkClasses}>
          {linkContent}
        </Link>
      );
    });
  };

  return (
    <nav className='gm-main-nav flex flex-1 items-center gap-1 lg:gap-2 mx-2 md:mx-4 overflow-x-auto whitespace-nowrap scrollbar-hide'>
      <SkeletonWrapper
        loading={isLoading}
        type='navigation'
        count={4}
        width={60}
        height={16}
        isMobile={isMobile}
      >
        {renderNavLinks()}
      </SkeletonWrapper>
    </nav>
  );
};

export default Navigation;
