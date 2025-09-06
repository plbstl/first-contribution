import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    clearMocks: true,
    coverage: {
      include: ['src/**'],
      reporter: ['text', 'json-summary']
    },
    setupFiles: ['__tests__/setup.ts']
  }
})
