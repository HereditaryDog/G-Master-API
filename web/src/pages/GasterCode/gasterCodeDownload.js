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

export const GASTER_CODE_REPOSITORY_URL =
  'https://github.com/HereditaryDog/gaster-code-releases';

export const GASTER_CODE_DOWNLOAD_URL = `${GASTER_CODE_REPOSITORY_URL}/releases/latest`;

export const GASTER_CODE_RELEASE_VERSION = 'v1.1.3';

export const GASTER_CODE_RELEASE_DATE = '2026-06-08';

export const GASTER_CODE_RELEASE_URL = `${GASTER_CODE_REPOSITORY_URL}/releases/tag/${GASTER_CODE_RELEASE_VERSION}`;

const GASTER_CODE_RELEASE_DOWNLOAD_BASE = `${GASTER_CODE_REPOSITORY_URL}/releases/download/${GASTER_CODE_RELEASE_VERSION}`;

export const GASTER_CODE_PAGE_PATH = '/gaster-code';

export const GASTER_CODE_RELEASE_ASSETS = {
  macDmg: `${GASTER_CODE_RELEASE_DOWNLOAD_BASE}/Gaster-Code-1.1.3-mac-arm64.dmg`,
  macZip: `${GASTER_CODE_RELEASE_DOWNLOAD_BASE}/Gaster-Code-1.1.3-mac-arm64.zip`,
  windowsExe: `${GASTER_CODE_RELEASE_DOWNLOAD_BASE}/Gaster-Code-1.1.3-win-x64.exe`,
  latestMac: `${GASTER_CODE_RELEASE_DOWNLOAD_BASE}/latest-mac.yml`,
  latestWindows: `${GASTER_CODE_RELEASE_DOWNLOAD_BASE}/latest.yml`,
  macUnsignedGuide: `${GASTER_CODE_RELEASE_DOWNLOAD_BASE}/install-macos-unsigned.sh`,
};

export const GASTER_CODE_DOWNLOAD_CONTENT = {
  zh: {
    title: '下载 Gaster Code 桌面端',
    description:
      '连接 G-Master API，在本地完成项目理解、代码编辑、终端验证和桌面端工作流。',
    primaryAction: '下载最新版',
    repositoryNote: '公开 release-only 下载仓库',
    platforms: ['macOS Apple Silicon', 'Windows x64'],
    secondaryAssets: ['macOS updater ZIP', 'latest-mac.yml', 'latest.yml'],
  },
  en: {
    title: 'Download Gaster Code Desktop',
    description:
      'Connect G-Master API and complete project understanding, code editing, terminal verification, and desktop workflows locally.',
    primaryAction: 'Download Latest',
    repositoryNote: 'Public release-only download repository',
    platforms: ['macOS Apple Silicon', 'Windows x64'],
    secondaryAssets: ['macOS updater ZIP', 'latest-mac.yml', 'latest.yml'],
  },
};

