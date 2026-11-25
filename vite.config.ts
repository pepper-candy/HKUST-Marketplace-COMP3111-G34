import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  test: {
    setupFiles: ['./tests/setup.ts'],
    reporters: [
      'default',
      ['html', { outputDir: path.resolve(rootDir, 'docs/test_report'), singleFile: true }],
    ],
    coverage: {
      enabled: true,
      provider: 'v8',
      reportsDirectory: path.resolve(rootDir, 'docs/coverage'),
    },
  },
})
