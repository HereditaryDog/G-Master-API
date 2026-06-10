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
import { Card, Select, Typography, Button, Switch } from '@douyinfe/semi-ui';
import { Sparkles, Users, ToggleLeft, X, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { renderGroupOption, selectFilter } from '../../helpers';
import ParameterControl from './ParameterControl';
import ImageUrlInput from './ImageUrlInput';
import ConfigManager from './ConfigManager';
import CustomRequestEditor from './CustomRequestEditor';

const SettingsPanel = ({
  inputs,
  parameterEnabled,
  models,
  groups,
  styleState,
  showDebugPanel,
  customRequestMode,
  customRequestBody,
  onInputChange,
  onParameterToggle,
  onCloseSettings,
  onConfigImport,
  onConfigReset,
  onCustomRequestModeChange,
  onCustomRequestBodyChange,
  previewPayload,
  messages,
}) => {
  const { t } = useTranslation();

  const currentConfig = {
    inputs,
    parameterEnabled,
    showDebugPanel,
    customRequestMode,
    customRequestBody,
  };

  return (
    <Card
      className='gm-playground-panel gm-playground-config-panel h-full flex flex-col'
      bordered={false}
      bodyStyle={{
        padding: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className='gm-playground-panel-header'>
        <div className='gm-playground-panel-title'>
          <div className='gm-playground-panel-icon gm-playground-panel-icon-config'>
            <Settings size={20} className='text-white' />
          </div>
          <div className='min-w-0'>
            <Typography.Title heading={5} className='gm-playground-heading'>
              {t('模型配置')}
            </Typography.Title>
            <Typography.Text className='gm-playground-subtitle'>
              {t('会话、模型和采样参数')}
            </Typography.Text>
          </div>
        </div>

        {styleState.isMobile && onCloseSettings && (
          <Button
            icon={<X size={16} />}
            onClick={onCloseSettings}
            theme='borderless'
            type='tertiary'
            size='small'
            className='!rounded-lg'
          />
        )}
      </div>

      {/* 移动端配置管理 */}
      {styleState.isMobile && (
        <div className='gm-playground-mobile-config-actions'>
          <ConfigManager
            currentConfig={currentConfig}
            onConfigImport={onConfigImport}
            onConfigReset={onConfigReset}
            styleState={{ ...styleState, isMobile: false }}
            messages={messages}
          />
        </div>
      )}

      <div className='gm-playground-config-scroll model-settings-scroll'>
        {/* 自定义请求体编辑器 */}
        <div className='gm-playground-config-section gm-playground-config-section-primary'>
          <CustomRequestEditor
            customRequestMode={customRequestMode}
            customRequestBody={customRequestBody}
            onCustomRequestModeChange={onCustomRequestModeChange}
            onCustomRequestBodyChange={onCustomRequestBodyChange}
            defaultPayload={previewPayload}
          />
        </div>

        {/* 分组选择 */}
        <div
          className={`gm-playground-config-section ${customRequestMode ? 'opacity-50' : ''}`}
        >
          <div className='flex items-center gap-2 mb-2'>
            <Users size={16} className='text-gray-500' />
            <Typography.Text strong className='text-sm'>
              {t('分组')}
            </Typography.Text>
            {customRequestMode && (
              <Typography.Text className='text-xs text-orange-600'>
                ({t('已在自定义模式中忽略')})
              </Typography.Text>
            )}
          </div>
          <Select
            placeholder={t('请选择分组')}
            name='group'
            required
            selection
            filter={selectFilter}
            autoClearSearchValue={false}
            onChange={(value) => onInputChange('group', value)}
            value={inputs.group}
            autoComplete='new-password'
            optionList={groups}
            renderOptionItem={renderGroupOption}
            style={{ width: '100%' }}
            dropdownStyle={{ width: '100%', maxWidth: '100%' }}
            className='!rounded-lg'
            disabled={customRequestMode}
          />
        </div>

        {/* 模型选择 */}
        <div
          className={`gm-playground-config-section ${customRequestMode ? 'opacity-50' : ''}`}
        >
          <div className='flex items-center gap-2 mb-2'>
            <Sparkles size={16} className='text-gray-500' />
            <Typography.Text strong className='text-sm'>
              {t('模型')}
            </Typography.Text>
            {customRequestMode && (
              <Typography.Text className='text-xs text-orange-600'>
                ({t('已在自定义模式中忽略')})
              </Typography.Text>
            )}
          </div>
          <Select
            placeholder={t('请选择模型')}
            name='model'
            required
            selection
            filter={selectFilter}
            autoClearSearchValue={false}
            onChange={(value) => onInputChange('model', value)}
            value={inputs.model}
            autoComplete='new-password'
            optionList={models}
            style={{ width: '100%' }}
            dropdownStyle={{ width: '100%', maxWidth: '100%' }}
            className='!rounded-lg'
            disabled={customRequestMode}
          />
        </div>

        {/* 图片URL输入 */}
        <div
          className={`gm-playground-config-section ${customRequestMode ? 'opacity-50' : ''}`}
        >
          <ImageUrlInput
            imageUrls={inputs.imageUrls}
            imageEnabled={inputs.imageEnabled}
            onImageUrlsChange={(urls) => onInputChange('imageUrls', urls)}
            onImageEnabledChange={(enabled) =>
              onInputChange('imageEnabled', enabled)
            }
            disabled={customRequestMode}
          />
        </div>

        {/* 参数控制组件 */}
        <div
          className={`gm-playground-config-section ${customRequestMode ? 'opacity-50' : ''}`}
        >
          <ParameterControl
            inputs={inputs}
            parameterEnabled={parameterEnabled}
            onInputChange={onInputChange}
            onParameterToggle={onParameterToggle}
            disabled={customRequestMode}
          />
        </div>

        {/* 流式输出开关 */}
        <div
          className={`gm-playground-config-section gm-playground-stream-section ${customRequestMode ? 'opacity-50' : ''}`}
        >
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <ToggleLeft size={16} className='text-gray-500' />
              <Typography.Text strong className='text-sm'>
                {t('流式输出')}
              </Typography.Text>
              {customRequestMode && (
                <Typography.Text className='text-xs text-orange-600'>
                  ({t('已在自定义模式中忽略')})
                </Typography.Text>
              )}
            </div>
            <Switch
              checked={inputs.stream}
              onChange={(checked) => onInputChange('stream', checked)}
              checkedText={t('开')}
              uncheckedText={t('关')}
              size='small'
              disabled={customRequestMode}
            />
          </div>
        </div>
      </div>

      {/* 桌面端的配置管理放在底部 */}
      {!styleState.isMobile && (
        <div className='gm-playground-config-footer'>
          <ConfigManager
            currentConfig={currentConfig}
            onConfigImport={onConfigImport}
            onConfigReset={onConfigReset}
            styleState={styleState}
            messages={messages}
          />
        </div>
      )}
    </Card>
  );
};

export default SettingsPanel;