export const GASTER_CODE_PAGE_CONTENT = {
  zh: {
    release: {
      version: GASTER_CODE_RELEASE_VERSION,
      date: GASTER_CODE_RELEASE_DATE,
      line: `最新版 ${GASTER_CODE_RELEASE_VERSION} · ${GASTER_CODE_RELEASE_DATE} 已发布`,
      repositoryLine: '公开 release-only 仓库提供安装资产',
    },
    hero: {
      title: 'Gaster Code',
      description:
        '一座运行在本地项目旁边的 AI 开发控制台。把上下文、代码改动、终端验证和 G-Master API 模型收束到同一个桌面工作区。',
      primaryAction: '下载最新版',
      secondaryAction: '查看公开仓库',
      fineprint:
        '当前 macOS 与 Windows 安装器为公开发布资产；源码仓库仍保持私有。若签名或公证密钥缺失，安装器会按未签名状态发布，下载页会清楚说明。',
    },
    preview: {
      windowTitle: 'Gaster Code · local workspace',
      status: 'G-Master API connected',
      project: 'G-Master API / site',
      projectMeta: 'selected directory · local files only',
      modelMeta: 'model: gm-coder · stream:on',
      sessions: [
        { title: 'gmaster-api', meta: '/gaster-code page', active: true },
        { title: 'desktop release', meta: 'v1.1.3 notes' },
        { title: 'public assets', meta: 'macOS / Windows' },
      ],
      tools: [
        { title: 'Files', meta: 'scoped edits' },
        { title: 'Terminal', meta: 'local checks' },
      ],
      messages: [
        {
          role: 'user',
          text: '重做 /gaster-code 页面，保留 release-only 仓库事实。',
        },
        {
          text: '已读取项目上下文。计划更新页面结构、下载区与未签名安装说明，然后运行静态检查。',
        },
        {
          text: '将 CSS 限定在 .gm-gaster-code-page，方便迁入 React/Vite。',
        },
      ],
      terminalLines: [
        '$ bun run build',
        'vite building production bundle...',
        'scoped CSS checked',
        'release links preserved',
        'unsigned installer copy visible',
      ],
    },
    product: {
      kicker: '桌面工作台',
      title: '一个本地控制台。项目、对话、终端，都在现场。',
      description:
        'Gaster Code 不是公开源码编辑器，也不是云端 IDE。它是贴在项目目录旁边的桌面端，让模型响应、文件变更和命令回读都留在开发现场。',
      heading: '不是聊天窗口外挂，而是面向真实项目的任务舱。',
      body: '侧栏保留多会话上下文，主区域承载任务说明与模型输出，底部终端用于执行用户触发的本地命令。公开页面只展示产品与安装资产，不暗示源码开放。',
      proofRows: [
        { label: 'Context', text: '仅在用户选择的目录内读取与修改文件。' },
        { label: 'Model', text: '请求通过配置的 G-Master API 模型通道。' },
        {
          label: 'Release',
          text: '安装器与 updater 元数据来自公开 release-only 仓库。',
        },
      ],
    },
    capabilitiesIntro: {
      kicker: '能力叙事',
      title: '把 AI 编码助手拉回本地执行现场。',
      description:
        '不是图标列表，而是一条真实的开发路径：理解项目、改动代码、跑验证，再把模型、多模态和远程入口收进同一个桌面端。',
    },
    capabilities: [
      {
        type: 'context',
        title: '本地项目上下文，先由你选择。',
        description:
          'Gaster Code 围绕选中的项目目录建立上下文。它可以读代码、定位文件、理解已有脚本与文档，但不会把“全盘读取”当作默认假设。',
        rows: [
          {
            index: '01',
            label: 'apps/web/src/routes/gaster-code.tsx',
            status: 'open',
          },
          {
            index: '02',
            label: 'components/download-panel.tsx',
            status: 'edit',
          },
          { index: '03', label: 'release-notes/v1.1.3.md', status: 'read' },
          { index: '04', label: 'package.json · scripts', status: 'verify' },
        ],
      },
      {
        type: 'verify',
        title: '代码编辑、调试与终端验证连在一起。',
        description:
          '从“改这个页面”到“跑一遍检查”，Gaster Code 把文件编辑、命令执行、日志回读放在一条会话里。用户动作决定命令何时运行，结果再回到同一个上下文。',
        lines: [
          '$ bun run lint',
          'scoped selectors: .gm-gaster-code-page',
          'release copy: v1.1.3 / unsigned status',
          '$ bun test gasterCodeDownload',
          'macOS DMG visible',
          'Windows EXE visible',
          'No source repository link exposed as public source.',
        ],
      },
      {
        type: 'entry',
        title: 'G-Master API、绘图、多模态与 IM 入口，按任务进入。',
        description:
          '模型能力来自已配置的 G-Master API。需要时，绘图和多模态输入可以作为任务素材；IM 远程入口可以触发任务，但最终仍回到本地桌面端审核与执行。',
        rows: [
          {
            title: 'G-Master API 模型',
            text: '统一承载代码理解、变更建议、解释与多轮任务上下文。',
          },
          {
            title: '绘图 / 多模态入口',
            text: '截图、草图、产品视觉可以进入任务描述，而不是停留在聊天附件里。',
          },
          {
            title: 'IM 远程入口',
            text: '外部消息可发起任务，桌面端继续负责本地文件与命令边界。',
          },
        ],
      },
    ],
    workflowIntro: {
      kicker: '工作流',
      title: '从打开项目，到一次可验证的提交前状态。',
      description:
        '核心节奏很简单：本地、可见、可检查。每一步都应该能回到文件、终端输出和用户确认。',
    },
    steps: [
      {
        title: '打开项目',
        description: '选择一个本地目录，让会话只围绕这组文件建立上下文。',
      },
      {
        title: '描述任务',
        description: '用自然语言说明要改的页面、接口、脚本或错误现象。',
      },
      {
        title: '编辑文件',
        description: '在桌面端查看改动范围，让模型输出落到具体文件里。',
      },
      {
        title: '运行验证',
        description: '按用户动作执行本地命令，回读日志并继续修正。',
      },
      {
        title: 'IM 触发',
        description: '需要远程入口时，由 IM 发起任务，桌面端保留审核边界。',
      },
    ],
    download: {
      kicker: '下载',
      title: `最新版 ${GASTER_CODE_RELEASE_VERSION}。公开资产，私有源码。`,
      description:
        'Gaster Code 的公开仓库只用于发布安装器、ZIP 更新包和 updater 元数据。它不是源码仓库，也不暴露私有实现。',
      repositoryLabel: 'Release-only repo',
      repositoryText: 'HereditaryDog/gaster-code-releases',
      secondaryTitle: '自动更新资产',
      secondaryDescription:
        '自动更新读取公开 release 元数据。ZIP 用于 macOS updater，YAML 文件用于更新检查，脚本用于未签名 macOS 安装说明。',
    },
    packages: [
      {
        system: 'macOS Apple Silicon',
        file: 'Gaster-Code-1.1.3-mac-arm64.dmg',
        device: 'M1、M2、M3、M4 等 Apple 芯片 Mac',
        note: '未签名 / 未公证提示',
        action: '下载 DMG',
        url: GASTER_CODE_RELEASE_ASSETS.macDmg,
      },
      {
        system: 'Windows x64',
        file: 'Gaster-Code-1.1.3-win-x64.exe',
        device: '64 位 Windows 桌面环境',
        note: '未签名安装器提示',
        action: '下载 EXE',
        url: GASTER_CODE_RELEASE_ASSETS.windowsExe,
      },
    ],
    secondaryAssets: [
      {
        label: 'Gaster-Code-1.1.3-mac-arm64.zip',
        url: GASTER_CODE_RELEASE_ASSETS.macZip,
      },
      { label: 'latest-mac.yml', url: GASTER_CODE_RELEASE_ASSETS.latestMac },
      { label: 'latest.yml', url: GASTER_CODE_RELEASE_ASSETS.latestWindows },
      {
        label: 'install-macos-unsigned.sh',
        url: GASTER_CODE_RELEASE_ASSETS.macUnsignedGuide,
      },
    ],
    privacy: {
      kicker: '边界',
      title: '本地工作，就应该把边界说清楚。',
      description:
        'Gaster Code 的强项是贴近本地开发现场。越贴近文件和命令，越需要把访问、执行、模型请求和更新来源说明白。',
      items: [
        {
          title: '选中的目录',
          description:
            '桌面端围绕用户选择的本地项目目录工作，不把全盘文件访问包装成默认能力。',
        },
        {
          title: '用户动作触发',
          description:
            '终端命令和文件改动应在可见会话中执行，关键动作仍由用户决定。',
        },
        {
          title: 'G-Master API 请求',
          description:
            '模型请求通过已配置的 G-Master API 服务发送，沿用现有 provider 与模型策略。',
        },
        {
          title: '公开更新资产',
          description:
            'Updater 只读取公开 release-only 仓库中的安装资产与元数据，不把源码仓库开放给公众。',
        },
      ],
    },
    faqs: [
      {
        question: '公开仓库里能看到源码吗？',
        answer:
          '不能。公开仓库是 release-only 仓库，用于承载安装器、ZIP 更新包、更新元数据和安装说明。Gaster Code 的源码仓库仍保持私有。',
      },
      {
        question: '应该下载 DMG 还是 ZIP？',
        answer:
          '普通用户下载 DMG。macOS ZIP 是自动更新链路使用的资产，latest-mac.yml 和 latest.yml 是 updater 读取的公开元数据。',
      },
      {
        question: 'macOS 提示无法打开怎么办？',
        answer:
          '当前公共安装器可能处于未签名或未公证状态。请只从 GitHub 公开 release 页面下载，并参考 install-macos-unsigned.sh 或页面说明完成安装。',
      },
      {
        question: 'Windows 支持吗？',
        answer:
          '支持。当前 v1.1.3 公开发布包含 Windows x64 安装器 Gaster-Code-1.1.3-win-x64.exe。',
      },
    ],
  },
  en: {
    release: {
      version: GASTER_CODE_RELEASE_VERSION,
      date: GASTER_CODE_RELEASE_DATE,
      line: `Latest ${GASTER_CODE_RELEASE_VERSION} · published ${GASTER_CODE_RELEASE_DATE}`,
      repositoryLine: 'Public release-only repository provides installers',
    },
    hero: {
      title: 'Gaster Code',
      description:
        'An AI development command center that runs beside your local project, bringing context, code edits, terminal verification, and G-Master API models into one desktop workspace.',
      primaryAction: 'Download Latest',
      secondaryAction: 'View Public Repo',
      fineprint:
        'The current macOS and Windows installers are public release assets; the source repository remains private. If signing or notarization secrets are unavailable, installers are published as unsigned with clear guidance.',
    },
    preview: {
      windowTitle: 'Gaster Code · local workspace',
      status: 'G-Master API connected',
      project: 'G-Master API / site',
      projectMeta: 'selected directory · local files only',
      modelMeta: 'model: gm-coder · stream:on',
      sessions: [
        { title: 'gmaster-api', meta: '/gaster-code page', active: true },
        { title: 'desktop release', meta: 'v1.1.3 notes' },
        { title: 'public assets', meta: 'macOS / Windows' },
      ],
      tools: [
        { title: 'Files', meta: 'scoped edits' },
        { title: 'Terminal', meta: 'local checks' },
      ],
      messages: [
        {
          role: 'user',
          text: 'Redesign /gaster-code and preserve release-only repository facts.',
        },
        {
          text: 'Project context loaded. Updating page structure, downloads, unsigned installer guidance, then running checks.',
        },
        {
          text: 'CSS remains scoped to .gm-gaster-code-page for React/Vite integration.',
        },
      ],
      terminalLines: [
        '$ bun run build',
        'vite building production bundle...',
        'scoped CSS checked',
        'release links preserved',
        'unsigned installer copy visible',
      ],
    },
    product: {
      kicker: 'Desktop Workspace',
      title:
        'One local command center. Project, conversation, and terminal stay on site.',
      description:
        'Gaster Code is not a public source editor or a cloud IDE. It is a local desktop app that keeps model output, file changes, and command feedback near the project folder you choose.',
      heading: 'Not a chat add-on. A task cockpit for real projects.',
      body: 'The sidebar keeps session context, the main area carries task discussion and model output, and the terminal runs user-triggered local commands. The public page presents the product and release assets without implying source availability.',
      proofRows: [
        {
          label: 'Context',
          text: 'Read and modify files only inside the folder you choose.',
        },
        {
          label: 'Model',
          text: 'Requests go through your configured G-Master API model channels.',
        },
        {
          label: 'Release',
          text: 'Installers and updater metadata come from the public release-only repository.',
        },
      ],
    },
    capabilitiesIntro: {
      kicker: 'Capabilities',
      title: 'Bring AI coding assistance back to the local execution site.',
      description:
        'A real development path: understand the project, edit code, run verification, and keep models, multimodal input, and remote entry points inside the desktop boundary.',
    },
    capabilities: [
      {
        type: 'context',
        title: 'Local project context starts with your choice.',
        description:
          'Gaster Code builds context around the selected project directory. It can read code, locate files, understand scripts, and inspect docs without implying full-disk access.',
        rows: [
          {
            index: '01',
            label: 'apps/web/src/routes/gaster-code.tsx',
            status: 'open',
          },
          {
            index: '02',
            label: 'components/download-panel.tsx',
            status: 'edit',
          },
          { index: '03', label: 'release-notes/v1.1.3.md', status: 'read' },
          { index: '04', label: 'package.json · scripts', status: 'verify' },
        ],
      },
      {
        type: 'verify',
        title:
          'Code editing, debugging, and terminal verification stay connected.',
        description:
          'From “change this page” to “run checks,” Gaster Code keeps file edits, command output, and follow-up fixes in the same session.',
        lines: [
          '$ bun run lint',
          'scoped selectors: .gm-gaster-code-page',
          'release copy: v1.1.3 / unsigned status',
          '$ bun test gasterCodeDownload',
          'macOS DMG visible',
          'Windows EXE visible',
          'No source repository link exposed as public source.',
        ],
      },
      {
        type: 'entry',
        title:
          'G-Master API, drawing, multimodal input, and IM entry arrive per task.',
        description:
          'Models come from configured G-Master API providers. Drawing, multimodal material, and IM triggering can start work while review and execution remain local.',
        rows: [
          {
            title: 'G-Master API Models',
            text: 'Carry code understanding, change proposals, explanations, and multi-turn task context.',
          },
          {
            title: 'Drawing / Multimodal Entry',
            text: 'Screenshots, sketches, and product visuals can become task material.',
          },
          {
            title: 'IM Remote Entry',
            text: 'External messages can trigger work while the desktop app keeps file and command boundaries.',
          },
        ],
      },
    ],
    workflowIntro: {
      kicker: 'Workflow',
      title: 'From opening a project to a verifiable pre-commit state.',
      description:
        'The rhythm is local, visible, and checkable. Every step can return to files, terminal output, and user confirmation.',
    },
    steps: [
      {
        title: 'Open Project',
        description:
          'Choose a local directory so the session context stays bounded.',
      },
      {
        title: 'Describe Task',
        description:
          'Explain the page, API, script, or error in natural language.',
      },
      {
        title: 'Edit Files',
        description:
          'Review the scope and let model output land in concrete files.',
      },
      {
        title: 'Run Verification',
        description:
          'Execute local commands by user action, read logs, and continue fixing.',
      },
      {
        title: 'Trigger from IM',
        description:
          'Use IM for remote entry while the desktop app keeps the review boundary.',
      },
    ],
    download: {
      kicker: 'Download',
      title: `Latest ${GASTER_CODE_RELEASE_VERSION}. Public assets, private source.`,
      description:
        'The public repository distributes installers, ZIP update packages, and updater metadata. It is not the source repository.',
      repositoryLabel: 'Release-only repo',
      repositoryText: 'HereditaryDog/gaster-code-releases',
      secondaryTitle: 'Auto-update assets',
      secondaryDescription:
        'Auto-update reads public release metadata. ZIP is used by the macOS updater, YAML files power update checks, and the script documents unsigned macOS installation.',
    },
    packages: [
      {
        system: 'macOS Apple Silicon',
        file: 'Gaster-Code-1.1.3-mac-arm64.dmg',
        device: 'Apple Silicon Macs such as M1, M2, M3, and M4',
        note: 'Unsigned / not notarized guidance',
        action: 'Download DMG',
        url: GASTER_CODE_RELEASE_ASSETS.macDmg,
      },
      {
        system: 'Windows x64',
        file: 'Gaster-Code-1.1.3-win-x64.exe',
        device: '64-bit Windows desktop environments',
        note: 'Unsigned installer guidance',
        action: 'Download EXE',
        url: GASTER_CODE_RELEASE_ASSETS.windowsExe,
      },
    ],
    secondaryAssets: [
      {
        label: 'Gaster-Code-1.1.3-mac-arm64.zip',
        url: GASTER_CODE_RELEASE_ASSETS.macZip,
      },
      { label: 'latest-mac.yml', url: GASTER_CODE_RELEASE_ASSETS.latestMac },
      { label: 'latest.yml', url: GASTER_CODE_RELEASE_ASSETS.latestWindows },
      {
        label: 'install-macos-unsigned.sh',
        url: GASTER_CODE_RELEASE_ASSETS.macUnsignedGuide,
      },
    ],
    privacy: {
      kicker: 'Boundaries',
      title: 'Local work should state its boundaries clearly.',
      description:
        'The closer an app gets to files and commands, the clearer its access, execution, model requests, and update sources need to be.',
      items: [
        {
          title: 'Selected Directory',
          description:
            'The desktop app works around the project directory chosen by the user.',
        },
        {
          title: 'User-triggered Actions',
          description:
            'Terminal commands and file changes happen inside visible sessions and remain user-directed.',
        },
        {
          title: 'G-Master API Requests',
          description:
            'Model requests go through the configured G-Master API service and existing provider policies.',
        },
        {
          title: 'Public Update Assets',
          description:
            'The updater reads installers and metadata from the public release-only repository.',
        },
      ],
    },
    faqs: [
      {
        question: 'Does the public repository include source code?',
        answer:
          'No. The public repository is release-only for installers, ZIP update packages, update metadata, and installation guidance. The Gaster Code source repository remains private.',
      },
      {
        question: 'Should I download DMG or ZIP?',
        answer:
          'Regular users should download the DMG. The macOS ZIP is used by the auto-update flow; latest-mac.yml and latest.yml are public updater metadata.',
      },
      {
        question: 'What if macOS blocks the app?',
        answer:
          'The public installer may be unsigned or not notarized. Download only from the public GitHub release page and follow install-macos-unsigned.sh or the page guidance.',
      },
      {
        question: 'Is Windows supported?',
        answer:
          'Yes. The current v1.1.3 public release includes the Windows x64 installer Gaster-Code-1.1.3-win-x64.exe.',
      },
    ],
  },
};
