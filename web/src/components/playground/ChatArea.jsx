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
import { Card, Chat, Typography, Button } from '@douyinfe/semi-ui';
import {
  Activity,
  Eye,
  EyeOff,
  MessageSquare,
  Radio,
  Sparkles,
  Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CustomInputRender from './CustomInputRender';

const ChatArea = ({
  chatRef,
  message,
  inputs,
  styleState,
  showDebugPanel,
  roleInfo,
  onMessageSend,
  onMessageCopy,
  onMessageReset,
  onMessageDelete,
  onStopGenerator,
  onClearMessages,
  onToggleDebugPanel,
  renderCustomChatContent,
  renderChatBoxAction,
}) => {
  const { t } = useTranslation();

  const renderInputArea = React.useCallback((props) => {
    return <CustomInputRender {...props} />;
  }, []);

  return (
    <Card
      className='gm-playground-chat-card h-full'
      bordered={false}
      bodyStyle={{
        padding: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div className='gm-playground-chat-topbar'>
        <div className='gm-playground-chat-title'>
          <div className='gm-playground-chat-icon'>
            <MessageSquare size={18} />
          </div>
          <div className='min-w-0'>
            <Typography.Title heading={5} className='gm-playground-heading'>
              {t('AI 对话')}
            </Typography.Title>
            <Typography.Text className='gm-playground-subtitle'>
              {t('Chat Completions 调试工作台')}
            </Typography.Text>
          </div>
        </div>

        <div className='gm-playground-chat-status'>
          <span className='gm-playground-status-chip gm-playground-status-chip-active'>
            <Activity size={13} />
            {t('就绪')}
          </span>
          <span className='gm-playground-status-chip'>
            <Radio size={13} />
            {inputs.stream ? t('流式') : t('非流式')}
          </span>
          <Button
            icon={showDebugPanel ? <EyeOff size={14} /> : <Eye size={14} />}
            onClick={onToggleDebugPanel}
            theme='borderless'
            type='primary'
            size='small'
            className='gm-playground-debug-toggle'
          >
            {showDebugPanel ? t('隐藏调试') : t('显示调试')}
          </Button>
        </div>
      </div>

      <div className='gm-playground-session-bar'>
        <div className='gm-playground-session-item'>
          <Sparkles size={14} />
          <span>{t('模型')}</span>
          <strong>{inputs.model || t('请选择模型')}</strong>
        </div>
        <div className='gm-playground-session-item'>
          <Users size={14} />
          <span>{t('分组')}</span>
          <strong>{inputs.group || t('请选择分组')}</strong>
        </div>
      </div>

      {/* 聊天内容区域 */}
      <div className='gm-playground-chat-body flex-1 overflow-hidden'>
        <Chat
          ref={chatRef}
          chatBoxRenderConfig={{
            renderChatBoxContent: renderCustomChatContent,
            renderChatBoxAction: renderChatBoxAction,
            renderChatBoxTitle: () => null,
          }}
          renderInputArea={renderInputArea}
          roleConfig={roleInfo}
          style={{
            height: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
          }}
          chats={message}
          onMessageSend={onMessageSend}
          onMessageCopy={onMessageCopy}
          onMessageReset={onMessageReset}
          onMessageDelete={onMessageDelete}
          showClearContext
          showStopGenerate
          onStopGenerator={onStopGenerator}
          onClear={onClearMessages}
          className='h-full'
          placeholder={t('请输入您的问题...')}
        />
      </div>
    </Card>
  );
};

export default ChatArea;
