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
import { Card, Avatar, Skeleton, Tag } from '@douyinfe/semi-ui';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const KPI_ORDER = [
  'balance',
  'used_quota',
  'request_count',
  'period_requests',
  'period_quota',
  'period_tokens',
];

const getTrendValue = (trend) => {
  const match = String(trend?.label || '').match(/[+-]?\d+(?:\.\d+)?%/);
  return match?.[0] || '--';
};

const TrendSignal = ({ trend, t }) => (
  <div
    className='gm-console-kpi-signal'
    data-direction={trend?.direction || 'neutral'}
  >
    <span>{t('环比')}</span>
    <strong>{getTrendValue(trend)}</strong>
  </div>
);

const PeriodBreakdown = ({ breakdown, t }) => {
  if (!breakdown?.hasComparison) {
    return (
      <div className='gm-console-kpi-period-row gm-console-kpi-breakdown'>
        <span>{breakdown?.label || t('暂无对比')}</span>
      </div>
    );
  }

  return (
    <div className='gm-console-kpi-period-row gm-console-kpi-breakdown'>
      <span className='gm-console-kpi-breakdown-item'>
        <em>{breakdown.previousLabel}</em>
        <strong>{breakdown.previousValue}</strong>
      </span>
      <span className='gm-console-kpi-breakdown-divider' />
      <span className='gm-console-kpi-breakdown-item'>
        <em>{breakdown.currentLabel}</em>
        <strong>{breakdown.currentValue}</strong>
      </span>
    </div>
  );
};

const StatsCards = ({ groupedStatsData, loading, CARD_PROPS }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const groupedItems = groupedStatsData.flatMap((group) =>
    group.items.map((item) => ({
      ...item,
      groupTitle: group.title,
      groupColor: group.color,
    })),
  );
  const kpiCards = KPI_ORDER.map((key) =>
    groupedItems.find((item) => item.key === key),
  ).filter(Boolean);

  return (
    <div className='gm-console-kpi-strip'>
      <div className='gm-console-kpi-grid'>
        {kpiCards.map((item, idx) => (
          <Card
            key={item.key || idx}
            {...CARD_PROPS}
            className={`gm-console-kpi-card ${item.groupColor || ''} border-0 w-full`}
            bodyStyle={{ padding: 0 }}
            onClick={item.onClick}
          >
            <div className='gm-console-kpi-card-inner'>
              <div className='gm-console-kpi-copy'>
                <div className='gm-console-kpi-label'>{item.title}</div>
                <Skeleton
                  loading={loading}
                  active
                  placeholder={
                    <Skeleton.Paragraph
                      active
                      rows={1}
                      style={{
                        width: '82px',
                        height: '30px',
                        margin: '8px 0 7px',
                      }}
                    />
                  }
                >
                  <div className='gm-console-kpi-value'>
                    <span>{item.value}</span>
                    {item.unit && (
                      <span className='gm-console-kpi-unit'>{item.unit}</span>
                    )}
                  </div>
                </Skeleton>
                {item.isPeriodKpi ? (
                  <PeriodBreakdown breakdown={item.periodBreakdown} t={t} />
                ) : (
                  <div className='gm-console-stat-helper'>
                    {item.helper || item.groupTitle}
                  </div>
                )}
              </div>

              <div className='gm-console-kpi-visual'>
                {item.kind === 'balance' || item.title === t('当前余额') ? (
                  <Tag
                    color='white'
                    shape='circle'
                    size='large'
                    className='gm-console-topup-tag'
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/console/topup');
                    }}
                  >
                    {t('充值')}
                  </Tag>
                ) : item.isPeriodKpi ? (
                  <TrendSignal trend={item.trend} t={t} />
                ) : (
                  <Avatar
                    className={`gm-console-stat-avatar gm-console-stat-avatar-${item.avatarColor}`}
                    size='small'
                    color={item.avatarColor}
                  >
                    {item.icon}
                  </Avatar>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StatsCards;
