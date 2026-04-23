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

import React, { useMemo, useState } from 'react';
import { Database, RadioTower, Server, ShieldCheck } from 'lucide-react';
import { renderNumber, renderQuota } from '../../helpers';

const MODEL_COLORS = ['#9b55ff', '#3c7dff', '#63d6f5', '#e0a34d', '#9ea4bd'];
const TREND_GRANULARITIES = ['hour', 'day', 'week', 'month'];

const LOG_TYPE_CONSUME = 2;
const LOG_TYPE_ERROR = 5;

const toNumber = (value) => Number(value || 0);

const formatClock = (timestamp) => {
  const date = new Date(toNumber(timestamp) * 1000);
  if (Number.isNaN(date.getTime())) return '--:--:--';
  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((item) => String(item).padStart(2, '0'))
    .join(':');
};

const getWeekStart = (date) => {
  const current = new Date(date);
  const day = current.getDay() || 7;
  current.setHours(0, 0, 0, 0);
  current.setDate(current.getDate() - day + 1);
  return current;
};

const getTrendBucket = (timestamp, granularity) => {
  const date = new Date(toNumber(timestamp) * 1000);
  if (Number.isNaN(date.getTime())) {
    return { key: '--', label: '--' };
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');

  if (granularity === 'hour') {
    return {
      key: `${year}-${month}-${day} ${hour}`,
      label: `${hour}:00`,
    };
  }

  if (granularity === 'week') {
    const weekStart = getWeekStart(date);
    return {
      key: `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`,
      label: `${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`,
    };
  }

  if (granularity === 'month') {
    return {
      key: `${year}-${month}`,
      label: `${month}月`,
    };
  }

  return {
    key: `${year}-${month}-${day}`,
    label: `${month}-${day}`,
  };
};

const parseOther = (other) => {
  if (!other || typeof other !== 'string') return {};
  try {
    return JSON.parse(other);
  } catch (err) {
    return {};
  }
};

const getLogStatusCode = (log) => {
  if (Number(log?.type) === LOG_TYPE_CONSUME) return 200;
  if (Number(log?.type) !== LOG_TYPE_ERROR) return null;
  const other = parseOther(log.other);
  const statusCode = Number(other.status_code || other.status || other.code);
  return Number.isInteger(statusCode) && statusCode >= 100 ? statusCode : 500;
};

const maskIp = (ip) => {
  if (!ip) return '--';
  const parts = String(ip).split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.XX.${parts[3]}`;
  }
  return ip;
};

const buildTimeSeries = (quotaData, valueKey, granularity = 'day') => {
  const bucketMap = new Map();
  (quotaData || []).forEach((item) => {
    if (item.model_name === '无数据') return;
    const bucket = getTrendBucket(item.created_at, granularity);
    const current = bucketMap.get(bucket.key) || {
      label: bucket.label,
      value: 0,
    };
    bucketMap.set(bucket.key, {
      ...current,
      value: current.value + toNumber(item[valueKey]),
    });
  });

  const entries = Array.from(bucketMap.entries())
    .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey))
    .map(([, value]) => value)
    .slice(-7);
  if (entries.length === 0) {
    return {
      labels: ['--', '--', '--', '--', '--', '--', '--'],
      values: [0, 0, 0, 0, 0, 0, 0],
    };
  }

  while (entries.length < 7) {
    entries.unshift({ label: '--', value: 0 });
  }

  return {
    labels: entries.map((item) => item.label),
    values: entries.map((item) => item.value),
  };
};

const buildModelStats = (quotaData) => {
  const modelMap = new Map();
  (quotaData || []).forEach((item) => {
    if (!item.model_name || item.model_name === '无数据') return;
    const current = modelMap.get(item.model_name) || { count: 0, quota: 0 };
    modelMap.set(item.model_name, {
      count: current.count + toNumber(item.count),
      quota: current.quota + toNumber(item.quota),
    });
  });

  const totalCount = Array.from(modelMap.values()).reduce(
    (sum, item) => sum + item.count,
    0,
  );
  const rows = Array.from(modelMap.entries())
    .map(([model, data], index) => ({
      model,
      count: data.count,
      quota: data.quota,
      color: MODEL_COLORS[index % MODEL_COLORS.length],
      percent: totalCount > 0 ? (data.count / totalCount) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalCount,
    rows: rows.slice(0, 5).map((item, index) => ({
      ...item,
      rank: index + 1,
      color: MODEL_COLORS[index % MODEL_COLORS.length],
    })),
  };
};

const buildStatusStats = (quotaData, recentLogs) => {
  const successCount = (quotaData || []).reduce(
    (sum, item) =>
      item.model_name === '无数据' ? sum : sum + toNumber(item.count),
    0,
  );
  const statusBuckets = {
    success: { label: '200 成功', count: successCount, color: '#48bc55' },
    rateLimit: { label: '429 限流', count: 0, color: '#f2c24d' },
    client: { label: '4xx 客户端错误', count: 0, color: '#f29c42' },
    server: { label: '5xx 服务端错误', count: 0, color: '#d96161' },
  };

  (recentLogs || []).forEach((log) => {
    const statusCode = getLogStatusCode(log);
    if (!statusCode || statusCode === 200) return;
    if (statusCode === 429) {
      statusBuckets.rateLimit.count += 1;
    } else if (statusCode >= 400 && statusCode < 500) {
      statusBuckets.client.count += 1;
    } else if (statusCode >= 500) {
      statusBuckets.server.count += 1;
    }
  });

  const rows = Object.values(statusBuckets);
  const total = rows.reduce((sum, item) => sum + item.count, 0);
  return {
    total,
    rows: rows.map((item) => ({
      ...item,
      percent: total > 0 ? (item.count / total) * 100 : 0,
    })),
  };
};

const buildHeatmap = (quotaData) => {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: 0,
    quota: 0,
  }));

  (quotaData || []).forEach((item) => {
    if (item.model_name === '无数据') return;
    const date = new Date(toNumber(item.created_at) * 1000);
    if (Number.isNaN(date.getTime())) return;
    const bucket = buckets[date.getHours()];
    bucket.count += toNumber(item.count);
    bucket.quota += toNumber(item.quota);
  });

  const maxCount = Math.max(...buckets.map((item) => item.count), 1);
  return buckets.map((item) => ({
    ...item,
    intensity: item.count > 0 ? item.count / maxCount : 0,
  }));
};

const makeAreaPath = (values, width, height) => {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((value, index) => ({
    x: index * step,
    y: height - ((value - min) / range) * (height * 0.82) - height * 0.08,
  }));
  const line = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`)
    .join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;
  return { line, area, points };
};

