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
      '~src': './src',
      '~tests': './tests'
    }
  }
})
