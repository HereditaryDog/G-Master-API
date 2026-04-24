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

import react from '@vitejs/plugin-react';
import { defineConfig, transformWithEsbuild } from 'vite';
import pkg from '@douyinfe/vite-plugin-semi';
import path from 'path';
import { codeInspectorPlugin } from 'code-inspector-plugin';
const { vitePluginSemi } = pkg;

const packageChunkMap = [
  {
    chunk: 'react-core',
    match: ['react', 'react-dom', 'react-router-dom'],
  },
  {
    chunk: 'vendor-ui-markdown',
    match: [
      '@douyinfe/semi-icons',
      '@douyinfe/semi-ui',
      'react-markdown',
      'remark-breaks',
      'remark-gfm',
      'remark-math',
      'rehype-highlight',
      'rehype-katex',
      'katex',
      'highlight.js',
    ],
  },
  {
    chunk: 'vendor-visualization',
    match: [
      '@visactor/react-vchart',
      '@visactor/vchart',
      '@visactor/vchart-semi-theme',
      'mermaid',
      'cytoscape',
      'dagre',
    ],
  },
  {
    chunk: 'vendor-icons',
    match: ['@lobehub/icons', 'lucide-react', 'react-icons'],
  },
  {
    chunk: 'vendor-ui',
    match: ['antd'],
  },
  {
    chunk: 'vendor-tools',
    match: ['axios', 'history', 'marked', 'dayjs', 'clsx', 'use-debounce'],
  },
];

function getPackageChunk(id) {
  if (!id.includes('node_modules')) {
    return undefined;
  }

  const normalizedId = id.split(path.sep).join('/');
  const chunkConfig = packageChunkMap.find(({ match }) =>
    match.some((pkgName) => normalizedId.includes(`/node_modules/${pkgName}/`)),
  );

  return chunkConfig?.chunk;
}

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, './src'),
      },
      {
        find: /^@douyinfe\/semi-ui\/lib\/es\/(.*)$/,
        replacement: `${path.resolve(__dirname, './node_modules/@douyinfe/semi-ui/lib/es')}/$1`,
      },
      {
        find: /^@douyinfe\/semi-ui\/dist\/css\/semi\.css$/,
        replacement: path.resolve(
          __dirname,
          './node_modules/@douyinfe/semi-ui/dist/css/semi.css',
        ),
      },
    ],
  },
  plugins: [
    codeInspectorPlugin({
      bundler: 'vite',
    }),
    {
      name: 'treat-js-files-as-jsx',
      async transform(code, id) {
        if (!/src\/.*\.js$/.test(id)) {
          return null;
        }

        // Use the exposed transform from vite, instead of directly
        // transforming with esbuild
        return transformWithEsbuild(code, id, {
          loader: 'jsx',
          jsx: 'automatic',
        });
      },
    },
    react(),
    vitePluginSemi({
      cssLayer: true,
    }),
  ],
  optimizeDeps: {
    force: true,
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
        '.json': 'json',
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 9500,
    rollupOptions: {
      output: {
        manualChunks: getPackageChunk,
      },
    },
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/mj': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/pg': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
