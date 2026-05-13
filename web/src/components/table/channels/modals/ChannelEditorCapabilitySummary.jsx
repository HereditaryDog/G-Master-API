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
import { Banner, Tag, Typography } from '@douyinfe/semi-ui';
import { GitBranch, KeyRound, Route, SlidersHorizontal } from 'lucide-react';

const { Text } = Typography;

function hasText(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function CapabilityPill({ icon, label, active, detail }) {
  return (
    <div
      style={{
        border: '1px solid var(--semi-color-border)',
        borderRadius: 12,
        padding: 10,
        background: active
          ? 'var(--semi-color-primary-light-default)'
          : 'var(--semi-color-bg-0)',
      }}
    >
      <div className='flex items-center gap-2 mb-1'>
        {icon}
        <Text strong>{label}</Text>
        <Tag
          size='small'
          color={active ? 'blue' : 'grey'}
          shape='circle'
          style={{ marginLeft: 'auto' }}
        >
          {active ? 'ON' : 'OFF'}
        </Tag>
      </div>
      <Text type='tertiary' size='small'>
        {detail}
      </Text>
    </div>
  );
}

export default function ChannelEditorCapabilitySummary({
  t,
  inputs,
  pollingModeDependencyMissing = false,
  upstreamDetectedModels = [],
}) {
  const isMultiKey = Boolean(inputs?.is_multi_key);
  const hasModelMapping = hasText(inputs?.model_mapping);
  const hasParamOverride = hasText(inputs?.param_override);
  const upstreamSyncEnabled = Boolean(
    inputs?.upstream_model_update_check_enabled,
  );
  const autoSyncEnabled = Boolean(
    inputs?.upstream_model_update_auto_sync_enabled,
  );

  return (
    <div className='space-y-3'>
      {pollingModeDependencyMissing ? (
        <Banner
          type='warning'
          closeIcon={null}
          description={t(
            '轮询多密钥依赖 Redis 与内存缓存，当前环境缺少依赖时建议改用随机模式。',
          )}
        />
      ) : null}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
        <CapabilityPill
          icon={<KeyRound size={15} color='#2563eb' />}
          label={t('多密钥')}
          active={isMultiKey}
          detail={
            isMultiKey
              ? `${t('模式')}: ${inputs?.multi_key_mode === 'polling' ? t('轮询') : t('随机')}`
              : t('单密钥渠道')
          }
        />
        <CapabilityPill
          icon={<Route size={15} color='#7c3aed' />}
          label={t('模型映射')}
          active={hasModelMapping}
          detail={
            hasModelMapping ? t('已配置模型重定向') : t('未配置模型重定向')
          }
        />
        <CapabilityPill
          icon={<SlidersHorizontal size={15} color='#059669' />}
          label={t('参数覆写')}
          active={hasParamOverride}
          detail={
            hasParamOverride ? t('已配置请求参数处理') : t('未配置参数覆写')
          }
        />
        <CapabilityPill
          icon={<GitBranch size={15} color='#ea580c' />}
          label={t('上游同步')}
          active={upstreamSyncEnabled}
          detail={
            upstreamSyncEnabled
              ? `${autoSyncEnabled ? t('自动同步') : t('仅检测')} · ${upstreamDetectedModels.length} ${t('个待加入模型')}`
              : t('未开启上游模型检测')
          }
        />
      </div>
    </div>
  );
}
