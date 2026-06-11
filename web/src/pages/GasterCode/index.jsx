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

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, ExternalLink } from 'lucide-react';
import {
  GASTER_CODE_DOWNLOAD_CONTENT,
  GASTER_CODE_DOWNLOAD_URL,
  GASTER_CODE_PAGE_CONTENT,
  GASTER_CODE_RELEASE_URL,
  GASTER_CODE_REPOSITORY_URL,
} from './gasterCodeDownload';

const SectionHead = ({ id, kicker, title, description }) => (
  <div className='section-head'>
    <div className='section-kicker'>{kicker}</div>
    <h2 id={id}>{title}</h2>
    <p className='section-lede'>{description}</p>
  </div>
);

const ProductPreview = ({ preview }) => (
  <div className='hero-visual reveal' aria-label='Gaster Code desktop preview'>
    <div className='app-window'>
      <div className='window-bar'>
        <div className='traffic' aria-hidden='true'>
          <i></i>
          <i></i>
          <i></i>
        </div>
        <div className='window-title'>{preview.windowTitle}</div>
        <div className='status-chip'>{preview.status}</div>
      </div>
      <div className='workspace'>
        <aside className='sidebar' aria-label='Session preview'>
          <div className='side-label'>Sessions</div>
          {preview.sessions.map((session) => (
            <div
              className={`session ${session.active ? 'active' : ''}`}
              key={session.title}
            >
              <strong>{session.title}</strong>
              <span>{session.meta}</span>
            </div>
          ))}
          <div className='side-label'>Tools</div>
          {preview.tools.map((tool) => (
            <div className='session' key={tool.title}>
              <strong>{tool.title}</strong>
              <span>{tool.meta}</span>
            </div>
          ))}
        </aside>
        <div className='main-pane'>
          <div className='pane-head'>
            <div className='project-name'>
              <strong>{preview.project}</strong>
              <span>{preview.projectMeta}</span>
            </div>
            <div className='pane-meta'>{preview.modelMeta}</div>
          </div>
          <div className='chat-area'>
            {preview.messages.map((message) => (
              <div
                className={`message ${message.role === 'user' ? 'user' : ''}`}
                key={message.text}
              >
                {message.text}
              </div>
            ))}
          </div>
          <pre className='terminal' aria-label='Terminal output preview'>
            <span>{preview.terminalLines[0].slice(0, 1)}</span>
            {preview.terminalLines[0].slice(1)}
            {'\n'}
            <b>{preview.terminalLines[1].split(' ')[0]}</b>
            {preview.terminalLines[1].replace(
              preview.terminalLines[1].split(' ')[0],
              '',
            )}
            {'\n'}
            {preview.terminalLines.slice(2).map((line) => (
              <React.Fragment key={line}>
                <span>✓</span> {line}
                {'\n'}
              </React.Fragment>
            ))}
          </pre>
        </div>
      </div>
    </div>
  </div>
);

const CodeShowcase = ({ pageContent }) => (
  <div className='deep-window' aria-label='Code and terminal visual preview'>
    <div className='deep-screen'>
      <div className='deep-top'>
        <span>repo / selected workspace</span>
        <span>gm-api: ready</span>
      </div>
      <div className='code-lines'>
        <div>
          <span className='dim'>01</span> <span className='blue'>const</span>{' '}
          release ={' '}
          <span className='green'>{`"${pageContent.release.version}"`}</span>;
        </div>
        <div>
          <span className='dim'>02</span> <span className='blue'>const</span>{' '}
          assets = [
        </div>
        <div>
          <span className='dim'>03</span>{' '}
          <span className='green'>"mac-arm64.dmg"</span>,
        </div>
        <div>
          <span className='dim'>04</span>{' '}
          <span className='green'>"win-x64.exe"</span>,
        </div>
        <div>
          <span className='dim'>05</span>{' '}
          <span className='green'>"latest.yml"</span>
        </div>
        <div>
          <span className='dim'>06</span> ];
        </div>
        <br />
        <div>
          <span className='yellow'>assistant</span>.edit(
          <span className='green'>"download section"</span>);
        </div>
        <div>
          <span className='yellow'>terminal</span>.run(
          <span className='green'>"bun run build"</span>);
        </div>
        <div>
          <span className='dim'># source repo remains private</span>
        </div>
      </div>
    </div>
  </div>
);

