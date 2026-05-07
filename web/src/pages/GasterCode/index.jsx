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
import { useTranslation } from 'react-i18next';
import {
  Bot,
  CheckCircle2,
  Code2,
  Download,
  ExternalLink,
  FolderSearch,
  Home,
  MessageSquare,
  PackageCheck,
  Palette,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Terminal,
  Users,
  Workflow,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  GASTER_CODE_DOWNLOAD_CONTENT,
  GASTER_CODE_PAGE_CONTENT,
  GASTER_CODE_DOWNLOAD_URL,
} from './gasterCodeDownload';

const featureIcons = [
  FolderSearch,
  Code2,
  Terminal,
  Bot,
  Settings2,
  Palette,
  MessageSquare,
];

const audienceIcons = [Bot, Code2, Workflow, MessageSquare];

const GasterCode = () => {
  const { i18n } = useTranslation();
  const isChinese = i18n.language.startsWith('zh');
  const downloadContent = isChinese
    ? GASTER_CODE_DOWNLOAD_CONTENT.zh
    : GASTER_CODE_DOWNLOAD_CONTENT.en;
  const pageContent = isChinese
    ? GASTER_CODE_PAGE_CONTENT.zh
    : GASTER_CODE_PAGE_CONTENT.en;

  return (
    <div className='w-full overflow-x-hidden'>
      <div className='gm-zen-home gm-gaster-code-page'>
        <div className='gm-zen-shapes' aria-hidden='true'>
          <div className='gm-zen-shape'></div>
          <div className='gm-zen-shape'></div>
          <div className='gm-zen-shape'></div>
          <div className='gm-zen-shape'></div>
        </div>

        <section className='gm-gaster-hero'>
          <div className='gm-gaster-hero-copy'>
            <span className='gm-zen-download-eyebrow'>
              {pageContent.hero.eyebrow}
            </span>
            <h1>{pageContent.hero.title}</h1>
            <p>{pageContent.hero.description}</p>
            <div className='gm-gaster-hero-actions'>
              <a
                href={GASTER_CODE_DOWNLOAD_URL}
                className='gm-zen-btn gm-zen-btn-primary'
                target='_blank'
                rel='noopener noreferrer'
              >
                <Download />
                <strong>{downloadContent.primaryAction}</strong>
              </a>
              <Link to='/' className='gm-zen-btn gm-zen-btn-secondary'>
                <Home />
                <strong>{isChinese ? '返回首页' : 'Back Home'}</strong>
              </Link>
            </div>
          </div>

          <div className='gm-gaster-hero-panel' aria-label='Gaster Code'>
            <div className='gm-gaster-window-bar'>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className='gm-gaster-terminal'>
              <p>$ gaster-code</p>
              <p>G-Master API connected</p>
              <p>workspace ready</p>
              <p>local terminal enabled</p>
            </div>
          </div>
        </section>

        <div className='gm-zen-sections gm-gaster-sections'>
          <section className='gm-zen-section gm-gaster-feature-section gm-zen-visible-first'>
            <h2>
              {isChinese ? 'Gaster Code 能做什么' : 'What Gaster Code Can Do'}
            </h2>
            <div className='gm-gaster-capability-grid'>
              {pageContent.features.map((item, index) => {
                const Icon = featureIcons[index] || CheckCircle2;
                const shouldCenter =
                  index === pageContent.features.length - 1 &&
                  pageContent.features.length % 3 === 1;
                return (
                  <article
                    className={`gm-gaster-capability-card ${
                      shouldCenter ? 'gm-gaster-capability-card-centered' : ''
                    }`}
                    key={item.title}
                  >
                    <div className='gm-gaster-card-icon'>
                      <Icon />
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <section className='gm-zen-section gm-gaster-audience-section gm-zen-visible-first'>
            <h2>{isChinese ? '适合谁使用' : 'Who It Is For'}</h2>
            <div className='gm-gaster-audience-grid'>
              {pageContent.audience.map((item, index) => {
                const Icon = audienceIcons[index] || Users;
                return (
                  <article className='gm-gaster-audience-card' key={item.title}>
                    <Icon />
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className='gm-zen-section gm-gaster-steps-section gm-zen-visible-first'>
            <h2>{isChinese ? '使用方式' : 'How To Use'}</h2>
            <div className='gm-gaster-steps-list'>
              {pageContent.steps.map((step, index) => (
                <article className='gm-gaster-step-item' key={step.title}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className='gm-zen-section gm-gaster-release-section gm-zen-visible-first'>
            <div className='gm-gaster-section-heading'>
              <h2>
                {isChinese ? '下载与更新说明' : 'Download and Update Notes'}
              </h2>
              <p>
                {isChinese
                  ? '公开仓库只分发安装包、签名文件和自动更新所需元数据，不暴露私有主仓库。'
                  : 'The public repository distributes installers, signatures, and updater metadata without exposing the private source repository.'}
              </p>
            </div>
            <div className='gm-gaster-package-table'>
              {pageContent.packages.map((item) => (
                <div className='gm-gaster-package-row' key={item.system}>
                  <strong>{item.system}</strong>
                  <code>{item.file}</code>
                  <span>{item.device}</span>
                </div>
              ))}
            </div>
            <div className='gm-gaster-info-grid'>
              <article className='gm-gaster-info-card'>
                <RefreshCw />
                <h3>{pageContent.update.title}</h3>
                <p>{pageContent.update.description}</p>
                <a
                  href={pageContent.update.metadataUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  {pageContent.update.metadataLabel}
                  <ExternalLink />
                </a>
              </article>
              <article className='gm-gaster-info-card'>
                <ShieldCheck />
                <h3>{pageContent.privacy.title}</h3>
                <p>{pageContent.privacy.description}</p>
              </article>
              <article className='gm-gaster-info-card'>
                <PackageCheck />
                <h3>{isChinese ? '发布内容' : 'Release Assets'}</h3>
                <p>
                  {isChinese
                    ? '每个公开版本包含用户安装包、自动更新包、签名文件和 updater 元数据 latest.json。'
                    : 'Each public version includes user installers, auto-update packages, signatures, and latest.json metadata.'}
                </p>
              </article>
            </div>
          </section>

          <section className='gm-zen-section gm-gaster-faq-section gm-zen-visible-first'>
            <h2>{isChinese ? '常见问题' : 'FAQ'}</h2>
            <div className='gm-gaster-faq-list'>
              {pageContent.faqs.map((item) => (
                <article
                  className='gm-gaster-capability-card'
                  key={item.question}
                >
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default GasterCode;