const TrendAreaPanel = ({
  title,
  tone,
  series,
  formatter,
  granularity,
  onGranularityChange,
  t,
}) => {
  const width = 420;
  const height = 138;
  const chart = makeAreaPath(series.values, width, height);
  const peakIndex = series.values.reduce(
    (peak, value, index) => (value > series.values[peak] ? index : peak),
    0,
  );
  const peak = chart.points[peakIndex] || { x: 0, y: height };
  const color = tone === 'blue' ? '#4b96ff' : '#a458ff';
  const total = series.values.reduce((sum, item) => sum + item, 0);

  return (
    <section className={`gm-figma-panel gm-trend-panel gm-trend-panel-${tone}`}>
      <div className='gm-figma-panel-head'>
        <h3>{title}</h3>
        <div className='gm-time-tabs'>
          {TREND_GRANULARITIES.map((item) => (
            <button
              key={item}
              type='button'
              data-active={granularity === item}
              onClick={() => onGranularityChange(item)}
            >
              {item === 'hour'
                ? t('小时')
                : item === 'day'
                  ? t('天')
                  : item === 'week'
                    ? t('周')
                    : t('月')}
            </button>
          ))}
        </div>
      </div>
      <div className='gm-trend-chart-wrap'>
        <svg
          className='gm-trend-chart'
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio='none'
        >
          <defs>
            <linearGradient id={`gm-trend-${tone}`} x1='0' y1='0' x2='0' y2='1'>
              <stop offset='0%' stopColor={color} stopOpacity='0.42' />
              <stop offset='100%' stopColor={color} stopOpacity='0.05' />
            </linearGradient>
          </defs>
          {[0.18, 0.4, 0.62, 0.84].map((ratio) => (
            <line
              key={ratio}
              x1='0'
              x2={width}
              y1={height * ratio}
              y2={height * ratio}
              className='gm-trend-grid'
            />
          ))}
          <path d={chart.area} fill={`url(#gm-trend-${tone})`} />
          <path d={chart.line} stroke={color} className='gm-trend-line' />
          {chart.points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={index === peakIndex ? 5 : 3}
              fill={index === peakIndex ? color : '#c8d4ff'}
              stroke={index === peakIndex ? '#e7ddff' : 'transparent'}
              strokeWidth='2'
            />
          ))}
          <line
            x1={peak.x}
            x2={peak.x}
            y1={peak.y}
            y2={height}
            className='gm-trend-cursor'
          />
        </svg>
        <div
          className='gm-trend-tooltip'
          style={{ left: `${Math.min(peak.x, width - 120)}px` }}
        >
          <strong>{series.labels[peakIndex]}</strong>
          <span>{formatter(series.values[peakIndex] || 0)}</span>
        </div>
      </div>
      <div className='gm-trend-axis'>
        {series.labels.map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </div>
      <div className='gm-panel-total'>
        {t('总计')} {formatter(total)}
      </div>
    </section>
  );
};

