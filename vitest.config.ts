import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '~src': path.resolve(import.meta.dirname, 'src'),
      '~tests': path.resolve(import.meta.dirname, 'tests')
    }
  },
  test: {
    clearMocks: true,
    coverage: {
      provider: 'istanbul',
      include: ['src/**'],
      reporter: ['text', 'json-summary']
    },
    setupFiles: ['tests/setup.ts'],
    server: {
      deps: { inline: true }
    }
  }
})
