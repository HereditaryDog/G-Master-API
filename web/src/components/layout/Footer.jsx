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

import React, { useEffect, useState, useMemo, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@douyinfe/semi-ui';
import { getFooterHTML, getLogo, getSystemName } from '../../helpers';
import { StatusContext } from '../../context/Status';

const PROJECT_REPO_URL = 'https://github.com/HereditaryDog/G-Master-API';
const PROJECT_LICENSE_URL = `${PROJECT_REPO_URL}/blob/main/LICENSE`;
const PROJECT_ACK_URL = `${PROJECT_REPO_URL}/blob/main/ACKNOWLEDGMENTS.md`;
const PROJECT_COMPOSE_URL = `${PROJECT_REPO_URL}/blob/main/docker-compose.yml`;
const PROJECT_README_URL = `${PROJECT_REPO_URL}/blob/main/README.md`;
const UPSTREAM_URL = 'https://github.com/QuantumNous/new-api';
const ONE_API_URL = 'https://github.com/songquanpeng/one-api';

const FooterBar = () => {
  const { t } = useTranslation();
  const [footer, setFooter] = useState(getFooterHTML());
  const systemName = getSystemName();
  const logo = getLogo();
  const [statusState] = useContext(StatusContext);
  const isDemoSiteMode = statusState?.status?.demo_site_enabled || false;
  const runtimeVersion =
    typeof statusState?.status?.version === 'string'
      ? statusState.status.version.trim()
      : '';
  const buildVersion =
    typeof import.meta.env.VITE_REACT_APP_VERSION === 'string'
      ? import.meta.env.VITE_REACT_APP_VERSION.trim()
      : '';
  const displayVersion = runtimeVersion || buildVersion;

  const loadFooter = () => {
    let footer_html = localStorage.getItem('footer_html');
    if (footer_html) {
      setFooter(footer_html);
    }
  };

  const currentYear = new Date().getFullYear();

  const customFooter = useMemo(
    () => (
      <footer className='relative h-auto w-full overflow-hidden border-t border-semi-color-border px-6 pb-5 pt-8 md:px-20 md:pb-6 md:pt-9'>
        <div
          className='absolute inset-x-0 top-0 h-px opacity-60'
          style={{
            background:
              'linear-gradient(90deg, transparent, var(--semi-color-primary), transparent)',
          }}
        ></div>

        {isDemoSiteMode && (
          <div className='mb-8 flex w-full max-w-[1110px] flex-col justify-between gap-8 md:flex-row'>
            <div className='flex-shrink-0'>
              <img
                src={logo}
                alt={systemName}
                className='w-16 h-16 rounded-full bg-gray-800 p-1.5 object-contain'
              />
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 w-full'>
              <div className='text-left'>
                <p className='!text-semi-color-text-0 font-semibold mb-5'>
                  {t('关于我们')}
                </p>
                <div className='flex flex-col gap-4'>
                  <a
                    href={PROJECT_REPO_URL}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='!text-semi-color-text-1'
                  >
                    GitHub Repository
                  </a>
                  <a
                    href={PROJECT_ACK_URL}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='!text-semi-color-text-1'
                  >
                    ACKNOWLEDGMENTS
                  </a>
                  <a
                    href={PROJECT_LICENSE_URL}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='!text-semi-color-text-1'
                  >
                    AGPL-3.0 License
                  </a>
                </div>
              </div>

              <div className='text-left'>
                <p className='!text-semi-color-text-0 font-semibold mb-5'>
                  {t('文档')}
                </p>
                <div className='flex flex-col gap-4'>
                  <a
                    href={PROJECT_README_URL}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='!text-semi-color-text-1'
                  >
                    README
                  </a>
                  <a
                    href={PROJECT_COMPOSE_URL}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='!text-semi-color-text-1'
                  >
                    Docker Compose
                  </a>
                  <a
                    href={PROJECT_REPO_URL}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='!text-semi-color-text-1'
                  >
                    Local Deployment Notes
                  </a>
                </div>
              </div>

              <div className='text-left'>
                <p className='!text-semi-color-text-0 font-semibold mb-5'>
                  {t('相关项目')}
                </p>
                <div className='flex flex-col gap-4'>
                  <a
                    href={UPSTREAM_URL}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='!text-semi-color-text-1'
                  >
                    QuantumNous/new-api
                  </a>
                  <a
                    href={ONE_API_URL}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='!text-semi-color-text-1'
                  >
                    One API
                  </a>
                  <a
                    href={PROJECT_ACK_URL}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='!text-semi-color-text-1'
                  >
                    Attribution Notes
                  </a>
                </div>
              </div>

              <div className='text-left'>
                <p className='!text-semi-color-text-0 font-semibold mb-5'>
                  {t('友情链接')}
                </p>
                <div className='flex flex-col gap-4'>
                  <a
                    href={PROJECT_REPO_URL}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='!text-semi-color-text-1'
                  >
                    G-Master API
                  </a>
                  <a
                    href={PROJECT_LICENSE_URL}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='!text-semi-color-text-1'
                  >
                    Open Source License
                  </a>
                  <a
                    href={PROJECT_COMPOSE_URL}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='!text-semi-color-text-1'
                  >
                    Local Docker Stack
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className='flex w-full max-w-[1110px] flex-col items-center justify-between gap-3 md:flex-row md:gap-6'>
          <div className='flex flex-wrap items-center gap-2'>
            <Typography.Text className='text-sm !text-semi-color-text-1'>
              © {currentYear} {systemName}. {t('版权所有')}
            </Typography.Text>
            {displayVersion && (
              <Typography.Text className='text-sm !text-semi-color-text-2'>
                {t('当前版本')} {displayVersion}
              </Typography.Text>
            )}
          </div>

          <div className='text-sm'>
            <span className='!text-semi-color-text-1'>
              {t('设计与开发由')}{' '}
            </span>
            <a
              href={PROJECT_REPO_URL}
              target='_blank'
              rel='noopener noreferrer'
              className='!text-semi-color-primary font-medium'
            >
              G-Master API
            </a>
          </div>
        </div>
      </footer>
    ),
    [logo, systemName, t, currentYear, isDemoSiteMode, displayVersion],
  );

  useEffect(() => {
    loadFooter();
  }, []);

  return (
    <div className='w-full'>
      {footer ? (
        <footer className='relative h-auto py-4 px-6 md:px-24 w-full flex items-center justify-center overflow-hidden'>
          <div className='flex flex-col md:flex-row items-center justify-between w-full max-w-[1110px] gap-4'>
            <div className='flex flex-wrap items-center gap-2'>
              <div
                className='custom-footer na-cb6feafeb3990c78 text-sm !text-semi-color-text-1'
                dangerouslySetInnerHTML={{ __html: footer }}
              ></div>
              {displayVersion && (
                <Typography.Text className='text-sm !text-semi-color-text-2'>
                  {t('当前版本')} {displayVersion}
                </Typography.Text>
              )}
            </div>
            <div className='text-sm flex-shrink-0'>
              <span className='!text-semi-color-text-1'>
                {t('设计与开发由')}{' '}
              </span>
              <a
                href={PROJECT_REPO_URL}
                target='_blank'
                rel='noopener noreferrer'
                className='!text-semi-color-primary font-medium'
              >
                G-Master API
              </a>
            </div>
          </div>
        </footer>
      ) : (
        customFooter
      )}
    </div>
  );
};

export default FooterBar;
