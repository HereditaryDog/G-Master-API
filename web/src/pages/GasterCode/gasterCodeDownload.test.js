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

import { describe, expect, test } from 'bun:test';

import {
  GASTER_CODE_DOWNLOAD_CONTENT,
  GASTER_CODE_DOWNLOAD_URL,
  GASTER_CODE_PAGE_CONTENT,
  GASTER_CODE_PAGE_PATH,
  GASTER_CODE_RELEASE_ASSETS,
  GASTER_CODE_RELEASE_URL,
  GASTER_CODE_REPOSITORY_URL,
} from './gasterCodeDownload.js';

describe('Gaster Code download detail page content', () => {
  test('uses the public release-only repository URLs', () => {
    expect(GASTER_CODE_PAGE_PATH).toBe('/gaster-code');
    expect(GASTER_CODE_REPOSITORY_URL).toBe(
      'https://github.com/HereditaryDog/gaster-code-releases',
    );
    expect(GASTER_CODE_DOWNLOAD_URL).toBe(
      'https://github.com/HereditaryDog/gaster-code-releases/releases/latest',
    );
    expect(GASTER_CODE_RELEASE_URL).toBe(
      'https://github.com/HereditaryDog/gaster-code-releases/releases/tag/v1.1.3',
    );
    expect(GASTER_CODE_DOWNLOAD_URL).not.toContain('GasterCode');
    expect(GASTER_CODE_DOWNLOAD_URL).not.toContain('gaster-code-private');
  });

  test('keeps Chinese download copy aligned with the current release assets', () => {
    const content = GASTER_CODE_DOWNLOAD_CONTENT.zh;

    expect(content.title).toBe('下载 Gaster Code 桌面端');
    expect(content.description).toBe(
      '连接 G-Master API，在本地完成项目理解、代码编辑、终端验证和桌面端工作流。',
    );
    expect(content.primaryAction).toBe('下载最新版');
    expect(content.platforms).toEqual(['macOS Apple Silicon', 'Windows x64']);
    expect(content.secondaryAssets).toContain('latest-mac.yml');
  });

  test('includes the Apple-style product page facts', () => {
    const content = GASTER_CODE_PAGE_CONTENT.zh;
    const capabilityTitles = content.capabilities.map(
      (feature) => feature.title,
    );
    const stepTitles = content.steps.map((step) => step.title);

    expect(content.release.version).toBe('v1.1.3');
    expect(content.hero.title).toBe('Gaster Code');
    expect(capabilityTitles).toEqual([
      '本地项目上下文，先由你选择。',
      '代码编辑、调试与终端验证连在一起。',
      'G-Master API、绘图、多模态与 IM 入口，按任务进入。',
    ]);
    expect(stepTitles).toEqual([
      '打开项目',
      '描述任务',
      '编辑文件',
      '运行验证',
      'IM 触发',
    ]);
    expect(content.packages.map((item) => item.file)).toEqual([
      'Gaster-Code-1.1.3-mac-arm64.dmg',
      'Gaster-Code-1.1.3-win-x64.exe',
    ]);
    expect(content.secondaryAssets.map((item) => item.label)).toEqual([
      'Gaster-Code-1.1.3-mac-arm64.zip',
      'latest-mac.yml',
      'latest.yml',
      'install-macos-unsigned.sh',
    ]);
    expect(JSON.stringify(content)).toContain('源码仓库仍保持私有');
    expect(JSON.stringify(content)).toContain('未签名');
    expect(JSON.stringify(content)).not.toContain('latest.json');
    expect(JSON.stringify(content)).not.toContain('Linux x64');
    expect(JSON.stringify(content)).not.toContain(['Claude', 'Code'].join(' '));
  });

  test('uses current v1.1.3 public release asset URLs', () => {
    expect(GASTER_CODE_RELEASE_ASSETS.macDmg).toBe(
      'https://github.com/HereditaryDog/gaster-code-releases/releases/download/v1.1.3/Gaster-Code-1.1.3-mac-arm64.dmg',
    );
    expect(GASTER_CODE_RELEASE_ASSETS.windowsExe).toBe(
      'https://github.com/HereditaryDog/gaster-code-releases/releases/download/v1.1.3/Gaster-Code-1.1.3-win-x64.exe',
    );
    expect(GASTER_CODE_RELEASE_ASSETS.latestMac).toBe(
      'https://github.com/HereditaryDog/gaster-code-releases/releases/download/v1.1.3/latest-mac.yml',
    );
  });
});
