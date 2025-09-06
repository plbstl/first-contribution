import js from '@eslint/js'
import github from 'eslint-plugin-github'
import { importX } from 'eslint-plugin-import-x'
import jest from 'eslint-plugin-jest'
import noOnlyTestsPlugin from 'eslint-plugin-no-only-tests'
import { globalIgnores } from 'eslint/config'
import globals from 'globals'
import * as tseslint from 'typescript-eslint'

export default tseslint.config([
  globalIgnores(['node_modules', 'dist', 'coverage', 'eslint.config.mjs']),

  {
    plugins: {
      'no-only-tests': noOnlyTestsPlugin,
      github
    }
  },

  {
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      importX.flatConfigs.recommended,
      importX.flatConfigs.typescript
    ],
    languageOptions: {
      ecmaVersion: 2022,
      parserOptions: {
        projectService: { allowDefaultProject: ['*.mjs'] },
        tsconfigRootDir: import.meta.dirname
      },
      globals: {
        ...globals.es2022,
        ...globals.nodeBuiltin
      }
    },
    rules: {
      'github/array-foreach': 'error',
      'github/filenames-match-regex': ['error', '^[a-z0-9-_]+(.[a-z0-9-_]+)?$'],
      'github/no-then': 'error',
      'import-x/no-dynamic-require': 'error',
      'import-x/no-namespace': 'off',
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
      '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],
      '@typescript-eslint/no-unnecessary-qualifier': 'error',
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/require-array-sort-compare': 'error'
    }
  },

  // Tests
  {
    files: ['**/*.test.ts'],
    ...jest.configs['flat/recommended'],
    ...jest.configs['flat/style']
  },

  // js files
  {
    files: ['**/*.js', '**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked]
  }
])
