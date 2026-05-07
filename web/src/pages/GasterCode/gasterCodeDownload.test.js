import { describe, expect, test } from 'bun:test';

import {
  GASTER_CODE_DOWNLOAD_CONTENT,
  GASTER_CODE_PAGE_CONTENT,
  GASTER_CODE_DOWNLOAD_URL,
  GASTER_CODE_PAGE_PATH,
} from './gasterCodeDownload.js';

describe('Gaster Code download detail page content', () => {
  test('uses the public release-only latest release URL', () => {
    expect(GASTER_CODE_PAGE_PATH).toBe('/gaster-code');
    expect(GASTER_CODE_DOWNLOAD_URL).toBe(
      'https://github.com/HereditaryDog/gaster-code-releases/releases/latest',
    );
    expect(GASTER_CODE_DOWNLOAD_URL).not.toContain('GasterCode');
    expect(GASTER_CODE_DOWNLOAD_URL).not.toContain('gaster-code-private');
  });

  test('keeps Chinese download copy aligned with the product requirement', () => {
    const content = GASTER_CODE_DOWNLOAD_CONTENT.zh;

    expect(content.title).toBe('下载 Gaster Code 桌面端');
    expect(content.description).toBe(
      '连接 G-Master API，在本地完成编程、调试、终端和桌面端工作流。',
    );
    expect(content.primaryAction).toBe('下载最新版');
    expect(content.platforms).toEqual([
      'macOS Apple Silicon',
      'macOS Intel',
      'Linux x64',
    ]);
  });

  test('includes the public repository highlights on the detail page', () => {
    const content = GASTER_CODE_PAGE_CONTENT.zh;
    const featureTitles = content.features.map((feature) => feature.title);
    const audienceTitles = content.audience.map((item) => item.title);
    const stepTitles = content.steps.map((step) => step.title);

    expect(featureTitles).toEqual([
      '本地项目理解',
      '代码编辑与调试',
      '终端工作流',
      'G-Master API 接入',
      '桌面端体验',
      '绘图与多模态入口',
      'IM 远程入口',
    ]);
    expect(audienceTitles).toContain('G-Master API 用户');
    expect(stepTitles).toEqual([
      '下载最新版',
      '安装并启动',
      '确认 API 服务',
      '打开项目目录',
      '描述你的任务',
      '按需配对 IM 入口',
    ]);
    expect(content.update.metadataUrl).toBe(
      'https://github.com/HereditaryDog/gaster-code-releases/releases/latest/download/latest.json',
    );
    expect(JSON.stringify(content)).not.toContain(['Claude', 'Code'].join(' '));
  });
});
