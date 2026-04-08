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

import React, { useContext, useEffect, useMemo, useState } from 'react';
import { API, showError, getSystemName } from '../../helpers';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { StatusContext } from '../../context/Status';
import { useActualTheme } from '../../context/Theme';
import { marked } from 'marked';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import NoticeModal from '../../components/layout/NoticeModal';

const Home = () => {
  const { i18n } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const actualTheme = useActualTheme();
  const [homePageContentLoaded, setHomePageContentLoaded] = useState(false);
  const [homePageContent, setHomePageContent] = useState('');
  const [noticeVisible, setNoticeVisible] = useState(false);
  const isMobile = useIsMobile();
  const docsLink = statusState?.status?.docs_link || '';
  const topUpLink = statusState?.status?.top_up_link || '';
  const serverAddress =
    statusState?.status?.server_address || `${window.location.origin}`;
  const runtimeVersion =
    typeof statusState?.status?.version === 'string'
      ? statusState.status.version.trim()
      : '';
  const buildVersion =
    typeof import.meta.env.VITE_REACT_APP_VERSION === 'string'
      ? import.meta.env.VITE_REACT_APP_VERSION.trim()
      : '';
  const displayVersion = runtimeVersion || buildVersion;
  const isChinese = i18n.language.startsWith('zh');
  const systemName = getSystemName();
  const repoUrl = 'https://github.com/yangjunyu/G-Master-API';
  const ackUrl = `${repoUrl}/blob/main/ACKNOWLEDGMENTS.md`;
  const licenseUrl = `${repoUrl}/blob/main/LICENSE`;
  const pricingUrl = '/pricing';
  const statusUrl = `${window.location.origin}/api/status`;
  const consoleUrl = '/console';

  const displayName = useMemo(() => {
    if (systemName && systemName.trim()) {
      return systemName.trim();
    }
    return 'G-Master API';
  }, [systemName]);
  const heroStatusText = isChinese
    ? '仅需 1 行接入，开启智能化之旅，让 AI 调用更简单高效！'
    : 'Just one line to integrate and make AI access simpler and more efficient.';

  const featureCards = isChinese
    ? [
        {
          title: '超低成本',
          description:
            '统一接入多家模型与渠道池，减少重复采购和切换开销，让 AI 应用更经济实惠。',
          icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
              <path d='M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83' />
            </svg>
          ),
        },
        {
          title: '稳定可靠',
          description:
            '企业级服务架构，多节点负载均衡与渠道容灾切换，确保 API 调用稳定流畅。',
          icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
              <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
            </svg>
          ),
        },
        {
          title: '即时接入',
          description:
            '兼容 OpenAI 协议，最少改动即可迁移现有项目，几分钟内完成接入和验证。',
          icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
              <polyline points='23 4 23 10 17 10'></polyline>
              <path d='M21 14V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2H9'></path>
              <line x1='17' y1='10' x2='12' y2='15'></line>
              <line x1='12' y1='15' x2='17' y2='20'></line>
            </svg>
          ),
        },
      ]
    : [
        {
          title: 'Lower cost',
          description:
            'Aggregate vendors and channel pools to reduce duplicated procurement and switching costs.',
          icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
              <path d='M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83' />
            </svg>
          ),
        },
        {
          title: 'Reliable',
          description:
            'Enterprise-ready routing with multi-node balancing and failover keeps API traffic smooth.',
          icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
              <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
            </svg>
          ),
        },
        {
          title: 'Instant access',
          description:
            'OpenAI-compatible and ready to migrate existing apps with only minimal code changes.',
          icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
              <polyline points='23 4 23 10 17 10'></polyline>
              <path d='M21 14V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2H9'></path>
              <line x1='17' y1='10' x2='12' y2='15'></line>
              <line x1='12' y1='15' x2='17' y2='20'></line>
            </svg>
          ),
        },
      ];

  const dashboardBullets = isChinese
    ? [
        '实时查看 API 调用次数与用量统计',
        '精准的成本分析与预算控制',
        '多维度使用趋势可视化图表',
        '自定义时间段数据导出与分析',
        '异常使用监控与自动预警',
      ]
    : [
        'Track request volume and usage in real time',
        'Analyze costs precisely and control budgets',
        'Visualize usage trends across multiple dimensions',
        'Export and analyze custom time ranges',
        'Monitor anomalies and trigger alerts',
      ];

  const keyBullets = isChinese
    ? [
        '创建多个 API 密钥，分项目管理',
        '为每个密钥设置独立配额限制',
        '详细的使用统计与成本分析',
        '一键启用 / 禁用 / 重置管理',
        '密钥权限精细化控制',
      ]
    : [
        'Create multiple API keys and manage by project',
        'Set independent quota limits for each key',
        'Review detailed usage and cost analytics',
        'Enable, disable, or reset with one click',
        'Apply fine-grained key permissions',
      ];

  const frameworkLogos = [
    'ChatGPT',
    'LangChain',
    'Node.js SDK',
    'Python SDK',
    'Claude API',
    'Hugging Face',
  ];

  const modelCards = isChinese
    ? [
        {
          title: '推理模型 系列',
          description:
            '包括 deepseek-r1、o1、o3 等高性能大语言推理模型，适用于复杂理解与创作任务。',
          icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
              <path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'></path>
              <polyline points='3.27 6.96 12 12.01 20.73 6.96'></polyline>
              <line x1='12' y1='22.08' x2='12' y2='12'></line>
            </svg>
          ),
        },
        {
          title: 'GPT-4o 系列',
          description: '高性价比的 GPT-4o 系列模型，适合日常对话与内容创作场景。',
          icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
              <circle cx='12' cy='12' r='10'></circle>
              <path d='M8 14s1.5 2 4 2 4-2 4-2'></path>
              <line x1='9' y1='9' x2='9.01' y2='9'></line>
              <line x1='15' y1='9' x2='15.01' y2='9'></line>
            </svg>
          ),
        },
        {
          title: 'Claude 系列',
          description: '包括 Claude 3.7 / Sonnet / Haiku 等模型，提供出色的理解能力与上下文处理。',
          icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
              <rect x='2' y='3' width='20' height='14' rx='2' ry='2'></rect>
              <line x1='8' y1='21' x2='16' y2='21'></line>
              <line x1='12' y1='17' x2='12' y2='21'></line>
            </svg>
          ),
        },
        {
          title: '绘图 系列',
          description: '支持 DALL-E 3、flux、midjourney 等图像生成模型，将文字描述转化为精美图像。',
          icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
              <path d='M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z'></path>
              <polyline points='14 2 14 8 20 8'></polyline>
            </svg>
          ),
        },
        {
          title: 'Embedding 模型',
          description: '提供多种嵌入模型，用于文本向量化、相似度计算和语义搜索。',
          icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
              <polygon points='12 2 2 7 12 12 22 7 12 2'></polygon>
              <polyline points='2 17 12 22 22 17'></polyline>
              <polyline points='2 12 12 17 22 12'></polyline>
            </svg>
          ),
        },
        {
          title: '更多模型',
          description: '持续引入国内外最新 AI 模型，覆盖文本、图像、音频等多领域应用需求。',
          icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
              <path d='M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z'></path>
              <polyline points='17 21 17 13 7 13 7 21'></polyline>
              <polyline points='7 3 7 8 15 8'></polyline>
            </svg>
          ),
        },
      ]
    : [
        {
          title: 'Reasoning models',
          description:
            'Includes deepseek-r1, o1, o3, and other high-performance reasoning models for complex tasks.',
          icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
              <path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'></path>
              <polyline points='3.27 6.96 12 12.01 20.73 6.96'></polyline>
              <line x1='12' y1='22.08' x2='12' y2='12'></line>
            </svg>
          ),
        },
        {
          title: 'GPT-4o family',
          description: 'A high-value GPT-4o lineup for everyday chat, writing, and multimodal tasks.',
          icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
              <circle cx='12' cy='12' r='10'></circle>
              <path d='M8 14s1.5 2 4 2 4-2 4-2'></path>
              <line x1='9' y1='9' x2='9.01' y2='9'></line>
              <line x1='15' y1='9' x2='15.01' y2='9'></line>
            </svg>
          ),
        },
        {
          title: 'Claude family',
          description: 'Claude 3.7, Sonnet, and Haiku with strong comprehension and long-context handling.',
          icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
              <rect x='2' y='3' width='20' height='14' rx='2' ry='2'></rect>
              <line x1='8' y1='21' x2='16' y2='21'></line>
              <line x1='12' y1='17' x2='12' y2='21'></line>
            </svg>
          ),
        },
        {
          title: 'Image generation',
          description: 'Supports DALL-E 3, flux, midjourney, and other image generation workflows.',
          icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
              <path d='M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z'></path>
              <polyline points='14 2 14 8 20 8'></polyline>
            </svg>
          ),
        },
        {
          title: 'Embedding models',
          description: 'Use embeddings for vectorization, similarity search, and semantic retrieval.',
          icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
              <polygon points='12 2 2 7 12 12 22 7 12 2'></polygon>
              <polyline points='2 17 12 22 22 17'></polyline>
              <polyline points='2 12 12 17 22 12'></polyline>
            </svg>
          ),
        },
        {
          title: 'More models',
          description: 'Continuously add new global AI models across text, image, and audio scenarios.',
          icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
              <path d='M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z'></path>
              <polyline points='17 21 17 13 7 13 7 21'></polyline>
              <polyline points='7 3 7 8 15 8'></polyline>
            </svg>
          ),
        },
      ];

  const steps = isChinese
    ? [
        {
          title: '简单注册',
          description: '一分钟完成账户注册',
          extra: '无需复杂认证',
        },
        {
          title: '快速接入',
          description: '支持标准 OpenAI 协议',
          extra: '即改即用无等待',
        },
        {
          title: '创建密钥',
          description: '一键生成 API 密钥',
          extra: '立即开始调用服务',
        },
      ]
    : [
        {
          title: 'Quick signup',
          description: 'Create your account in one minute',
          extra: 'No complex onboarding required',
        },
        {
          title: 'Fast integration',
          description: 'Use the standard OpenAI protocol',
          extra: 'Switch and test right away',
        },
        {
          title: 'Create keys',
          description: 'Generate an API key in one click',
          extra: 'Start calling the service immediately',
        },
      ];

  const displayHomePageContent = async () => {
    setHomePageContent(localStorage.getItem('home_page_content') || '');
    try {
      const res = await API.get('/api/home_page_content');
      const { success, message, data } = res.data;
      if (success) {
        let content = data;
        if (!data.startsWith('https://')) {
          content = marked.parse(data);
        }
        setHomePageContent(content);
        localStorage.setItem('home_page_content', content);

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
    } catch (error) {
      showError(error);
      setHomePageContent('加载首页内容失败...');
    }
    setHomePageContentLoaded(true);
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
    if (!homePageContentLoaded || homePageContent !== '') {
      return undefined;
    }

    const nodes = document.querySelectorAll('.gm-zen-section');
    if (!nodes.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [homePageContentLoaded, homePageContent]);

  return (
    <div className='w-full overflow-x-hidden'>
      <NoticeModal
        visible={noticeVisible}
        onClose={() => setNoticeVisible(false)}
        isMobile={isMobile}
      />
      {homePageContentLoaded && homePageContent === '' ? (
        <div className='gm-zen-home'>
          <div className='gm-zen-shapes' aria-hidden='true'>
            <div className='gm-zen-shape'></div>
            <div className='gm-zen-shape'></div>
            <div className='gm-zen-shape'></div>
            <div className='gm-zen-shape'></div>
          </div>

          <div className='gm-zen-hero'>
            <div className='gm-zen-content'>
              <h2 className='gm-zen-subtitle'>
                {isChinese
                  ? '您的AI服务专家，多模型接入 · 稳定可靠 · 超低成本'
                  : 'Your AI service expert for multi-model access, stability, and lower cost'}
              </h2>
              <h1 className='gm-zen-logo' data-title={displayName}>
                {displayName}
              </h1>
              <div className='gm-zen-status-shell'>
                <p className='gm-zen-status' data-text={heroStatusText}>
                  <span className='gm-zen-status-text'>{heroStatusText}</span>
                </p>
              </div>
              <div className='gm-zen-buttons'>
                <Link to={consoleUrl} className='gm-zen-btn gm-zen-btn-primary'>
                  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
                    <path d='M5 12h14M12 5l7 7-7 7'></path>
                  </svg>
                  <strong>{isChinese ? '开始使用' : 'Get Started'}</strong>
                </Link>
                <Link to={pricingUrl} className='gm-zen-btn gm-zen-btn-secondary'>
                  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
                    <rect x='2' y='3' width='20' height='14' rx='2' ry='2'></rect>
                    <line x1='8' y1='21' x2='16' y2='21'></line>
                    <line x1='12' y1='17' x2='12' y2='21'></line>
                  </svg>
                  <strong>{isChinese ? '模型价格' : 'Pricing'}</strong>
                </Link>
                <a
                  href={statusUrl}
                  className='gm-zen-btn gm-zen-btn-secondary'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
                    <path d='M22 12h-4l-3 9L9 3l-3 9H2'></path>
                  </svg>
                  <strong>{isChinese ? '服务状态' : 'Service Status'}</strong>
                </a>
              </div>
            </div>
          </div>

          <div className='gm-zen-divider'></div>

          <div className='gm-zen-sections'>
            <section className='gm-zen-section gm-zen-visible-first'>
              <h2>{isChinese ? `为什么选择 ${displayName}` : `Why ${displayName}`}</h2>
              <div className='gm-zen-features-grid'>
                {featureCards.map((item) => (
                  <div key={item.title} className='gm-zen-feature-card'>
                    <div className='gm-zen-feature-icon'>{item.icon}</div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className='gm-zen-section'>
              <h2>{isChinese ? '实时数据分析' : 'Real-time Analytics'}</h2>
              <div className='gm-zen-dashboard-container'>
                <div className='gm-zen-dashboard-mockup'>
                  <img
                    src='/homepage/zen-kanban.png'
                    alt={isChinese ? `${displayName}数据分析仪表盘` : `${displayName} analytics dashboard`}
                    className='gm-zen-dashboard-image'
                  />
                </div>
                <div className='gm-zen-dashboard-features'>
                  <ul>
                    {dashboardBullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section className='gm-zen-section'>
              <h2>{isChinese ? '灵活的密钥管理' : 'Flexible Key Management'}</h2>
              <div className='gm-zen-keys-management'>
                <div className='gm-zen-keys-info'>
                  <h3>{isChinese ? '多密钥智能管理' : 'Smart Multi-key Management'}</h3>
                  <p>
                    {isChinese
                      ? '为不同项目和团队创建独立密钥，实现更精细的权限控制与用量追踪，让 API 调用管理更加安全高效。'
                      : 'Create independent keys for different projects and teams with finer permission control and usage tracking.'}
                  </p>
                  <ul>
                    {keyBullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className='gm-zen-keys-preview'>
                  <img
                    src='/homepage/zen-token.png'
                    alt={isChinese ? `${displayName}密钥管理界面` : `${displayName} token management`}
                    className='gm-zen-keys-image'
                  />
                </div>
              </div>
            </section>

            <section className='gm-zen-section'>
              <h2>{isChinese ? '完整的 OpenAI 协议兼容' : 'Complete OpenAI Compatibility'}</h2>
              <div className='gm-zen-compatibility-content'>
                <div className='gm-zen-supported-frameworks'>
                  <h3>{isChinese ? '支持框架与工具' : 'Supported Frameworks & Tools'}</h3>
                  <p>
                    {isChinese
                      ? '无缝集成各种主流框架和工具，零代码修改即可迁移现有项目，让开发体验更加流畅。'
                      : 'Seamlessly integrate mainstream frameworks and tools so existing projects can migrate with near-zero code changes.'}
                  </p>
                  <div className='gm-zen-framework-logos'>
                    {frameworkLogos.map((item) => (
                      <div key={item} className='gm-zen-logo-placeholder'>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div className='gm-zen-code-example'>
                  <pre>
                    <code>{`// Node.js 接入示例
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: "sk-xxxxxxxxxxxxx", // 您的${displayName}密钥
  basePath: "${serverAddress}/v1"
});

const openai = new OpenAIApi(configuration);

// 创建聊天请求
const response = await openai.createChatCompletion({
  model: "gpt-3.5-turbo",
  messages: [
    { role: "system", content: "你是一个智能助手" },
    { role: "user", content: "你好，请介绍一下自己" }
  ]
});`}</code>
                  </pre>
                </div>
              </div>
            </section>

            <section className='gm-zen-section'>
              <h2>{isChinese ? '丰富的模型支持' : 'Broad Model Support'}</h2>
              <div className='gm-zen-features-grid'>
                {modelCards.map((item) => (
                  <div key={item.title} className='gm-zen-feature-card'>
                    <div className='gm-zen-feature-icon'>{item.icon}</div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className='gm-zen-section'>
              <h2>{isChinese ? '立即开始您的AI之旅' : 'Start Your AI Journey'}</h2>
              <div className='gm-zen-steps-container'>
                {steps.map((item, index) => (
                  <div key={item.title} className='gm-zen-step'>
                    <div className='gm-zen-step-number'>{index + 1}</div>
                    <h3>{item.title}</h3>
                    <p>
                      {item.description}
                      <br />
                      {item.extra}
                    </p>
                  </div>
                ))}
              </div>
              <div className='gm-zen-cta-button'>
                <Link to={consoleUrl} className='gm-zen-btn gm-zen-btn-primary'>
                  {isChinese ? '立即开始体验' : 'Start Now'}
                  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
                    <path d='M5 12h14M12 5l7 7-7 7'></path>
                  </svg>
                </Link>
              </div>
            </section>

            <section className='gm-zen-section gm-zen-home-footer-card'>
              <p className='gm-zen-home-footer-title'>
                © 2023-2026 {displayName}. {isChinese ? '保留所有权利' : 'All rights reserved'}
              </p>
              <p className='gm-zen-home-footer-links'>
                <a href={repoUrl} target='_blank' rel='noopener noreferrer'>
                  {isChinese ? '项目仓库' : 'Repository'}
                </a>
                <span>|</span>
                <a href={licenseUrl} target='_blank' rel='noopener noreferrer'>
                  AGPL-3.0
                </a>
                <span>|</span>
                <a href={ackUrl} target='_blank' rel='noopener noreferrer'>
                  {isChinese ? '上游致谢' : 'Acknowledgments'}
                </a>
              </p>
              <div className='gm-zen-contact-info'>
                <div className='gm-zen-contact-item'>
                  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                    <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'></path>
                    <circle cx='9' cy='7' r='4'></circle>
                    <path d='M23 21v-2a4 4 0 0 0-3-3.87'></path>
                    <path d='M16 3.13a4 4 0 0 1 0 7.75'></path>
                  </svg>
                  <span>
                    GitHub:
                    <a href={repoUrl} target='_blank' rel='noopener noreferrer'>
                      G-Master API
                    </a>
                  </span>
                </div>
                <div className='gm-zen-contact-item'>
                  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                    <path d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z'></path>
                    <polyline points='22,6 12,13 2,6'></polyline>
                  </svg>
                  <span>
                    Docs:
                    <a
                      href={docsLink || repoUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      {docsLink || repoUrl}
                    </a>
                  </span>
                </div>
                <div className='gm-zen-contact-item'>
                  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                    <path d='M12 2 2 7l10 5 10-5-10-5Z'></path>
                    <path d='M2 17l10 5 10-5'></path>
                    <path d='M2 12l10 5 10-5'></path>
                  </svg>
                  <span>
                    API:
                    <a
                      href={`${serverAddress}/v1`}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      {serverAddress}/v1
                    </a>
                  </span>
                </div>
                <div className='gm-zen-contact-item'>
                  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                    <path d='M12 20V10'></path>
                    <path d='m18 20-6-6-6 6'></path>
                    <path d='M6 4h12'></path>
                  </svg>
                  <span>
                    {isChinese ? '当前版本' : 'Version'}:
                    <a
                      href={topUpLink || repoUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      {displayVersion || 'latest'}
                    </a>
                  </span>
                </div>
              </div>
            </section>
          </div>
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