const CapabilityVisual = ({ item }) => {
  if (item.type === 'context') {
    return (
      <div className='context-map'>
        {item.rows.map((row) => (
          <div className='map-row' key={row.index}>
            <mark>{row.index}</mark>
            <span>{row.label}</span>
            <small>{row.status}</small>
          </div>
        ))}
      </div>
    );
  }

  if (item.type === 'verify') {
    return (
      <pre className='verify-panel'>
        {item.lines.map((line) => {
          if (line.startsWith('$')) {
            return (
              <React.Fragment key={line}>
                <span className='cmd'>{line}</span>
                {'\n'}
              </React.Fragment>
            );
          }

          if (line.startsWith('No ')) {
            return (
              <React.Fragment key={line}>
                <span className='note'>{line}</span>
                {'\n'}
              </React.Fragment>
            );
          }

          return (
            <React.Fragment key={line}>
              <span className='pass'>✓</span> {line}
              {'\n'}
            </React.Fragment>
          );
        })}
      </pre>
    );
  }

  return (
    <div className='entry-panel'>
      {item.rows.map((row) => (
        <div className='entry-line' key={row.title}>
          <b>{row.title}</b>
          <span>{row.text}</span>
        </div>
      ))}
    </div>
  );
};

const DownloadSection = ({ pageContent }) => (
  <section className='section reveal' aria-labelledby='download-title'>
    <div className='inner download-layout'>
      <div className='download-copy'>
        <div className='section-kicker'>{pageContent.download.kicker}</div>
        <h2 id='download-title'>{pageContent.download.title}</h2>
        <p>{pageContent.download.description}</p>
        <p className='repo-line'>
          {pageContent.download.repositoryLabel}:{' '}
          <a
            href={GASTER_CODE_REPOSITORY_URL}
            target='_blank'
            rel='noopener noreferrer'
          >
            {pageContent.download.repositoryText}
          </a>
        </p>
      </div>

      <div className='download-grid'>
        {pageContent.packages.map((item, index) => (
          <article
            className='download-card reveal-unit'
            key={item.system}
            style={{ '--reveal-index': index }}
          >
            <div>
              <h3>{item.system}</h3>
              <p>{item.device}</p>
              <div className='meta'>
                <span className='tag'>{item.file}</span>
                <span className='tag'>{item.note}</span>
              </div>
            </div>
            <a
              className='button primary'
              href={item.url}
              target='_blank'
              rel='noopener noreferrer'
            >
              <Download />
              {item.action}
            </a>
          </article>
        ))}

        <div
          className='secondary-assets reveal-unit'
          style={{ '--reveal-index': pageContent.packages.length }}
        >
          <h3>{pageContent.download.secondaryTitle}</h3>
          <p>{pageContent.download.secondaryDescription}</p>
          <div className='asset-list'>
            {pageContent.secondaryAssets.map((item) => (
              <a
                className='tag'
                href={item.url}
                target='_blank'
                rel='noopener noreferrer'
                key={item.label}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

const GasterCode = () => {
  const { i18n } = useTranslation();
  const isChinese = i18n.language.startsWith('zh');
  const downloadContent = isChinese
    ? GASTER_CODE_DOWNLOAD_CONTENT.zh
    : GASTER_CODE_DOWNLOAD_CONTENT.en;
  const pageContent = isChinese
    ? GASTER_CODE_PAGE_CONTENT.zh
    : GASTER_CODE_PAGE_CONTENT.en;

  useEffect(() => {
    const root = document.querySelector('.gm-gaster-code-page');
    if (!root) return undefined;

    const nodes = Array.from(root.querySelectorAll('.reveal'));

    if (!('IntersectionObserver' in window)) {
      nodes.forEach((node) => node.classList.add('is-visible'));
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
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );

    nodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, [i18n.language]);

  return (
    <div className='w-full overflow-x-hidden'>
      <main className='gm-zen-home gm-gaster-code-page'>
        <div className='page-shell'>
          <section className='hero section'>
            <div className='inner hero-grid'>
              <div className='hero-text reveal'>
                <h1>{pageContent.hero.title}</h1>
                <p className='hero-copy'>{pageContent.hero.description}</p>
                <div className='release-line'>
                  <span className='release-dot' aria-hidden='true'></span>
                  <span>{pageContent.release.line}</span>
                  <span>{pageContent.release.repositoryLine}</span>
                </div>
                <div
                  className='cta-row'
                  aria-label='Gaster Code primary actions'
                >
                  <a
                    className='button primary'
                    href={GASTER_CODE_DOWNLOAD_URL}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <Download />
                    {downloadContent.primaryAction}
                  </a>
                  <a
                    className='button secondary'
                    href={GASTER_CODE_REPOSITORY_URL}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <ExternalLink />
                    {pageContent.hero.secondaryAction}
                  </a>
                </div>
                <p className='fineprint'>{pageContent.hero.fineprint}</p>
              </div>
              <ProductPreview preview={pageContent.preview} />
            </div>
          </section>

          <section className='section reveal' aria-labelledby='product-title'>
            <div className='inner'>
              <SectionHead
                id='product-title'
                kicker={pageContent.product.kicker}
                title={pageContent.product.title}
                description={pageContent.product.description}
              />
              <div
                className='visual-band product-showcase reveal-unit'
                style={{ '--reveal-index': 0 }}
              >
                <CodeShowcase pageContent={pageContent} />
                <div className='showcase-copy'>
                  <h3>{pageContent.product.heading}</h3>
                  <p>{pageContent.product.body}</p>
                  <div className='mini-stack'>
                    {pageContent.product.proofRows.map((row) => (
                      <div className='mini-row' key={row.label}>
                        <b>{row.label}</b>
                        <span>{row.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            className='section reveal'
            aria-labelledby='capabilities-title'
          >
            <div className='inner'>
              <SectionHead
                id='capabilities-title'
                kicker={pageContent.capabilitiesIntro.kicker}
                title={pageContent.capabilitiesIntro.title}
                description={pageContent.capabilitiesIntro.description}
              />
              <div className='capability-list'>
                {pageContent.capabilities.map((item, index) => (
                  <article
                    className='cap-row reveal-unit'
                    key={item.title}
                    style={{ '--reveal-index': index }}
                  >
                    <div className='cap-copy'>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                    <div className='cap-visual'>
                      <CapabilityVisual item={item} />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section
            className='section workflow reveal'
            aria-labelledby='workflow-title'
          >
            <div className='inner'>
              <SectionHead
                id='workflow-title'
                kicker={pageContent.workflowIntro.kicker}
                title={pageContent.workflowIntro.title}
                description={pageContent.workflowIntro.description}
              />
              <div className='flow-strip' aria-label='Gaster Code workflow'>
                {pageContent.steps.map((step, index) => (
                  <article
                    className='flow-step reveal-unit'
                    key={step.title}
                    style={{ '--reveal-index': index }}
                  >
                    <div className='flow-num'>
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <DownloadSection pageContent={pageContent} />

          <section
            className='section privacy reveal'
            aria-labelledby='privacy-title'
          >
            <div className='inner'>
              <SectionHead
                id='privacy-title'
                kicker={pageContent.privacy.kicker}
                title={pageContent.privacy.title}
                description={pageContent.privacy.description}
              />
              <div className='privacy-grid'>
                {pageContent.privacy.items.map((item, index) => (
                  <article
                    className='privacy-item reveal-unit'
                    key={item.title}
                    style={{ '--reveal-index': index }}
                  >
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className='section reveal' aria-labelledby='faq-title'>
            <div className='inner'>
              <SectionHead
                id='faq-title'
                kicker='FAQ'
                title={isChinese ? '常见问题' : 'Frequently Asked Questions'}
                description={
                  isChinese
                    ? '下载、更新和源码边界放在同一个页面里，避免用户在公开仓库和产品站之间来回猜。'
                    : 'Download, update, and source-boundary guidance live on the same page so users do not have to infer from the public repository.'
                }
              />
              <div className='faq-grid'>
                {pageContent.faqs.map((item, index) => (
                  <details
                    className='reveal-unit'
                    key={item.question}
                    open={index === 0}
                    style={{ '--reveal-index': index }}
                  >
                    <summary>{item.question}</summary>
                    <p>{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          <div className='closing'>
            Gaster Code · G-Master API desktop workspace ·{' '}
            <a
              href={GASTER_CODE_RELEASE_URL}
              target='_blank'
              rel='noopener noreferrer'
            >
              {pageContent.release.version} public release
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GasterCode;
