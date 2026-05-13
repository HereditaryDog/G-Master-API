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

import React, { useEffect, useMemo, useState } from 'react';
import { Card, Skeleton, Tag } from '@douyinfe/semi-ui';
import { IconPulse, IconRefresh } from '@douyinfe/semi-icons';
import { getPerfMetricsSummary } from '../../helpers/api';

const formatLatency = (value) => {
  const latency = Number(value || 0);
  if (latency <= 0) return '--';
  if (latency >= 1000) return `${(latency / 1000).toFixed(2)}s`;
  return `${Math.round(latency)}ms`;
};

const formatPercent = (value) => {
  const percent = Number(value || 0);
  if (percent <= 0) return '0%';
  return `${percent.toFixed(percent >= 99 ? 1 : 2)}%`;
};

const formatTps = (value) => {
  const tps = Number(value || 0);
  if (tps <= 0) return '--';
  return tps >= 100 ? tps.toFixed(0) : tps.toFixed(1);
};

const metricTone = (model) => {
  if (Number(model?.success_rate || 0) < 90) return 'warning';
  if (Number(model?.avg_latency_ms || 0) > 8000) return 'slow';
  return 'healthy';
};

const PerformanceHealthPanel = ({ t }) => {
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState([]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const res = await getPerfMetricsSummary(24);
      const { success, data } = res.data || {};
      setModels(success ? data?.models || [] : []);
    } catch (error) {
      console.error(error);
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const topModels = useMemo(
    () =>
      [...models]
        .sort(
          (a, b) => Number(b.request_count || 0) - Number(a.request_count || 0),
        )
        .slice(0, 4),
    [models],
  );

  return (
    <section className='gm-perf-health-panel'>
      <div className='gm-perf-health-head'>
        <div>
          <span className='gm-console-header-eyebrow'>{t('性能指标')}</span>
          <h3>{t('模型健康度')}</h3>
        </div>
        <button
          type='button'
          className='gm-perf-refresh'
          onClick={loadMetrics}
          disabled={loading}
          aria-label={t('刷新性能指标')}
        >
          <IconRefresh />
        </button>
      </div>

      <Skeleton
        loading={loading}
        active
        placeholder={<Skeleton.Paragraph rows={2} />}
      >
        {topModels.length === 0 ? (
          <div className='gm-perf-empty'>
            {t('暂无性能数据，模型调用后会自动生成。')}
          </div>
        ) : (
          <div className='gm-perf-card-grid'>
            {topModels.map((model) => (
              <Card
                key={model.model_name}
                className='gm-perf-card'
                bodyStyle={{ padding: 0 }}
              >
                <div
                  className='gm-perf-card-inner'
                  data-tone={metricTone(model)}
                >
                  <div className='gm-perf-card-top'>
                    <IconPulse />
                    <Tag size='small' shape='circle'>
                      {formatPercent(model.success_rate)}
                    </Tag>
                  </div>
                  <strong title={model.model_name}>{model.model_name}</strong>
                  <div className='gm-perf-metrics'>
                    <span>
                      <em>{t('平均延迟')}</em>
                      {formatLatency(model.avg_latency_ms)}
                    </span>
                    <span>
                      <em>TPS</em>
                      {formatTps(model.avg_tps)}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Skeleton>
    </section>
  );
};

export default PerformanceHealthPanel;
