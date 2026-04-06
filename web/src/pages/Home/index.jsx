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

import React, { useContext, useEffect, useState } from 'react';
import {
  Button,
  Typography,
  Input,
  ScrollList,
  ScrollItem,
} from '@douyinfe/semi-ui';
import { API, showError, copy, showSuccess } from '../../helpers';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { API_ENDPOINTS } from '../../constants/common.constant';
import { StatusContext } from '../../context/Status';
import { useActualTheme } from '../../context/Theme';
import { marked } from 'marked';
import { useTranslation } from 'react-i18next';
import {
  IconGithubLogo,
  IconPlay,
  IconFile,
  IconCopy,
} from '@douyinfe/semi-icons';
import { Link } from 'react-router-dom';
import NoticeModal from '../../components/layout/NoticeModal';
import {
  Moonshot,
  OpenAI,
  XAI,
  Zhipu,
  Volcengine,
  Cohere,
  Claude,
  Gemini,
  Suno,
  Minimax,
  Wenxin,
  Spark,
  Qingyan,
  DeepSeek,
  Qwen,
  Midjourney,
  Grok,
  AzureAI,
  Hunyuan,
  Xinference,
} from '@lobehub/icons';

const { Text } = Typography;

const Home = () => {
  const { t, i18n } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const actualTheme = useActualTheme();
  const [homePageContentLoaded, setHomePageContentLoaded] = useState(false);
  const [homePageContent, setHomePageContent] = useState('');
  const [noticeVisible, setNoticeVisible] = useState(false);
  const isMobile = useIsMobile();
  const isDemoSiteMode = statusState?.status?.demo_site_enabled || false;
  const docsLink = statusState?.status?.docs_link || '';
  const serverAddress =
    statusState?.status?.server_address || `${window.location.origin}`;
  const endpointItems = API_ENDPOINTS.map((e) => ({ value: e }));
  const [endpointIndex, setEndpointIndex] = useState(0);
  const isChinese = i18n.language.startsWith('zh');
  const repoUrl = 'https://github.com/yangjunyu/G-Master-API';
  const featureCards = isChinese
    ? [
        {
          index: '01',
          title: '统一模型入口',
          description:
            '把不同供应商的调用方式收拢成一个兼容 OpenAI 的访问地址，减少切换成本。',
        },
        {
          index: '02',
          title: '渠道池化调度',
          description:
            '支持多密钥聚合、分组和轮询，适合小团队做内测、分流和稳定性验证。',
        },
        {
          index: '03',
          title: '本地优先部署',
          description:
            'Docker 即可启动，方便先在本地跑通，再逐步迁移到云服务器和正式环境。',
        },
      ]
    : [
        {
          index: '01',
          title: 'Unified Model Access',
          description:
            'Use one OpenAI-compatible gateway instead of switching between multiple upstream formats.',
        },
        {
          index: '02',
          title: 'Pooled Channel Routing',
          description:
            'Aggregate multiple keys with grouping and round-robin routing for small team testing.',
        },
        {
          index: '03',
          title: 'Local-First Deployment',
          description:
            'Start with Docker locally, validate quickly, then move to a server when you are ready.',
        },
      ];
  const quickSteps = isChinese
    ? [
        '添加上游渠道并完成测试',
        '创建令牌并分配分组',
        '用标准 SDK 或 curl 开始调用',
      ]
    : [
        'Add upstream channels and verify them',
        'Create tokens and assign groups',
        'Start calling with SDKs or curl',
      ];
  const valueTitle = isChinese ? '为什么选择 G-Master API' : 'Why G-Master API';
  const valueDescription = isChinese
    ? '把渠道、密钥、转发和测试流程集中到一个入口，更适合先做内部验证，再逐步上线。'
    : 'Bring channels, keys, routing, and testing into one entry point before rolling out more broadly.';
  const quickStartTitle = isChinese
    ? '从接入到可用，通常只需要这 3 步'
    : 'From setup to usable in 3 steps';
  const quickStartDescription = isChinese
    ? '适合个人项目、小团队共享账号池，以及本地 Docker 的快速验证。'
    : 'Well suited for solo projects, small teams, and quick Docker-based validation.';
  const providerSectionTitle = isChinese
    ? '兼容生态矩阵'
    : 'Compatible provider ecosystem';
  const providerSectionDescription = isChinese
    ? '统一接入不同供应商与能力类型，用同一个网关管理文本、推理、图像和音频模型。'
    : 'Bring multiple providers and capability types into one gateway for text, reasoning, image, and audio workloads.';
  const providerHighlights = isChinese
    ? ['OpenAI 兼容', '多渠道调度', '文本 / 图像 / 音频']
    : ['OpenAI Compatible', 'Multi-channel Routing', 'Text / Image / Audio'];
  const providerRows = [
    [
      { label: 'OpenAI', icon: <OpenAI size={24} /> },
      { label: 'Claude', icon: <Claude.Color size={24} /> },
      { label: 'Gemini', icon: <Gemini.Color size={24} /> },
      { label: 'Moonshot', icon: <Moonshot size={24} /> },
      { label: 'DeepSeek', icon: <DeepSeek.Color size={24} /> },
      { label: 'Qwen', icon: <Qwen.Color size={24} /> },
      { label: 'Zhipu', icon: <Zhipu.Color size={24} /> },
      { label: 'Volcengine', icon: <Volcengine.Color size={24} /> },
      { label: 'MiniMax', icon: <Minimax.Color size={24} /> },
      { label: 'Azure AI', icon: <AzureAI.Color size={24} /> },
    ],
    [
      { label: 'xAI', icon: <XAI size={24} /> },
      { label: 'Cohere', icon: <Cohere.Color size={24} /> },
      { label: 'Suno', icon: <Suno size={24} /> },
      { label: 'Spark', icon: <Spark.Color size={24} /> },
      { label: 'Qingyan', icon: <Qingyan.Color size={24} /> },
      { label: 'Wenxin', icon: <Wenxin.Color size={24} /> },
      { label: 'Hunyuan', icon: <Hunyuan.Color size={24} /> },
      { label: 'Midjourney', icon: <Midjourney size={24} /> },
      { label: 'Grok', icon: <Grok size={24} /> },
      { label: 'Xinference', icon: <Xinference.Color size={24} /> },
    ],
  ];

  const displayHomePageContent = async () => {
    setHomePageContent(localStorage.getItem('home_page_content') || '');
    const res = await API.get('/api/home_page_content');
    const { success, message, data } = res.data;
    if (success) {
      let content = data;
      if (!data.startsWith('https://')) {
        content = marked.parse(data);
      }
      setHomePageContent(content);
      localStorage.setItem('home_page_content', content);

      // 如果内容是 URL，则发送主题模式
      if (data.startsWith('https://')) {
        const iframe = document.querySelector('iframe');
        if (iframe) {
          iframe.onload = () => {
            iframe.contentWindow.postMessage({ themeMode: actualTheme }, '*');
            iframe.contentWindow.postMessage({ lang: i18n.language }, '*');
          };
        }
      }
    } else {
      showError(message);
      setHomePageContent('加载首页内容失败...');
    }
    setHomePageContentLoaded(true);
  };

  const handleCopyBaseURL = async () => {
    const ok = await copy(serverAddress);
    if (ok) {
      showSuccess(t('已复制到剪切板'));
    }
  };

  useEffect(() => {
    const checkNoticeAndShow = async () => {
      const lastCloseDate = localStorage.getItem('notice_close_date');
      const today = new Date().toDateString();
      if (lastCloseDate !== today) {
        try {
          const res = await API.get('/api/notice');
          const { success, data } = res.data;
          if (success && data && data.trim() !== '') {
            setNoticeVisible(true);
          }
        } catch (error) {
          console.error('获取公告失败:', error);
        }
      }
    };

    checkNoticeAndShow();
  }, []);

  useEffect(() => {
    displayHomePageContent().then();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setEndpointIndex((prev) => (prev + 1) % endpointItems.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [endpointItems.length]);

  return (
    <div className='w-full overflow-x-hidden'>
      <NoticeModal
        visible={noticeVisible}
        onClose={() => setNoticeVisible(false)}
        isMobile={isMobile}
      />
      {homePageContentLoaded && homePageContent === '' ? (
        <div className='w-full overflow-x-hidden'>
          {/* Banner 部分 */}
          <div className='w-full border-b border-semi-color-border min-h-[500px] md:min-h-[600px] lg:min-h-[700px] relative overflow-x-hidden'>
            {/* 背景模糊晕染球 */}
            <div className='blur-ball blur-ball-indigo' />
            <div className='blur-ball blur-ball-teal' />
            <div className='flex items-center justify-center h-full px-4 py-20 md:py-24 lg:py-32 mt-10'>
              {/* 居中内容区 */}
              <div className='flex flex-col items-center justify-center text-center max-w-4xl mx-auto'>
                <div className='flex flex-col items-center justify-center mb-6 md:mb-8'>
                  <h1
                    className={`text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-semi-color-text-0 leading-tight ${isChinese ? 'tracking-wide md:tracking-wider' : ''}`}
                  >
                    <>
                      {t('统一的')}
                      <br />
                      <span className='shine-text'>{t('大模型接口网关')}</span>
                    </>
                  </h1>
                  <p className='text-base md:text-lg lg:text-xl text-semi-color-text-1 mt-4 md:mt-6 max-w-xl'>
                    {t('更好的价格，更好的稳定性，只需要将模型基址替换为：')}
                  </p>
                  {/* BASE URL 与端点选择 */}
                  <div className='flex flex-col md:flex-row items-center justify-center gap-4 w-full mt-4 md:mt-6 max-w-md'>
                    <Input
                      readonly
                      value={serverAddress}
                      className='flex-1 !rounded-full'
                      size={isMobile ? 'default' : 'large'}
                      suffix={
                        <div className='flex items-center gap-2'>
                          <ScrollList
                            bodyHeight={32}
                            style={{ border: 'unset', boxShadow: 'unset' }}
                          >
                            <ScrollItem
                              mode='wheel'
                              cycled={true}
                              list={endpointItems}
                              selectedIndex={endpointIndex}
                              onSelect={({ index }) => setEndpointIndex(index)}
                            />
                          </ScrollList>
                          <Button
                            type='primary'
                            onClick={handleCopyBaseURL}
                            icon={<IconCopy />}
                            className='!rounded-full'
                          />
                        </div>
                      }
                    />
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className='flex flex-row gap-4 justify-center items-center'>
                  <Link to='/console'>
                    <Button
                      theme='solid'
                      type='primary'
                      size={isMobile ? 'default' : 'large'}
                      className='!rounded-3xl px-8 py-2'
                      icon={<IconPlay />}
                    >
                      {t('获取密钥')}
                    </Button>
                  </Link>
                  {isDemoSiteMode && statusState?.status?.version ? (
                    <Button
                      size={isMobile ? 'default' : 'large'}
                      className='flex items-center !rounded-3xl px-6 py-2'
                      icon={<IconGithubLogo />}
                      onClick={() =>
                        window.open(repoUrl, '_blank')
                      }
                    >
                      {statusState.status.version}
                    </Button>
                  ) : (
                    docsLink && (
                      <Button
                        size={isMobile ? 'default' : 'large'}
                        className='flex items-center !rounded-3xl px-6 py-2'
                        icon={<IconFile />}
                        onClick={() => window.open(docsLink, '_blank')}
                      >
                        {t('文档')}
                      </Button>
                    )
                  )}
                </div>

                {/* 框架兼容性图标 */}
                <div className='mt-12 md:mt-16 lg:mt-20 w-full'>
                  <div className='provider-showcase'>
                    <div className='provider-showcase-header'>
                      <div className='text-left'>
                        <div className='provider-showcase-title'>
                          {providerSectionTitle}
                        </div>
                        <p className='provider-showcase-description'>
                          {providerSectionDescription}
                        </p>
                      </div>
                      <div className='provider-showcase-count'>
                        <span className='provider-showcase-count-number'>
                          20+
                        </span>
                        <span>{t('支持众多的大模型供应商')}</span>
                      </div>
                    </div>

                    <div className='provider-highlight-row'>
                      {providerHighlights.map((item) => (
                        <span key={item} className='provider-highlight-pill'>
                          {item}
                        </span>
                      ))}
                    </div>

                    {providerRows.map((row, rowIndex) => (
                      <div
                        key={`row-${rowIndex}`}
                        className={`provider-marquee ${rowIndex % 2 === 1 ? 'reverse' : ''}`}
                      >
                        <div className='provider-marquee-track'>
                          {[...row, ...row].map((provider, index) => (
                            <div
                              key={`${provider.label}-${rowIndex}-${index}`}
                              className='provider-chip'
                            >
                              <div className='provider-chip-icon'>
                                {provider.icon}
                              </div>
                              <span className='provider-chip-label'>
                                {provider.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section className='w-full border-b border-semi-color-border px-4 py-12 md:py-14'>
            <div className='mx-auto max-w-6xl'>
              <div className='mx-auto mb-8 max-w-3xl text-center md:mb-10'>
                <Text className='!text-2xl md:!text-3xl !font-semibold !text-semi-color-text-0'>
                  {valueTitle}
                </Text>
                <p className='mt-3 text-sm leading-7 text-semi-color-text-1 md:text-base'>
                  {valueDescription}
                </p>
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                {featureCards.map((card) => (
                  <div
                    key={card.index}
                    className='rounded-3xl border border-semi-color-border p-6 backdrop-blur'
                    style={{
                      backgroundColor: 'var(--semi-color-bg-0)',
                      boxShadow:
                        '0 12px 40px -24px rgba(var(--gm-brand-primary-rgb), 0.45)',
                    }}
                  >
                    <div className='mb-4 inline-flex rounded-full bg-semi-color-primary-light-default px-3 py-1 text-xs font-semibold text-semi-color-primary'>
                      {card.index}
                    </div>
                    <h3 className='text-lg font-semibold text-semi-color-text-0'>
                      {card.title}
                    </h3>
                    <p className='mt-3 text-sm leading-7 text-semi-color-text-1'>
                      {card.description}
                    </p>
                  </div>
                ))}
              </div>

              <div
                className='mt-6 rounded-[28px] border border-semi-color-border p-6 md:mt-8 md:p-7'
                style={{
                  background:
                    'linear-gradient(90deg, var(--semi-color-primary-light-default), var(--semi-color-tertiary-light-default))',
                }}
              >
                <div className='flex flex-col gap-6 md:flex-row md:items-center md:justify-between'>
                  <div className='max-w-xl'>
                    <Text className='!text-xl md:!text-2xl !font-semibold !text-semi-color-text-0'>
                      {quickStartTitle}
                    </Text>
                    <p className='mt-2 text-sm leading-7 text-semi-color-text-1 md:text-base'>
                      {quickStartDescription}
                    </p>
                  </div>

                  <div className='grid flex-1 grid-cols-1 gap-3 md:grid-cols-3'>
                    {quickSteps.map((step, index) => (
                      <div
                        key={step}
                        className='rounded-2xl px-4 py-4 shadow-sm backdrop-blur'
                        style={{ backgroundColor: 'var(--semi-color-bg-0)' }}
                      >
                        <div className='text-xs font-semibold uppercase tracking-[0.18em] text-semi-color-primary'>
                          Step {index + 1}
                        </div>
                        <div className='mt-2 text-sm font-medium leading-6 text-semi-color-text-0'>
                          {step}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div className='overflow-x-hidden w-full'>
          {homePageContent.startsWith('https://') ? (
            <iframe
              src={homePageContent}
              className='w-full h-screen border-none'
            />
          ) : (
            <div
              className='mt-[60px]'
              dangerouslySetInnerHTML={{ __html: homePageContent }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
