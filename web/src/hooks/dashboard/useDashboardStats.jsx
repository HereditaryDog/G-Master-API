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
import { Wallet, Activity, Zap, Gauge } from 'lucide-react';
import {
  IconMoneyExchangeStroked,
  IconHistogram,
  IconCoinMoneyStroked,
  IconTextStroked,
  IconPulse,
  IconStopwatchStroked,
  IconTypograph,
  IconSend,
} from '@douyinfe/semi-icons';
import { renderNumber, renderQuota } from '../../helpers';
import { createSectionTitle } from '../../helpers/dashboard';

const getSeriesTotal = (series) =>
  (series || []).reduce((sum, value) => sum + Number(value || 0), 0);

const trimFormattedDecimal = (value) => {
  if (typeof value !== 'string') {
    return value;
  }
  return value.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '.00');
};

const renderPeriodQuota = (quota) => {
  const value = Number(quota || 0);
  if (value <= 0) {
    return renderQuota(0);
  }
  return trimFormattedDecimal(renderQuota(value, 4));
};

const getHalfPeriodTrend = (series, t) => {
  const values = (series || []).map((value) => Number(value || 0));
  if (values.length < 2) {
    return {
      label: t('暂无对比'),
      direction: 'neutral',
    };
  }

  const midpoint = Math.floor(values.length / 2);
  const previousTotal = getSeriesTotal(values.slice(0, midpoint));
  const currentTotal = getSeriesTotal(values.slice(midpoint));

  if (previousTotal <= 0) {
    return {
      label: t('暂无对比'),
      direction: 'neutral',
    };
  }

  const percent = ((currentTotal - previousTotal) / previousTotal) * 100;
  const direction = percent > 0 ? 'up' : percent < 0 ? 'down' : 'flat';
  const sign = percent > 0 ? '+' : '';
  const digits = Math.abs(percent) >= 100 ? 0 : 1;

  return {
    label: `${t('较前半周期')} ${sign}${percent.toFixed(digits)}%`,
    direction,
  };
};

const getHalfPeriodBreakdown = (series, formatter, t) => {
  const values = (series || []).map((value) => Number(value || 0));
  if (values.length < 2) {
    return {
      hasComparison: false,
      label: t('暂无对比'),
    };
  }

  const midpoint = Math.floor(values.length / 2);
  const previousTotal = getSeriesTotal(values.slice(0, midpoint));
  const currentTotal = getSeriesTotal(values.slice(midpoint));

  return {
    hasComparison: true,
    previousLabel: t('前半'),
    previousValue: formatter(previousTotal),
    currentLabel: t('后半'),
    currentValue: formatter(currentTotal),
  };
};

export const useDashboardStats = (
  userState,
  consumeQuota,
  consumeTokens,
  times,
  trendData,
  performanceMetrics,
  navigate,
  t,
) => {
  const groupedStatsData = useMemo(
    () => [
      {
        title: createSectionTitle(Wallet, t('账户数据')),
        color: 'gm-console-stat-card-blue',
        items: [
          {
            key: 'balance',
            title: t('当前余额'),
            value: renderQuota(userState?.user?.quota),
            kind: 'balance',
            icon: <IconMoneyExchangeStroked />,
            avatarColor: 'blue',
            trendData: [],
            trendColor: '#3b82f6',
          },
          {
            key: 'used_quota',
            title: t('历史消耗'),
            value: renderQuota(userState?.user?.used_quota),
            helper: t('账户累计'),
            icon: <IconHistogram />,
            avatarColor: 'purple',
            trendData: [],
            trendColor: '#8b5cf6',
          },
        ],
      },
      {
        title: createSectionTitle(Activity, t('使用统计')),
        color: 'gm-console-stat-card-green',
        items: [
          {
            key: 'request_count',
            title: t('累计请求'),
            value: renderNumber(userState.user?.request_count || 0),
            helper: t('账户累计'),
            icon: <IconSend />,
            avatarColor: 'green',
            trendData: [],
            trendColor: '#10b981',
          },
          {
            key: 'period_requests',
            title: t('当前周期请求'),
            value: renderNumber(times || 0),
            unit: t('次'),
            trend: getHalfPeriodTrend(trendData.times, t),
            periodBreakdown: getHalfPeriodBreakdown(
              trendData.times,
              renderNumber,
              t,
            ),
            isPeriodKpi: true,
            icon: <IconPulse />,
            avatarColor: 'cyan',
            trendData: trendData.times,
            trendColor: '#06b6d4',
          },
        ],
      },
      {
        title: createSectionTitle(Zap, t('资源消耗')),
        color: 'gm-console-stat-card-amber',
        items: [
          {
            key: 'period_quota',
            title: t('当前周期消耗'),
            value: renderQuota(consumeQuota),
            unit: t('额度'),
            trend: getHalfPeriodTrend(trendData.consumeQuota, t),
            periodBreakdown: getHalfPeriodBreakdown(
              trendData.consumeQuota,
              renderPeriodQuota,
              t,
            ),
            isPeriodKpi: true,
            icon: <IconCoinMoneyStroked />,
            avatarColor: 'yellow',
            trendData: trendData.consumeQuota,
            trendColor: '#f59e0b',
          },
          {
            key: 'period_tokens',
            title: t('当前周期 Tokens'),
            value: isNaN(consumeTokens) ? 0 : renderNumber(consumeTokens || 0),
            unit: 'tokens',
            trend: getHalfPeriodTrend(trendData.tokens, t),
            periodBreakdown: getHalfPeriodBreakdown(
              trendData.tokens,
              renderNumber,
              t,
            ),
            isPeriodKpi: true,
            icon: <IconTextStroked />,
            avatarColor: 'pink',
            trendData: trendData.tokens,
            trendColor: '#ec4899',
          },
        ],
      },
      {
        title: createSectionTitle(Gauge, t('性能指标')),
        color: 'gm-console-stat-card-indigo',
        items: [
          {
            key: 'avg_rpm',
            title: t('平均RPM'),
            value: performanceMetrics.avgRPM,
            helper: t('当前周期平均'),
            icon: <IconStopwatchStroked />,
            avatarColor: 'indigo',
            trendData: trendData.rpm,
            trendColor: '#6366f1',
          },
          {
            key: 'avg_tpm',
            title: t('平均TPM'),
            value: performanceMetrics.avgTPM,
            helper: t('当前周期平均'),
            icon: <IconTypograph />,
            avatarColor: 'orange',
            trendData: trendData.tpm,
            trendColor: '#f97316',
          },
        ],
      },
    ],
    [
      userState?.user?.quota,
      userState?.user?.used_quota,
      userState?.user?.request_count,
      times,
      consumeQuota,
      consumeTokens,
      trendData,
      performanceMetrics,
      navigate,
      t,
    ],
  );

  return {
    groupedStatsData,
  };
};
