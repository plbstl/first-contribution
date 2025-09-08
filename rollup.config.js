import alias from '@rollup/plugin-alias'
import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import swc from '@rollup/plugin-swc'
import terser from '@rollup/plugin-terser'
import path from 'node:path'

const config = {
  input: 'src/index.ts',
  output: {
    esModule: true,
    file: 'dist/index.js',
    format: 'es',
    sourcemap: true
  },
  plugins: [
    alias({
      entries: [
        { find: /^~src(.*)/, replacement: path.resolve(import.meta.dirname, 'src/$1') },
        { find: /^~tests(.*)/, replacement: path.resolve(import.meta.dirname, 'tests/$1') }
      ]
    }),
    commonjs(),
    nodeResolve(),
    swc(),
    terser()
  ]
}

export default config
