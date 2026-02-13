import path from 'node:path'
import { defineConfig } from 'rolldown'

export default defineConfig({
  input: 'src/index.ts',
  platform: 'node',
  output: {
    minify: true,
    file: 'dist/index.js',
    sourcemap: true
  },
  resolve: {
    alias: {
      '~src': path.resolve(import.meta.dirname, 'src'),
      '~tests': path.resolve(import.meta.dirname, 'tests')
    }
  }
})
