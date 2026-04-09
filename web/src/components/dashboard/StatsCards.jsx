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
import { VChart } from '@visactor/react-vchart';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const StatsCards = ({
  groupedStatsData,
  loading,
  getTrendSpec,
  CARD_PROPS,
  CHART_CONFIG,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div className='mb-6'>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {groupedStatsData.map((group, idx) => (
          <Card
            key={idx}
            {...CARD_PROPS}
            className={`gm-console-stat-card ${group.color} border-0 !rounded-[28px] w-full`}
            title={group.title}
          >
            <div className='space-y-4'>
              {group.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  className='gm-console-stat-item flex items-center justify-between cursor-pointer'
                  onClick={item.onClick}
                >
                  <div className='gm-console-stat-main flex items-center'>
                    <Avatar
                      className={`mr-3 gm-console-stat-avatar gm-console-stat-avatar-${item.avatarColor}`}
                      size='small'
                      color={item.avatarColor}
                    >
                      {item.icon}
                    </Avatar>
                    <div className='gm-console-stat-copy'>
                      <div className='gm-console-stat-label text-xs text-gray-500'>
                        {item.title}
                      </div>
                      <div className='gm-console-stat-value text-lg font-semibold'>
                        <Skeleton
                          loading={loading}
                          active
                          placeholder={
                            <Skeleton.Paragraph
                              active
                              rows={1}
                              style={{
                                width: '65px',
                                height: '24px',
                                marginTop: '4px',
                              }}
                            />
                          }
                        >
                          {item.value}
                        </Skeleton>
                      </div>
                    </div>
                  </div>
                  <div className='gm-console-stat-aside'>
                    {item.title === t('当前余额') ? (
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
                    ) : (
                      (loading ||
                        (item.trendData && item.trendData.length > 0)) && (
                        <div className='gm-console-mini-chart w-24 h-10'>
                          <VChart
                            spec={getTrendSpec(item.trendData, item.trendColor)}
                            option={CHART_CONFIG}
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StatsCards;
