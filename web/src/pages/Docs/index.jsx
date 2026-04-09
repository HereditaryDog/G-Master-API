import React, {
  useContext,
  useDeferredValue,
  useMemo,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import { StatusContext } from '../../context/Status';

const NAV_SECTIONS = [
  { id: 'intro', label: '引言' },
  { id: 'debug', label: '在线调试说明' },
  { id: 'request', label: '发出请求' },
  { id: 'quickstart', label: 'API 快速开始' },
  { id: 'chat', label: '聊天(Chat)' },
  { id: 'responses', label: '聊天(Responses)' },
  { id: 'image', label: '绘画模型' },
  { id: 'video', label: '视频模型' },
  { id: 'system', label: '系统 API' },
  { id: 'python', label: 'Python 配置方式' },
  { id: 'plugin', label: '各种插件/软件使用教程' },
  { id: 'faq', label: '帮助中心' },
];

const DOC_GROUPS = [
  {
    id: 'chat',
    eyebrow: '聊天(Chat)',
    title: 'OpenAI / Claude / Gemini 常用对话入口',
    description:
      '覆盖最常见的对话、识图、函数调用和原生格式请求，优先从这里开始接入。',
    items: [
      {
        title: '创建聊天补全（流式）',
        type: 'POST',
        endpoint: '/v1/chat/completions',
        note: '最常用的 OpenAI 兼容聊天接口。',
      },
      {
        title: '创建聊天补全（非流）',
        type: 'POST',
        endpoint: '/v1/chat/completions',
        note: '适合普通问答和服务端一次性响应。',
      },
      {
        title: '创建聊天识图',
        type: 'POST',
        endpoint: '/v1/chat/completions',
        note: '支持图文混合消息体。',
      },
      {
        title: '官方 Function Calling 调用',
        type: 'POST',
        endpoint: '/v1/chat/completions',
        note: '支持 tools / tool_choice。',
      },
      {
        title: 'Claude 原生格式',
        type: 'POST',
        endpoint: '/v1/messages',
        note: '适合 Claude 原生 messages 协议。',
      },
      {
        title: 'Gemini 原生文本生成',
        type: 'POST',
        endpoint: '/v1beta/models/{model}:generateContent',
        note: 'Gemini 原生格式接口。',
      },
      {
        title: '列出模型',
        type: 'GET',
        endpoint: '/v1/models',
        note: '先确认当前令牌可用模型。',
      },
    ],
  },
  {
    id: 'responses',
    eyebrow: '聊天(Responses)',
    title: 'Responses API 与推理场景',
    description:
      '适合统一推理、工具调用、联网搜索和更偏 Agent 的调用方式。',
    items: [
      {
        title: '创建模型响应',
        type: 'POST',
        endpoint: '/v1/responses',
        note: '标准 Responses API 入口。',
      },
      {
        title: '创建模型响应（流式）',
        type: 'POST',
        endpoint: '/v1/responses',
        note: '支持 stream 返回。',
      },
      {
        title: '控制思考长度',
        type: 'POST',
        endpoint: '/v1/responses',
        note: '通过 reasoning.effort 控制推理强度。',
      },
      {
        title: '创建函数调用',
        type: 'POST',
        endpoint: '/v1/responses',
        note: '适合工具编排和多步执行。',
      },
      {
        title: '创建网络搜索',
        type: 'POST',
        endpoint: '/v1/responses',
        note: '适合联网检索场景。',
      },
    ],
  },
  {
    id: 'image',
    eyebrow: '绘画模型',
    title: '图片生成与编辑',
    description: '统一展示图像生成、编辑和兼容格式接口。',
    items: [
      {
        title: '创建 gpt-image-1',
        type: 'POST',
        endpoint: '/v1/images/generations',
        note: 'OpenAI 风格图像生成入口。',
      },
      {
        title: '编辑图片',
        type: 'POST',
        endpoint: '/v1/images/edits',
        note: '支持参考图和 prompt 编辑。',
      },
      {
        title: 'Gemini 图片生成',
        type: 'POST',
        endpoint: '/v1beta/models/{model}:generateContent',
        note: '适合 Gemini 原生图片能力。',
      },
      {
        title: 'Qwen 图片接口',
        type: 'POST',
        endpoint: '/jimeng/',
        note: '即梦 / 千问风格图片或视频任务入口。',
      },
    ],
  },
  {
    id: 'video',
    eyebrow: '视频模型',
    title: '统一视频与 Kling / 即梦接口',
    description: '统一视频创建、查询和下载入口，便于做任务型异步调用。',
    items: [
      {
        title: '创建视频',
        type: 'POST',
        endpoint: '/v1/video/generations',
        note: '统一视频生成入口。',
      },
      {
        title: '查询视频任务',
        type: 'GET',
        endpoint: '/v1/video/generations/{task_id}',
        note: '轮询任务状态。',
      },
      {
        title: '统一视频接口',
        type: 'POST',
        endpoint: '/v1/videos',
        note: '适配更多视频模型。',
      },
      {
        title: 'Kling 文生视频',
        type: 'POST',
        endpoint: '/kling/v1/videos/text2video',
        note: 'Kling 风格文本生视频。',
      },
      {
        title: 'Kling 图生视频',
        type: 'POST',
        endpoint: '/kling/v1/videos/image2video',
        note: 'Kling 风格图生视频。',
      },
      {
        title: '下载视频内容',
        type: 'GET',
        endpoint: '/v1/videos/{task_id}/content',
        note: '任务完成后下载二进制视频。',
      },
    ],
  },
  {
    id: 'system',
    eyebrow: '系统 API',
    title: '用户中心与令牌管理',
    description:
      '这部分更接近 ZEN-AI 文档里的“系统 API”，用于自助管理账号和令牌。',
    items: [
      {
        title: '获取系统状态',
        type: 'GET',
        endpoint: '/api/status',
        note: '查看站点状态、版本、文档地址和充值地址。',
      },
      {
        title: '获取令牌列表',
        type: 'GET',
        endpoint: '/api/token/',
        note: '用户维度查看已有令牌。',
      },
      {
        title: '新增令牌',
        type: 'POST',
        endpoint: '/api/token/',
        note: '创建新的业务令牌。',
      },
      {
        title: '修改令牌',
        type: 'PUT',
        endpoint: '/api/token/',
        note: '更新额度、状态、过期时间。',
      },
      {
        title: '删除令牌',
        type: 'DELETE',
        endpoint: '/api/token/{id}',
        note: '删除指定令牌。',
      },
      {
        title: '获取账号信息',
        type: 'GET',
        endpoint: '/api/user/self',
        note: '查看个人信息、配额和请求量。',
      },
      {
        title: '获取用户数据统计',
        type: 'GET',
        endpoint: '/api/data/self',
        note: '用于控制台仪表盘。',
      },
    ],
  },
  {
    id: 'python',
    eyebrow: 'Python 配置方式',
    title: 'Python / SDK 示例集合',
    description: '保留最常见的 SDK 与代码路径，方便复制即用。',
    items: [
      {
        title: 'Python 基础对话',
        type: 'SDK',
        endpoint: 'openai.OpenAI(base_url=/v1)',
        note: '最小对话调用方式。',
      },
      {
        title: 'Python 使用 Embeddings',
        type: 'SDK',
        endpoint: 'client.embeddings.create(...)',
        note: '用于向量化。',
      },
      {
        title: 'Python 图片生成',
        type: 'SDK',
        endpoint: 'client.images.generate(...)',
        note: '用于图片生成与编辑。',
      },
      {
        title: 'Python 流式输出',
        type: 'SDK',
        endpoint: 'stream=True',
        note: '适合边生成边消费。',
      },
      {
        title: 'Python 调用 Realtime',
        type: 'SDK',
        endpoint: 'Realtime / Audio',
        note: '适合语音和实时互动。',
      },
    ],
  },
  {
    id: 'plugin',
    eyebrow: '各种插件/软件使用教程',
    title: '客户端与工具接入',
    description:
      '把 ZEN-AI 文档里常见的工具入口整理成站内索引，方便后续继续拆成独立页。',
    items: [
      {
        title: 'Codex 配置教程',
        type: '教程',
        endpoint: 'OpenAI Compatible',
        note: '接入 Codex / Agent 工具。',
      },
      {
        title: 'Claude Code 配置教程',
        type: '教程',
        endpoint: 'OpenAI Compatible',
        note: '配置兼容基址与密钥。',
      },
      {
        title: 'Cherry Studio 配置教程',
        type: '教程',
        endpoint: 'Base URL / API Key',
        note: '适合桌面端统一调用。',
      },
      {
        title: 'Cursor / Cline / Aider',
        type: '教程',
        endpoint: 'OpenAI Compatible',
        note: '常见编码工具接入方式。',
      },
      {
        title: 'N8N / Dify 工作流',
        type: '教程',
        endpoint: 'OpenAI Compatible',
        note: '适合工作流平台接入。',
      },
      {
        title: 'ChatBox / LobeChat / NextChat',
        type: '教程',
        endpoint: 'OpenAI Compatible',
        note: '聊天客户端接入方式。',
      },
    ],
  },
];

const QUICK_STEPS = [
  {
    step: '1',
    title: '创建令牌',
    text: '先在控制台创建可用令牌，模型调用默认使用 Authorization: Bearer sk-your-token。',
  },
  {
    step: '2',
    title: '配置基址',
    text: 'OpenAI 兼容请求统一走 /v1，系统与用户接口统一走 /api。',
  },
  {
    step: '3',
    title: '发送请求',
    text: '先从 GET /v1/models 和 POST /v1/chat/completions 开始联调，确认模型权限和调用链路。',
  },
];

const DEBUG_STEPS = [
  {
    title: '设置环境变量',
    text: '调试模型接口时，只需要配置 api_key 和 base_url；调试用户接口时再补 access_token 与 new_api_user。',
  },
  {
    title: '切换到目标接口',
    text: '优先选择最常用的聊天、模型列表或系统状态接口，减少首次调试变量数量。',
  },
  {
    title: '发送并比对响应',
    text: '先看鉴权是否成功，再看模型名、额度、流式返回和错误结构是否符合预期。',
  },
];

const FAQ_ITEMS = [
  {
    question: 'Invalid authorization header',
    answer:
      '通常是 Bearer 前缀缺失、API Key 填错，或者把模型令牌拿去请求 /api 用户接口。',
  },
  {
    question: 'User id mismatch',
    answer:
      '说明访问 /api 用户接口时，Authorization 对应的用户和 New-Api-User 请求头不一致。',
  },
  {
    question: '为什么调试页请求到了 api.openai.com',
    answer:
      '说明客户端或调试工具没有改 Base URL，仍在使用官方默认地址，需要切到 G-Master API 的 /v1。',
  },
  {
    question: '如何确认当前网关版本',
    answer:
      '直接请求 GET /api/status，返回中的 data.version 就是当前线上版本。',
  },
];

const CODE_SNIPPETS = {
  curl: {
    label: 'cURL',
    code: (serverAddress) => `curl ${serverAddress}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk-your-token" \\
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {
        "role": "system",
        "content": "你是一个简洁的技术助手。"
      },
      {
        "role": "user",
        "content": "请介绍一下 G-Master API"
      }
    ],
    "stream": false
  }'`,
  },
  python: {
    label: 'Python',
    code: (serverAddress) => `from openai import OpenAI

client = OpenAI(
    api_key="sk-your-token",
    base_url="${serverAddress}/v1",
)

resp = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "user", "content": "请介绍一下 G-Master API"}
    ],
)

print(resp.choices[0].message.content)`,
  },
  node: {
    label: 'Node.js',
    code: (serverAddress) => `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "sk-your-token",
  baseURL: "${serverAddress}/v1",
});

const resp = await client.responses.create({
  model: "gpt-4.1-mini",
  input: "请介绍一下 G-Master API",
});

console.log(resp.output_text);`,
  },
};

const Docs = () => {
  const [statusState] = useContext(StatusContext);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const [activeSnippet, setActiveSnippet] = useState('curl');
  const [copied, setCopied] = useState('');

  const serverAddress =
    statusState?.status?.server_address || window.location.origin;
  const topUpLink = statusState?.status?.top_up_link || 'https://gmtoken.shop';
  const version = statusState?.status?.version || '';

  const summaryCards = useMemo(
    () => [
      {
        label: 'OpenAI 兼容基址',
        value: `${serverAddress}/v1`,
      },
      {
        label: '系统接口基址',
        value: `${serverAddress}/api`,
      },
      {
        label: '推荐起步接口',
        value: 'GET /v1/models',
      },
      {
        label: '当前文档版本',
        value: version || '未知',
      },
    ],
    [serverAddress, version],
  );

  const filteredGroups = useMemo(() => {
    if (!deferredSearch) {
      return DOC_GROUPS;
    }

    return DOC_GROUPS.map((group) => {
      const matchedItems = group.items.filter((item) => {
        const haystack = [
          group.title,
          group.description,
          item.title,
          item.endpoint,
          item.note,
          item.type,
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(deferredSearch);
      });

      return { ...group, items: matchedItems };
    }).filter((group) => group.items.length > 0);
  }, [deferredSearch]);

  const resultCount = useMemo(
    () =>
      filteredGroups.reduce((count, group) => count + group.items.length, 0),
    [filteredGroups],
  );

  const activeSnippetCode = CODE_SNIPPETS[activeSnippet].code(serverAddress);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeSnippetCode);
      setCopied(activeSnippet);
      window.setTimeout(() => setCopied(''), 1600);
    } catch (error) {
      console.error('copy failed', error);
    }
  };

  return (
    <div className='gm-docs-page'>
      <div className='gm-docs-bg' aria-hidden='true'>
        <span className='gm-docs-orb gm-docs-orb-blue'></span>
        <span className='gm-docs-orb gm-docs-orb-purple'></span>
        <span className='gm-docs-orb gm-docs-orb-cyan'></span>
      </div>

      <div className='gm-docs-shell'>
        <aside className='gm-docs-sidebar'>
          <div className='gm-docs-sidebar-card'>
            <div className='gm-docs-sidebar-eyebrow'>G-Master API Docs</div>
            <div className='gm-docs-sidebar-title'>文档导航</div>
            <div className='gm-docs-sidebar-links'>
              {NAV_SECTIONS.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className='gm-docs-sidebar-link'
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <div className='gm-docs-sidebar-card'>
            <div className='gm-docs-sidebar-title'>快捷入口</div>
            <div className='gm-docs-sidebar-actions'>
              <a
                href={`${serverAddress}/api/status`}
                target='_blank'
                rel='noopener noreferrer'
                className='gm-docs-action-link'
              >
                查看系统状态
              </a>
              <Link to='/console/token' className='gm-docs-action-link'>
                打开令牌管理
              </Link>
              <Link to='/pricing' className='gm-docs-action-link'>
                浏览模型广场
              </Link>
              <a
                href={topUpLink}
                target='_blank'
                rel='noopener noreferrer'
                className='gm-docs-action-link'
              >
                打开充值站
              </a>
            </div>
          </div>
        </aside>

        <main className='gm-docs-main'>
          <section id='intro' className='gm-docs-hero gm-docs-card'>
            <div className='gm-docs-hero-copy'>
              <div className='gm-docs-kicker'>ZEN-AI 风格文档首页</div>
              <h1 className='gm-docs-title'>G-Master API 接口文档</h1>
              <p className='gm-docs-description'>
                这不是简单入口页，而是按完整文档首页重组后的站内文档：
                现在包含快速开始、在线调试、接口分组、SDK 示例、系统 API 和帮助中心，
                用来承接你后续的 Apifox 文档体系。
              </p>

              <div className='gm-docs-hero-actions'>
                <a href='#quickstart' className='gm-docs-primary-btn'>
                  API 快速开始
                </a>
                <a href='#chat' className='gm-docs-secondary-btn'>
                  查看接口分组
                </a>
              </div>
            </div>

            <div className='gm-docs-hero-panel'>
              <div className='gm-docs-status-label'>当前版本</div>
              <div className='gm-docs-status-value'>{version || '未知'}</div>
              <div className='gm-docs-status-meta'>{serverAddress}</div>
            </div>
          </section>

          <section className='gm-docs-summary-grid'>
            {summaryCards.map((card) => (
              <article key={card.label} className='gm-docs-card gm-docs-summary-card'>
                <div className='gm-docs-summary-label'>{card.label}</div>
                <div className='gm-docs-summary-value'>{card.value}</div>
              </article>
            ))}
          </section>

          <section className='gm-docs-card gm-docs-search-card'>
            <div>
              <div className='gm-docs-block-title'>搜索文档内容</div>
              <div className='gm-docs-block-description'>
                支持按接口名、路径、模型类型、教程关键词筛选当前文档首页内容。
              </div>
            </div>
            <div className='gm-docs-search-box'>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder='搜索接口、模型、教程关键词，例如 chat / token / Claude / Cursor'
                className='gm-docs-search-input'
              />
              <div className='gm-docs-search-result'>
                {deferredSearch ? `命中 ${resultCount} 项` : '展示完整目录'}
              </div>
            </div>
          </section>

          <section id='debug' className='gm-docs-card'>
            <div className='gm-docs-section-head'>
              <div>
                <div className='gm-docs-block-kicker'>在线调试说明</div>
                <div className='gm-docs-block-title'>先配环境，再发请求</div>
              </div>
              <div className='gm-docs-tip-chip'>推荐先测 GET /v1/models</div>
            </div>
            <div className='gm-docs-step-grid'>
              {DEBUG_STEPS.map((item, index) => (
                <article key={item.title} className='gm-docs-step-card'>
                  <div className='gm-docs-step-index'>{index + 1}</div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section id='request' className='gm-docs-card'>
            <div className='gm-docs-section-head'>
              <div>
                <div className='gm-docs-block-kicker'>发出请求</div>
                <div className='gm-docs-block-title'>最小可用请求模板</div>
              </div>
              <button className='gm-docs-copy-btn' onClick={handleCopy}>
                {copied === activeSnippet ? '已复制' : '复制代码'}
              </button>
            </div>

            <div className='gm-docs-code-tabs'>
              {Object.entries(CODE_SNIPPETS).map(([key, item]) => (
                <button
                  key={key}
                  className={`gm-docs-code-tab ${activeSnippet === key ? 'is-active' : ''}`}
                  onClick={() => setActiveSnippet(key)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <pre className='gm-docs-code-block'>
              <code>{activeSnippetCode}</code>
            </pre>
          </section>

          <section id='quickstart' className='gm-docs-card'>
            <div className='gm-docs-section-head'>
              <div>
                <div className='gm-docs-block-kicker'>API 快速开始指南</div>
                <div className='gm-docs-block-title'>3 步完成最小联调</div>
              </div>
            </div>
            <div className='gm-docs-step-grid gm-docs-step-grid-compact'>
              {QUICK_STEPS.map((item) => (
                <article key={item.step} className='gm-docs-step-card'>
                  <div className='gm-docs-step-index'>{item.step}</div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </section>

          {filteredGroups.map((group) => (
            <section key={group.id} id={group.id} className='gm-docs-card gm-docs-group-section'>
              <div className='gm-docs-section-head'>
                <div>
                  <div className='gm-docs-block-kicker'>{group.eyebrow}</div>
                  <div className='gm-docs-block-title'>{group.title}</div>
                  <div className='gm-docs-block-description'>
                    {group.description}
                  </div>
                </div>
                <div className='gm-docs-count-chip'>{group.items.length} 条目</div>
              </div>

              <div className='gm-docs-catalog-grid'>
                {group.items.map((item) => (
                  <article key={`${group.id}-${item.title}`} className='gm-docs-catalog-card'>
                    <div className='gm-docs-catalog-head'>
                      <span className='gm-docs-method-pill'>{item.type}</span>
                      <span className='gm-docs-endpoint'>{item.endpoint}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.note}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}

          <section id='faq' className='gm-docs-card'>
            <div className='gm-docs-section-head'>
              <div>
                <div className='gm-docs-block-kicker'>帮助中心</div>
                <div className='gm-docs-block-title'>FAQ 与排错入口</div>
              </div>
            </div>

            <div className='gm-docs-faq-grid'>
              {FAQ_ITEMS.map((item) => (
                <article key={item.question} className='gm-docs-faq-card'>
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Docs;
