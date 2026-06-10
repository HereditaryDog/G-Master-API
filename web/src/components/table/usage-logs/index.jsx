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

import React, { useMemo } from 'react';
import CardPro from '../../common/ui/CardPro';
import LogsTable from './UsageLogsTable';
import LogsActions from './UsageLogsActions';
import LogsFilters from './UsageLogsFilters';
import ColumnSelectorModal from './modals/ColumnSelectorModal';
import UserInfoModal from './modals/UserInfoModal';
import ChannelAffinityUsageCacheModal from './modals/ChannelAffinityUsageCacheModal';
import ParamOverrideModal from './modals/ParamOverrideModal';
import { useLogsData } from '../../../hooks/usage-logs/useUsageLogsData';
import { useIsMobile } from '../../../hooks/common/useIsMobile';
import { createCardProPagination } from '../../../helpers/utils';
import { renderNumber, renderQuota } from '../../../helpers';
import {
  Activity,
  Columns3,
  Gauge,
  ReceiptText,
  WalletCards,
} from 'lucide-react';

const DataOpsMetricCard = ({ icon, label, value, helper, tone }) => (
  <div className='gm-data-ops-kpi' data-tone={tone}>
    <div className='gm-data-ops-kpi-copy'>
      <span>{label}</span>
      <strong>{value}</strong>
      <em>{helper}</em>
    </div>
    <div className='gm-data-ops-kpi-icon'>{icon}</div>
  </div>
);

const LogsPage = () => {
  const logsData = useLogsData();
  const isMobile = useIsMobile();
  const { t } = logsData;

  const logMetrics = useMemo(() => {
    const logs = logsData.logs || [];
    const visibleColumnCount = Object.values(
      logsData.visibleColumns || {},
    ).filter(Boolean).length;
    const consumptionCount = logs.filter((log) => log.type === 2).length;

    return [
      {
        label: t('消耗额度'),
        value: renderQuota(Number(logsData.stat?.quota) || 0),
        helper: logsData.showStat ? t('当前筛选周期') : t('统计加载中'),
        tone: 'blue',
        icon: <WalletCards size={18} />,
      },
      {
        label: 'RPM',
        value: renderNumber(Number(logsData.stat?.rpm) || 0),
        helper: t('每分钟请求峰值'),
        tone: 'green',
        icon: <Gauge size={18} />,
      },
      {
        label: 'TPM',
        value: renderNumber(Number(logsData.stat?.tpm) || 0),
        helper: `${t('当前页消费日志')} ${consumptionCount}`,
        tone: 'purple',
        icon: <Activity size={18} />,
      },
      {
        label: t('日志总数'),
        value: renderNumber(Number(logsData.logCount) || 0),
        helper: `${t('当前页')} ${logs.length} · ${t('显示列')} ${visibleColumnCount}`,
        tone: 'cyan',
        icon: <ReceiptText size={18} />,
      },
    ];
  }, [
    logsData.logCount,
    logsData.logs,
    logsData.showStat,
    logsData.stat,
    logsData.visibleColumns,
    t,
  ]);

  return (
    <div className='gm-data-ops-shell'>
      {/* Modals */}
      <ColumnSelectorModal {...logsData} />
      <UserInfoModal {...logsData} />
      <ChannelAffinityUsageCacheModal {...logsData} />
      <ParamOverrideModal {...logsData} />

      <section className='gm-data-ops-header'>
        <div className='gm-data-ops-header-copy'>
          <div className='gm-data-ops-eyebrow'>
            <Columns3 size={14} />
            <span>{t('使用日志')}</span>
          </div>
          <h1>{t('使用日志')}</h1>
          <p>{t('查看请求、计费、模型、渠道和审计详情。')}</p>
        </div>
        <div className='gm-data-ops-header-meta'>
          <span>{logsData.loading ? t('查询中') : t('已同步')}</span>
          <strong>
            {logsData.isAdminUser ? t('管理员视图') : t('个人视图')}
          </strong>
        </div>
      </section>

      <section className='gm-data-ops-kpi-grid'>
        {logMetrics.map((metric) => (
          <DataOpsMetricCard key={metric.label} {...metric} />
        ))}
      </section>

      {/* Main Content */}
      <CardPro
        type='type2'
        className='gm-data-ops-card gm-usage-log-card'
        bordered={false}
        statsArea={<LogsActions {...logsData} />}
        searchArea={<LogsFilters {...logsData} />}
        paginationArea={createCardProPagination({
          currentPage: logsData.activePage,
          pageSize: logsData.pageSize,
          total: logsData.logCount,
          onPageChange: logsData.handlePageChange,
          onPageSizeChange: logsData.handlePageSizeChange,
          isMobile: isMobile,
          t: logsData.t,
        })}
        t={logsData.t}
      >
        <LogsTable {...logsData} isMobile={isMobile} />
      </CardPro>
    </div>
  );
};

export default LogsPage;
