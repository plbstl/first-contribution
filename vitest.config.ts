import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '~src': './src',
      '~tests': './tests'
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
