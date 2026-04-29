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
import { Space, Tag, Typography } from '@douyinfe/semi-ui';
import {
  renderGroup,
  renderNumber,
  renderQuota,
  timestamp2string,
} from '../../../helpers';

const { Text } = Typography;

const renderTimestamp = (timestamp) => {
  if (!timestamp || Number(timestamp) <= 0) {
    return '-';
  }
  return timestamp2string(timestamp);
};

const renderSessionStatus = (status, t) => {
  const statusMap = {
    active: { color: 'green', text: t('有效') },
    expired: { color: 'orange', text: t('已过期') },
    revoked: { color: 'red', text: t('已撤销') },
  };
  const item = statusMap[status] || { color: 'grey', text: status || '-' };
  return (
    <Tag color={item.color} shape='circle'>
      {item.text}
    </Tag>
  );
};

const renderTokenStatus = (status, t) => {
  if (!status) {
    return (
      <Tag color='grey' shape='circle'>
        {t('未创建')}
      </Tag>
    );
  }
  if (status === 1) {
    return (
      <Tag color='green' shape='circle'>
        {t('已启用')}
      </Tag>
    );
  }
  return (
    <Tag color='red' shape='circle'>
      {t('已禁用')}
    </Tag>
  );
};

const renderUser = (record) => {
  return (
    <div className='flex flex-col gap-1 min-w-[160px]'>
      <Text strong>{record.username || '-'}</Text>
      <Text size='small' type='secondary'>
        {record.display_name || record.email || `ID: ${record.user_id}`}
      </Text>
      <Text size='small' type='tertiary'>
        ID: {record.user_id}
      </Text>
    </div>
  );
};

const renderClient = (record) => {
  return (
    <div className='flex flex-col gap-1 min-w-[140px]'>
      <Text>{record.client_name || '-'}</Text>
      <Text size='small' type='secondary'>
        {record.client_version || '-'}
      </Text>
    </div>
  );
};

const renderProviderToken = (record, t) => {
  if (!record.provider_token_id) {
    return renderTokenStatus(0, t);
  }
  return (
    <div className='flex flex-col gap-1 min-w-[170px]'>
      <Space spacing={4} wrap>
        <Text>ID: {record.provider_token_id}</Text>
        {renderTokenStatus(record.provider_token_status, t)}
      </Space>
      <Text size='small' type='secondary'>
        {record.provider_token_name || '-'}
      </Text>
      <div>{renderGroup(record.provider_token_group || '-')}</div>
    </div>
  );
};

const renderUsage = (record, t) => {
  return (
    <div className='flex flex-col gap-1 min-w-[150px]'>
      <Text strong>{renderQuota(record.used_quota || 0)}</Text>
      <Text size='small' type='secondary'>
        {t('令牌累计')}: {renderQuota(record.provider_token_used_quota || 0)}
      </Text>
    </div>
  );
};

const renderTokens = (record, t) => {
  const promptTokens = Number(record.prompt_tokens || 0);
  const completionTokens = Number(record.completion_tokens || 0);
  return (
    <div className='flex flex-col gap-1 min-w-[140px]'>
      <Text strong>{renderNumber(promptTokens + completionTokens)}</Text>
      <Text size='small' type='secondary'>
        P {renderNumber(promptTokens)} / C {renderNumber(completionTokens)}
      </Text>
    </div>
  );
};

export const getOAuthLoginsColumns = ({ t }) => [
  {
    title: t('用户'),
    dataIndex: 'username',
    key: 'user',
    render: (text, record) => renderUser(record),
  },
  {
    title: t('用户分组'),
    dataIndex: 'user_group',
    key: 'user_group',
    render: (text) => renderGroup(text || '-'),
  },
  {
    title: t('客户端'),
    dataIndex: 'client_name',
    key: 'client',
    render: (text, record) => renderClient(record),
  },
  {
    title: t('授权状态'),
    dataIndex: 'session_status',
    key: 'session_status',
    render: (status) => renderSessionStatus(status, t),
  },
  {
    title: t('Provider Key'),
    dataIndex: 'provider_token_id',
    key: 'provider_token',
    render: (text, record) => renderProviderToken(record, t),
  },
  {
    title: t('用量'),
    dataIndex: 'used_quota',
    key: 'usage',
    render: (text, record) => renderUsage(record, t),
  },
  {
    title: t('请求数'),
    dataIndex: 'request_count',
    key: 'request_count',
    render: (count) => renderNumber(count || 0),
  },
  {
    title: 'Tokens',
    dataIndex: 'prompt_tokens',
    key: 'tokens',
    render: (text, record) => renderTokens(record, t),
  },
  {
    title: t('授权时间'),
    dataIndex: 'created_at',
    key: 'created_at',
    render: renderTimestamp,
  },
  {
    title: t('最后使用'),
    dataIndex: 'last_used_at',
    key: 'last_used_at',
    render: renderTimestamp,
  },
  {
    title: t('过期时间'),
    dataIndex: 'expires_at',
    key: 'expires_at',
    render: renderTimestamp,
  },
];
