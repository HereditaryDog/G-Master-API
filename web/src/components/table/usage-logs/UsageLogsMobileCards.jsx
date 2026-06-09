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
import {
  Card,
  Descriptions,
  Empty,
  Spin,
  Tag,
  Typography,
} from '@douyinfe/semi-ui';
import {
  IllustrationNoResult,
  IllustrationNoResultDark,
} from '@douyinfe/semi-illustrations';
import { renderQuota } from '../../../helpers';

const typeColorMap = {
  1: 'cyan',
  2: 'lime',
  3: 'orange',
  4: 'purple',
  5: 'red',
  6: 'teal',
};

const typeTextMap = {
  1: '充值',
  2: '消费',
  3: '管理',
  4: '系统',
  5: '错误',
  6: '退款',
};

function renderTypeTag(type, t) {
  return (
    <Tag color={typeColorMap[type] || 'grey'} shape='circle'>
      {t(typeTextMap[type] || '未知')}
    </Tag>
  );
}

const MobileMeta = ({ label, value }) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return (
    <div className='min-w-0'>
      <div className='text-xs text-gray-500 dark:text-gray-400'>{label}</div>
      <div className='mt-0.5 truncate text-sm text-gray-900 dark:text-gray-100'>
        {value}
      </div>
    </div>
  );
};

const UsageLogsMobileCards = ({
  logs,
  expandData,
  loading,
  copyText,
  isAdminUser,
  billingDisplayMode,
  t,
}) => {
  if (loading) {
    return (
      <div className='flex justify-center py-10'>
        <Spin />
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Empty
        image={<IllustrationNoResult style={{ width: 150, height: 150 }} />}
        darkModeImage={
          <IllustrationNoResultDark style={{ width: 150, height: 150 }} />
        }
        description={t('搜索无结果')}
        style={{ padding: 30 }}
      />
    );
  }

  return (
    <div className='flex flex-col gap-3'>
      {logs.map((record) => {
        const detailData = expandData?.[record.key] || [];
        const totalTokens =
          Number(record.prompt_tokens || 0) +
          Number(record.completion_tokens || 0);
        return (
          <Card
            key={record.key}
            className='rounded-lg border border-gray-100 dark:border-gray-800'
          >
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0'>
                <Typography.Text
                  ellipsis={{ showTooltip: true }}
                  strong
                  className='block max-w-[220px]'
                >
                  {record.model_name || record.content || t('未命名记录')}
                </Typography.Text>
                <div className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                  {record.timestamp2string}
                </div>
              </div>
              {renderTypeTag(record.type, t)}
            </div>

            <div className='mt-3 grid grid-cols-2 gap-3'>
              <MobileMeta
                label={t('费用')}
                value={renderQuota(record.quota, 6, billingDisplayMode)}
              />
              <MobileMeta label={t('Tokens')} value={totalTokens} />
              <MobileMeta
                label={t('耗时')}
                value={`${record.use_time || 0} s`}
              />
              <MobileMeta label={t('令牌')} value={record.token_name} />
              {isAdminUser && (
                <>
                  <MobileMeta label={t('用户')} value={record.username} />
                  <MobileMeta
                    label={t('渠道')}
                    value={record.channel_name || record.channel}
                  />
                </>
              )}
            </div>

            {record.request_id && (
              <button
                type='button'
                className='mt-3 max-w-full truncate text-left text-xs text-blue-600 dark:text-blue-400'
                onClick={(event) => copyText(event, record.request_id)}
              >
                {t('Request ID')}: {record.request_id}
              </button>
            )}

            {detailData.length > 0 && (
              <div className='mt-3 border-t border-gray-100 pt-3 dark:border-gray-800'>
                <Descriptions data={detailData} size='small' />
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default UsageLogsMobileCards;
