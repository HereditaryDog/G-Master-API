export const GASTER_CODE_DOWNLOAD_URL =
  'https://github.com/HereditaryDog/gaster-code-releases/releases/latest';

export const GASTER_CODE_PAGE_PATH = '/gaster-code';

export const GASTER_CODE_DOWNLOAD_CONTENT = {
  zh: {
    eyebrow: '桌面端编程助手',
    title: '下载 Gaster Code 桌面端',
    description:
      '连接 G-Master API，在本地完成编程、调试、终端和桌面端工作流。',
    primaryAction: '下载最新版',
    repositoryNote: '公开 release-only 下载仓库',
    platforms: ['macOS Apple Silicon', 'macOS Intel', 'Linux x64'],
  },
  en: {
    eyebrow: 'Desktop coding assistant',
    title: 'Download Gaster Code Desktop',
    description:
      'Connect G-Master API and complete coding, debugging, terminal, and desktop workflows locally.',
    primaryAction: 'Download Latest',
    repositoryNote: 'Public release-only download repository',
    platforms: ['macOS Apple Silicon', 'macOS Intel', 'Linux x64'],
  },
};

export const GASTER_CODE_PAGE_CONTENT = {
  zh: {
    hero: {
      eyebrow: 'Gaster Code',
      title: 'Gaster Code 桌面端',
      description:
        '面向 G-Master API 用户的本地编程助手桌面端，把代码编辑、终端执行、项目理解、绘图生成、远程控制和 IM 入口放进同一个桌面工作流。',
    },
    features: [
      {
        title: '本地项目理解',
        description:
          '围绕当前项目连续对话，理解文件结构、命令输出、构建结果和历史会话，复杂任务不必每次从零描述。',
      },
      {
        title: '代码编辑与调试',
        description:
          '读取项目上下文，协助解释代码、修改文件、定位 bug、补测试、整理实现方案，并面向真实本地项目工作。',
      },
      {
        title: '终端工作流',
        description:
          '在本地执行安装依赖、启动服务、运行测试、查看 Git 状态和分析构建错误等开发命令，关键操作仍由你确认。',
      },
      {
        title: 'G-Master API 接入',
        description:
          '通过 G-Master API 使用你已经配置好的 provider 和模型，并按不同任务选择合适模型处理。',
      },
      {
        title: '桌面端体验',
        description:
          '提供会话、设置、终端、绘图和本地服务能力，一个应用内完成提问、改代码、运行验证和任务追踪。',
      },
      {
        title: '绘图与多模态入口',
        description:
          '内置绘图页面，可通过模型生成图像，并逐步整合更多适合开发、设计和内容生产的本地能力。',
      },
      {
        title: 'IM 远程入口',
        description:
          '支持通过 IM adapter 连接微信等入口，完成配对后可以从移动端发送消息，让本地桌面端继续处理任务。',
      },
    ],
    audience: [
      {
        title: 'G-Master API 用户',
        description: '已经在使用 G-Master API，希望获得桌面端编程助手的人。',
      },
      {
        title: '本地项目开发者',
        description: '想把 AI 助手接入项目目录、终端和文件系统的开发者。',
      },
      {
        title: '多步骤任务用户',
        description:
          '经常需要调试、重构、写文档、跑测试或处理多阶段开发任务的人。',
      },
      {
        title: '移动端远程触发',
        description: '希望通过微信等 IM 入口远程触发本地编程助手的人。',
      },
    ],
    steps: [
      {
        title: '下载最新版',
        description:
          '进入公开 latest release，在 Assets 区域选择适合系统的安装包。',
      },
      {
        title: '安装并启动',
        description: 'macOS 普通用户下载 .dmg，Linux x64 用户下载 .deb。',
      },
      {
        title: '确认 API 服务',
        description: '在设置中配置或确认 G-Master API 服务和可用模型。',
      },
      {
        title: '打开项目目录',
        description: '选择你信任的本地项目目录，让桌面端读取上下文。',
      },
      {
        title: '描述你的任务',
        description:
          '开始解释代码、修改文件、运行测试、分析构建错误或整理方案。',
      },
      {
        title: '按需配对 IM 入口',
        description: '需要移动端入口时，在桌面端完成 IM 配对后再远程触发任务。',
      },
    ],
    packages: [
      {
        system: 'macOS Apple Silicon',
        file: 'Gaster-Code_*_macos_arm64_dmg.dmg',
        device: 'M1、M2、M3、M4 等 Apple 芯片 Mac',
      },
      {
        system: 'macOS Intel',
        file: 'Gaster-Code_*_macos_x64_dmg.dmg',
        device: 'Intel 芯片 Mac',
      },
      {
        system: 'Linux x64',
        file: 'Gaster-Code_*_linux_x64_deb.deb',
        device: 'Ubuntu、Debian 及兼容发行版',
      },
    ],
    update: {
      title: '自动更新',
      description:
        '桌面端 updater 只读取公开 release 的 latest.json、安装包和签名文件。主代码仓库保持私有，不影响普通用户检查更新。',
      metadataLabel: '更新元数据',
      metadataUrl:
        'https://github.com/HereditaryDog/gaster-code-releases/releases/latest/download/latest.json',
    },
    privacy: {
      title: '隐私和本地工作',
      description:
        'Gaster Code 是本地桌面端应用，会访问你选择打开的项目文件，并根据你的操作执行本地命令。模型请求会通过你配置的 G-Master API 服务发送，请只在你信任的项目目录中使用。',
    },
    faqs: [
      {
        question: '这个仓库为什么没有源码？',
        answer:
          '这是公开 release-only 仓库，只用于分发安装包和 updater 元数据。Gaster Code 的主项目仓库保持私有。',
      },
      {
        question: '应该下载 .dmg 还是 .app.tar.gz？',
        answer:
          '普通用户下载 .dmg。.app.tar.gz 和对应 .sig 主要用于桌面端自动更新。',
      },
      {
        question: 'macOS 提示无法打开怎么办？',
        answer:
          '请先确认安装包来自公开 Release 页面，再把应用拖到“应用程序”。如仍被拦截，可在终端移除隔离标记后重新打开。',
      },
      {
        question: 'Windows 支持吗？',
        answer:
          '当前公开稳定安装包优先提供 macOS 和 Linux x64，Windows 支持会在后续版本按需发布。',
      },
    ],
  },
  en: {
    hero: {
      eyebrow: 'Gaster Code',
      title: 'Gaster Code Desktop',
      description:
        'A local desktop coding assistant for G-Master API users, combining code editing, terminal execution, project understanding, image generation, remote control, and IM entry points in one workflow.',
    },
    features: [
      {
        title: 'Local Project Context',
        description:
          'Continue conversations around the current project with awareness of file structure, command output, build results, and previous sessions.',
      },
      {
        title: 'Code Editing and Debugging',
        description:
          'Explain code, modify files, locate bugs, add tests, and organize implementation plans for real local projects.',
      },
      {
        title: 'Terminal Workflow',
        description:
          'Run local development commands such as installing dependencies, starting services, running tests, checking Git state, and analyzing build errors.',
      },
      {
        title: 'G-Master API Integration',
        description:
          'Use providers and models configured in G-Master API, then select the right model for each task in the desktop app.',
      },
      {
        title: 'Desktop Experience',
        description:
          'Sessions, settings, terminal, drawing, and local services are available in one application from prompt to verification.',
      },
      {
        title: 'Drawing and Multimodal Entry',
        description:
          'Use the drawing page to generate images with models and access more local capabilities for development, design, and content work.',
      },
      {
        title: 'IM Remote Entry',
        description:
          'Pair through IM adapters such as WeChat, then send mobile messages that let the local desktop app continue work.',
      },
    ],
    audience: [
      {
        title: 'G-Master API Users',
        description:
          'Users who already use G-Master API and want a desktop coding assistant.',
      },
      {
        title: 'Local Project Developers',
        description:
          'Developers who want AI assistance connected to local projects, terminal commands, and file systems.',
      },
      {
        title: 'Multi-Step Task Users',
        description:
          'People who often debug, refactor, write docs, run tests, or handle multi-stage development tasks.',
      },
      {
        title: 'Mobile Remote Triggering',
        description:
          'Users who want to trigger their local desktop assistant remotely through IM entry points.',
      },
    ],
    steps: [
      {
        title: 'Download Latest',
        description:
          'Open the public latest release and choose the right asset for your system.',
      },
      {
        title: 'Install and Launch',
        description: 'Use .dmg for macOS and .deb for Linux x64.',
      },
      {
        title: 'Confirm API Service',
        description:
          'Configure or confirm your G-Master API service and available models.',
      },
      {
        title: 'Open Project Folder',
        description:
          'Choose a trusted local project directory so the app can read context.',
      },
      {
        title: 'Describe the Task',
        description:
          'Explain code, edit files, run tests, analyze build errors, or organize an implementation plan.',
      },
      {
        title: 'Pair IM Entry When Needed',
        description:
          'Complete IM pairing on desktop before triggering work remotely from mobile.',
      },
    ],
    packages: [
      {
        system: 'macOS Apple Silicon',
        file: 'Gaster-Code_*_macos_arm64_dmg.dmg',
        device: 'Apple Silicon Macs such as M1, M2, M3, and M4',
      },
      {
        system: 'macOS Intel',
        file: 'Gaster-Code_*_macos_x64_dmg.dmg',
        device: 'Intel Macs',
      },
      {
        system: 'Linux x64',
        file: 'Gaster-Code_*_linux_x64_deb.deb',
        device: 'Ubuntu, Debian, and compatible distributions',
      },
    ],
    update: {
      title: 'Auto Update',
      description:
        'The desktop updater reads public release assets, latest.json, installers, and signatures only. The private source repository is not required for user updates.',
      metadataLabel: 'Update metadata',
      metadataUrl:
        'https://github.com/HereditaryDog/gaster-code-releases/releases/latest/download/latest.json',
    },
    privacy: {
      title: 'Privacy and Local Work',
      description:
        'Gaster Code is a local desktop app. It accesses the project files you choose and runs local commands according to your actions. Model requests go through your configured G-Master API service.',
    },
    faqs: [
      {
        question: 'Why does this repository not include source code?',
        answer:
          'It is a public release-only repository for installers and updater metadata. The main Gaster Code source repository remains private.',
      },
      {
        question: 'Should I download .dmg or .app.tar.gz?',
        answer:
          'Regular users should download .dmg. .app.tar.gz and .sig files are mainly for desktop auto update.',
      },
      {
        question: 'What if macOS blocks the app?',
        answer:
          'Confirm the installer came from the public Release page, move it to Applications, and remove the quarantine flag if macOS still blocks it.',
      },
      {
        question: 'Is Windows supported?',
        answer:
          'Current public stable installers prioritize macOS and Linux x64. Windows support can be published later as needed.',
      },
    ],
  },
};
