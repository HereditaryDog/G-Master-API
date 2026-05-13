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
import { Tag, Tooltip, Typography } from '@douyinfe/semi-ui';
import {
  CreditCard,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from 'lucide-react';

const { Text } = Typography;

const preferenceLabelMap = {
  subscription_first: '优先订阅',
  wallet_first: '优先钱包',
  subscription_only: '仅用订阅',
  wallet_only: '仅用钱包',
};

function SummaryItem({ icon, label, value, hint }) {
  const content = (
    <div
      style={{
        border: '1px solid var(--semi-color-border)',
        borderRadius: 12,
        padding: 12,
        background: 'var(--semi-color-bg-0)',
        minHeight: 78,
      }}
    >
      <div className='flex items-center gap-2 mb-2'>
        {icon}
        <Text type='tertiary' size='small'>
          {label}
        </Text>
      </div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
    </div>
  );

  if (!hint) {
    return content;
  }

  return <Tooltip content={hint}>{content}</Tooltip>;
}

export default function WalletSubscriptionSummary({
  t,
  userState,
  renderQuota,
  billingPreference,
  activeSubscriptions = [],
  allSubscriptions = [],
  payMethods = [],
  enableStripeTopUp = false,
  enableCreemTopUp = false,
  enableOnlineTopUp = false,
  enableWaffoTopUp = false,
  enableWaffoPancakeTopUp = false,
}) {
  const enabledMethodCount = [
    enableStripeTopUp,
    enableCreemTopUp,
    enableOnlineTopUp,
    enableWaffoTopUp,
    enableWaffoPancakeTopUp,
  ].filter(Boolean).length;
  const epayCount = (payMethods || []).filter(
    (method) =>
      method?.type && method.type !== 'stripe' && method.type !== 'creem',
  ).length;
  const totalPaymentMethods = enabledMethodCount + epayCount;
  const preferenceLabel =
    preferenceLabelMap[billingPreference] ||
    billingPreference ||
    'wallet_first';

  return (
    <div
      className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4'
      style={{ width: '100%' }}
    >
      <SummaryItem
        icon={<Wallet size={16} color='#2563eb' />}
        label={t('钱包余额')}
        value={renderQuota(userState?.user?.quota || 0)}
        hint={t('当前钱包可用余额')}
      />
      <SummaryItem
        icon={<Receipt size={16} color='#7c3aed' />}
        label={t('历史消耗')}
        value={renderQuota(userState?.user?.used_quota || 0)}
        hint={t('账号累计消费额度')}
      />
      <SummaryItem
        icon={<ShieldCheck size={16} color='#059669' />}
        label={t('订阅状态')}
        value={
          <div className='flex items-center gap-2'>
            <span>{activeSubscriptions.length}</span>
            <Tag size='small' color='green' shape='circle'>
              {t('生效中')}
            </Tag>
            {allSubscriptions.length > activeSubscriptions.length ? (
              <Tag size='small' color='grey' shape='circle'>
                {allSubscriptions.length} {t('总计')}
              </Tag>
            ) : null}
          </div>
        }
        hint={t('当前可用于订阅抵扣的实例数量')}
      />
      <SummaryItem
        icon={<RefreshCw size={16} color='#ea580c' />}
        label={t('扣费偏好')}
        value={
          <div className='flex items-center gap-2'>
            <span>{t(preferenceLabel)}</span>
            <Tag size='small' color='blue' shape='circle'>
              <CreditCard size={12} style={{ marginRight: 4 }} />
              {totalPaymentMethods}
            </Tag>
          </div>
        }
        hint={t('订阅与钱包扣费顺序，以及当前可用支付入口数量')}
      />
    </div>
  );
}
