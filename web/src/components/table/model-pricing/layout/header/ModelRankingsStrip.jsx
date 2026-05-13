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

import React, { useEffect, useState } from 'react';
import { Skeleton, Tag } from '@douyinfe/semi-ui';
import { IconArrowUp, IconMinus } from '@douyinfe/semi-icons';
import { getRankings } from '../../../../../helpers/api';

const formatTokens = (value) => {
  const tokens = Number(value || 0);
  if (tokens >= 1000000000) return `${(tokens / 1000000000).toFixed(2)}B`;
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(2)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return String(tokens);
};

const growthTone = (growth) => {
  if (growth > 0) return 'green';
  if (growth < 0) return 'red';
  return 'grey';
};

const GrowthTag = ({ growth, t }) => {
  const value = Number(growth || 0);
  const prefix = value > 0 ? '+' : '';
  return (
    <Tag size='small' color={growthTone(value)} shape='circle'>
      {value === 0 ? <IconMinus /> : <IconArrowUp />}
      <span>{value === 0 ? t('持平') : `${prefix}${value.toFixed(1)}%`}</span>
    </Tag>
  );
};

const ModelRankingsStrip = ({ t }) => {
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState([]);

  useEffect(() => {
    let mounted = true;
    const loadRankings = async () => {
      setLoading(true);
      try {
        const res = await getRankings('week');
        const { success, data } = res.data || {};
        if (mounted) {
          setModels(success ? data?.models?.slice(0, 5) || [] : []);
        }
      } catch (error) {
        console.error(error);
        if (mounted) setModels([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadRankings();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className='gm-pricing-rankings-strip'>
      <div className='gm-pricing-rankings-head'>
        <span>{t('本周排行')}</span>
        <strong>{t('模型热度')}</strong>
      </div>
      <Skeleton
        loading={loading}
        active
        placeholder={<Skeleton.Paragraph rows={1} />}
      >
        {models.length === 0 ? (
          <div className='gm-pricing-rankings-empty'>{t('暂无排行数据')}</div>
        ) : (
          <div className='gm-pricing-rankings-list'>
            {models.map((model) => (
              <div
                key={model.model_name}
                className='gm-pricing-ranking-item'
                title={model.model_name}
              >
                <i>{model.rank}</i>
                <span>{model.model_name}</span>
                <em>{formatTokens(model.total_tokens)} Tokens</em>
                <GrowthTag growth={model.growth_pct} t={t} />
              </div>
            ))}
          </div>
        )}
      </Skeleton>
    </section>
  );
};

export default ModelRankingsStrip;