const DonutPanel = ({ title, centerLabel, centerValue, rows }) => {
  const total = rows.reduce((sum, item) => sum + item.count, 0);
  let cursor = 0;
  const gradient =
    total > 0
      ? rows
          .map((item) => {
            const start = cursor;
            cursor += item.percent;
            return `${item.color} ${start}% ${cursor}%`;
          })
          .join(', ')
      : '#34415c 0% 100%';

  return (
    <section className='gm-figma-panel gm-donut-panel'>
      <div className='gm-figma-panel-head'>
        <h3>{title}</h3>
      </div>
      <div className='gm-donut-content'>
        <div
          className='gm-donut'
          style={{ background: `conic-gradient(${gradient})` }}
        >
          <div className='gm-donut-center'>
            <span>{centerLabel}</span>
            <strong>{centerValue}</strong>
          </div>
        </div>
        <div className='gm-donut-legend'>
          {rows.map((item, index) => (
            <div key={`${item.label}-${index}`}>
              <i style={{ background: item.color }} />
              <span>{item.label || item.model}</span>
              <strong>{item.percent.toFixed(1)}%</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ModelRankingPanel = ({ modelStats, t }) => (
  <section className='gm-figma-panel gm-ranking-panel'>
    <div className='gm-figma-panel-head'>
      <h3>{t('模型排行 Top 5')}</h3>
    </div>
    <div className='gm-ranking-table'>
      <div className='gm-ranking-row gm-ranking-head'>
        <span>{t('模型')}</span>
        <span>{t('请求数')}</span>
        <span>{t('占比')}</span>
        <span>{t('消耗')}</span>
      </div>
      {modelStats.rows.length === 0 ? (
        <div className='gm-empty-line'>{t('暂无模型数据')}</div>
      ) : (
        modelStats.rows.map((item) => (
          <div className='gm-ranking-row' key={item.model}>
            <span>
              <i style={{ background: item.color }}>{item.rank}</i>
              {item.model}
            </span>
            <span>{renderNumber(item.count)}</span>
            <span>
              <b>
                <em style={{ width: `${Math.max(item.percent, 3)}%` }} />
              </b>
              {item.percent.toFixed(1)}%
            </span>
            <span>{renderQuota(item.quota, 2)}</span>
          </div>
        ))
      )}
    </div>
  </section>
);

const RealtimeRequestsPanel = ({ recentLogs, t }) => {
  const rows = (recentLogs || [])
    .filter((log) =>
      [LOG_TYPE_CONSUME, LOG_TYPE_ERROR].includes(Number(log.type)),
    )
    .slice(0, 5);

  return (
    <section className='gm-figma-panel gm-realtime-panel'>
      <div className='gm-figma-panel-head'>
        <h3>{t('实时请求')}</h3>
      </div>
      <div className='gm-realtime-table'>
        <div className='gm-realtime-row gm-realtime-head'>
          <span>{t('时间')}</span>
          <span>{t('模型')}</span>
          <span>{t('状态')}</span>
          <span>{t('消耗')}</span>
          <span>{t('IP 地址')}</span>
        </div>
        {rows.length === 0 ? (
          <div className='gm-empty-line'>{t('暂无实时请求')}</div>
        ) : (
          rows.map((log) => {
            const statusCode = getLogStatusCode(log);
            return (
              <div
                className='gm-realtime-row'
                key={`${log.id}-${log.created_at}`}
              >
                <span>{formatClock(log.created_at)}</span>
                <span>{log.model_name || '--'}</span>
                <span data-status={statusCode >= 400 ? 'error' : 'success'}>
                  {statusCode || '--'}
                </span>
                <span>{renderQuota(log.quota || 0, 3)}</span>
                <span>{maskIp(log.ip)}</span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

const HeatmapPanel = ({ heatmap, t }) => (
  <section className='gm-figma-panel gm-heatmap-panel'>
    <div className='gm-figma-panel-head'>
      <h3>{t('24 小时热力图（请求数）')}</h3>
    </div>
    <div className='gm-heatmap-body'>
      <div className='gm-heatmap-scale'>
        <span>{t('高')}</span>
        <span>{t('低')}</span>
      </div>
      <div className='gm-heatmap-grid'>
        {[0, 1, 2, 3].map((row) =>
          heatmap.map((item) => {
            const opacity = Math.max(
              0.16,
              Math.min(1, item.intensity * (1 - row * 0.13) + 0.12),
            );
            return (
              <span
                key={`${row}-${item.hour}`}
                style={{ '--heat-opacity': opacity }}
                title={`${String(item.hour).padStart(2, '0')}:00 · ${t('请求数')}: ${renderNumber(item.count)} · ${t('消耗')}: ${renderQuota(item.quota, 3)}`}
              />
            );
          }),
        )}
      </div>
    </div>
    <div className='gm-heatmap-axis'>
      {[
        '00:00',
        '02:00',
        '04:00',
        '06:00',
        '08:00',
        '10:00',
        '12:00',
        '14:00',
        '16:00',
        '18:00',
        '22:00',
        '24:00',
      ].map((label) => (
        <span key={label}>{label}</span>
      ))}
    </div>
  </section>
);

const SystemStatusPanel = ({
  quotaData,
  recentLogs,
  recentLogsLoading,
  uptimeData,
  uptimeEnabled,
  statusReady,
  t,
}) => {
  const monitors = (uptimeData || []).flatMap((group) => group.monitors || []);
  const abnormalMonitors = monitors.filter(
    (monitor) => Number(monitor.status) !== 1,
  ).length;
  const cards = [
    {
      label: t('API 服务'),
      value: statusReady ? t('运行中') : t('加载中'),
      tone: statusReady ? 'success' : 'warning',
      icon: Server,
    },
    {
      label: t('用量数据'),
      value: quotaData?.length ? t('已同步') : t('暂无数据'),
      tone: quotaData?.length ? 'success' : 'muted',
      icon: Database,
    },
    {
      label: t('请求日志'),
      value: recentLogsLoading
        ? t('同步中')
        : recentLogs?.length
          ? t('已连接')
          : t('暂无数据'),
      tone: recentLogsLoading
        ? 'warning'
        : recentLogs?.length
          ? 'success'
          : 'muted',
      icon: RadioTower,
    },
    {
      label: t('监控服务'),
      value: uptimeEnabled
        ? abnormalMonitors > 0
          ? `${abnormalMonitors} ${t('项异常')}`
          : t('运行中')
        : t('未启用'),
      tone: !uptimeEnabled
        ? 'muted'
        : abnormalMonitors > 0
          ? 'warning'
          : 'success',
      icon: ShieldCheck,
    },
  ];

  return (
    <section className='gm-figma-panel gm-system-panel'>
      <div className='gm-figma-panel-head'>
        <h3>{t('系统状态')}</h3>
      </div>
      <div className='gm-system-grid'>
        {cards.map((item) => {
          const Icon = item.icon;
          return (
            <div
              className='gm-system-card'
              data-tone={item.tone}
              key={item.label}
            >
              <Icon size={16} />
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const DashboardOverviewGrid = ({
  quotaData,
  recentLogs,
  recentLogsLoading,
  uptimeData,
  uptimeEnabled,
  statusReady,
  t,
}) => {
  const [trendGranularity, setTrendGranularity] = useState('day');
  const requestSeries = useMemo(
    () => buildTimeSeries(quotaData, 'count', trendGranularity),
    [quotaData, trendGranularity],
  );
  const costSeries = useMemo(
    () => buildTimeSeries(quotaData, 'quota', trendGranularity),
    [quotaData, trendGranularity],
  );
  const modelStats = useMemo(() => buildModelStats(quotaData), [quotaData]);
  const statusStats = useMemo(
    () => buildStatusStats(quotaData, recentLogs),
    [quotaData, recentLogs],
  );
  const heatmap = useMemo(() => buildHeatmap(quotaData), [quotaData]);

  return (
    <div className='gm-figma-overview-grid'>
      <TrendAreaPanel
        title={t('请求趋势')}
        tone='purple'
        series={requestSeries}
        formatter={(value) => renderNumber(value)}
        granularity={trendGranularity}
        onGranularityChange={setTrendGranularity}
        t={t}
      />
      <TrendAreaPanel
        title={t('消耗趋势')}
        tone='blue'
        series={costSeries}
        formatter={(value) => renderQuota(value, 2)}
        granularity={trendGranularity}
        onGranularityChange={setTrendGranularity}
        t={t}
      />
      <DonutPanel
        title={t('模型使用占比')}
        centerLabel={t('总请求数')}
        centerValue={renderNumber(modelStats.totalCount)}
        rows={modelStats.rows.map((item) => ({
          ...item,
          label: item.model,
        }))}
      />
      <ModelRankingPanel modelStats={modelStats} t={t} />
      <DonutPanel
        title={t('状态码分布')}
        centerLabel={t('总请求数')}
        centerValue={renderNumber(statusStats.total)}
        rows={statusStats.rows}
      />
      <RealtimeRequestsPanel recentLogs={recentLogs} t={t} />
      <HeatmapPanel heatmap={heatmap} t={t} />
      <SystemStatusPanel
        quotaData={quotaData}
        recentLogs={recentLogs}
        recentLogsLoading={recentLogsLoading}
        uptimeData={uptimeData}
        uptimeEnabled={uptimeEnabled}
        statusReady={statusReady}
        t={t}
      />
    </div>
  );
};

export default DashboardOverviewGrid;
