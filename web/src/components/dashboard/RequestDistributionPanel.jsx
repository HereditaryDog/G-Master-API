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
import { Card } from '@douyinfe/semi-ui';
import { Activity, Clock3 } from 'lucide-react';
import { renderNumber, renderQuota } from '../../helpers';

const formatHourLabel = (hour) => `${String(hour).padStart(2, '0')}:00`;

const getTopModelFromMap = (modelCounts) => {
  let topModel = '';
  let topCount = 0;

  modelCounts.forEach((count, model) => {
    if (count > topCount) {
      topModel = model;
      topCount = count;
    }
  });

  return topModel;
};

const buildDistribution = (quotaData) => {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: 0,
    quota: 0,
    modelCounts: new Map(),
  }));

  (quotaData || []).forEach((item) => {
    const date = new Date(Number(item.created_at || 0) * 1000);
    if (Number.isNaN(date.getTime())) return;

    const bucket = buckets[date.getHours()];
    const count = Number(item.count || 0);
    bucket.count += count;
    bucket.quota += Number(item.quota || 0);

    if (item.model_name && item.model_name !== '无数据') {
      bucket.modelCounts.set(
        item.model_name,
        (bucket.modelCounts.get(item.model_name) || 0) + count,
      );
    }
  });

  const maxCount = Math.max(...buckets.map((item) => item.count), 1);
  const totalCount = buckets.reduce((sum, item) => sum + item.count, 0);
  const totalQuota = buckets.reduce((sum, item) => sum + item.quota, 0);
  const activeHours = buckets.filter((item) => item.count > 0).length;
  const peakBucket = buckets.reduce(
    (peak, item) => (item.count > peak.count ? item : peak),
    buckets[0],
  );
  const allModels = new Map();

  buckets.forEach((bucket) => {
    bucket.modelCounts.forEach((count, model) => {
      allModels.set(model, (allModels.get(model) || 0) + count);
    });
  });

  return {
    totalCount,
    totalQuota,
    activeHours,
    peakHour: peakBucket.count > 0 ? formatHourLabel(peakBucket.hour) : '--',
    primaryModel: getTopModelFromMap(allModels) || '--',
    buckets: buckets.map((item) => {
      const heightPercent = item.count > 0 ? (item.count / maxCount) * 100 : 0;
      return {
        ...item,
        height: item.count > 0 ? `${Math.max(heightPercent, 8)}%` : '4px',
        modelCount: item.modelCounts.size,
        primaryModel: getTopModelFromMap(item.modelCounts) || '--',
      };
    }),
  };
};

const RequestDistributionPanel = ({ quotaData, CARD_PROPS, t }) => {
  const distribution = useMemo(() => buildDistribution(quotaData), [quotaData]);

  return (
    <Card
      {...CARD_PROPS}
      className='gm-console-request-panel !rounded-2xl'
      title={
        <div className='gm-console-request-panel-title'>
          <span>
            <Activity size={16} />
            {t('小时段请求分布')}
          </span>
          <small>{t('按当前筛选周期内的同一小时段累计')}</small>
        </div>
      }
    >
      <div className='gm-console-request-summary'>
        <span>
          {t('总请求')}
          <strong>{renderNumber(distribution.totalCount)}</strong>
        </span>
        <span>
          {t('总消耗')}
          <strong>{renderQuota(distribution.totalQuota, 2)}</strong>
        </span>
        <span>
          {t('高峰时段')}
          <strong>{distribution.peakHour}</strong>
        </span>
        <span>
          {t('主要模型')}
          <strong>{distribution.primaryModel}</strong>
        </span>
      </div>

      <div className='gm-console-request-chart' role='list'>
        {distribution.buckets.map((bucket) => (
          <div
            className='gm-console-request-slot'
            key={bucket.hour}
            role='listitem'
            title={`${formatHourLabel(bucket.hour)} · ${t('请求数')}: ${renderNumber(bucket.count)} · ${t('消耗')}: ${renderQuota(bucket.quota, 3)} · ${t('模型数')}: ${bucket.modelCount} · ${t('主要模型')}: ${bucket.primaryModel}`}
          >
            <span
              className='gm-console-request-bar'
              data-active={bucket.count > 0}
              style={{ height: bucket.height }}
            />
          </div>
        ))}
      </div>

      <div className='gm-console-request-axis'>
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>24:00</span>
      </div>

      <div className='gm-console-request-legend'>
        <span>
          <i data-type='count' />
          {t('柱高 = 该小时段累计请求数')}
        </span>
        <span>
          <Clock3 size={13} />
          {t('悬停查看消耗与主要模型')}
        </span>
        <span>
          {t('活跃小时')}
          <strong>{distribution.activeHours}/24</strong>
        </span>
      </div>
    </Card>
  );
};

export default RequestDistributionPanel;
