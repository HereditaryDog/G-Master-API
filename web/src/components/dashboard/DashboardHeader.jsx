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
import { Button } from '@douyinfe/semi-ui';
import { CalendarDays, RefreshCw, Search } from 'lucide-react';

const DashboardHeader = ({
  getGreeting,
  greetingVisible,
  showSearchModal,
  refresh,
  loading,
  dashboardSummary,
  t,
}) => {
  return (
    <div className='gm-console-header'>
      <div className='gm-console-header-copy'>
        <h2
          className='gm-console-header-title transition-opacity duration-1000 ease-in-out'
          style={{ opacity: greetingVisible ? 1 : 0 }}
        >
          {getGreeting}
        </h2>
        <p className='gm-console-header-description'>
          {dashboardSummary?.description ||
            t('统一查看账户余额、趋势分析、系统公告与服务健康状态。')}
        </p>
      </div>
      <div className='gm-console-header-actions'>
        <button
          type='button'
          className='gm-console-header-date-chip'
          onClick={showSearchModal}
          title={t('打开筛选')}
        >
          <CalendarDays size={15} />
          <span>{dashboardSummary?.periodScope || t('当前周期')}</span>
        </button>
        <Button
          type='primary'
          icon={<Search size={16} />}
          onClick={showSearchModal}
          className='gm-console-header-button gm-console-header-button-secondary'
        >
          {t('筛选')}
        </Button>
        <Button
          type='primary'
          icon={<RefreshCw size={16} />}
          onClick={refresh}
          loading={loading}
          className='gm-console-header-button gm-console-header-button-primary'
        >
          {t('刷新')}
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
