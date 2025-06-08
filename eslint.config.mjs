// @ts-check

import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
    {
        ignores: [
            'dist',
            'node_modules',
            'eslint.config.mjs',
            'jest.config.js',
            'scripts',
            '*.spec.ts',
            'tests/',
            'coverage/',
            '.github'
        ]
    },
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname
            }
        }
    },
    {
        rules: {
            // Enforce dot notation whenever possible
            'dot-notation': 'error',
            '@typescript-eslint/no-unused-vars': 'warn',
            'no-unused-vars': 'warn'
        }
    }
)
