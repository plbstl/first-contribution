import path from 'node:path'
import { defineConfig } from 'rolldown'
import { esmExternalRequirePlugin } from 'rolldown/plugins'

export default defineConfig({
  input: 'src/index.ts',
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
  },
  plugins: [
    esmExternalRequirePlugin({
      external: ['@actions/core', '@actions/github']
    })
  ]
})
