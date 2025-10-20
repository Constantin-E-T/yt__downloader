import { fileURLToPath, URL } from 'node:url';

import { defineConfig, type PluginOption } from 'vite';
import compression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';
import devtools from 'solid-devtools/vite';
import solid from 'vite-plugin-solid';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  const plugins: PluginOption[] = [
    solid(),
    compression({ algorithm: 'brotliCompress' }),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'YouTube Transcript Downloader',
        short_name: 'YT Transcripts',
        description: 'Download YouTube transcripts instantly with a modern Solid.js interface.',
        theme_color: '#0ea5e9',
        background_color: '#0b1120',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ];

  if (isDev) {
    plugins.push(
      devtools({
        autoname: true,
        locator: { targetIDE: 'vscode', componentLocation: true }
      })
    );
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      port: 3000,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true
        }
      }
    },
    build: {
      target: 'esnext',
      minify: 'esbuild',
      cssMinify: 'lightningcss',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['solid-js', '@solidjs/router']
          }
        }
      }
    }
  };
});
