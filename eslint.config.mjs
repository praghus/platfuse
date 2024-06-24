import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
})

export default [{
    ignores: ['**/index.d.ts']
}, ...compat.extends('plugin:@typescript-eslint/recommended', 'prettier'), {
    plugins: {
        '@typescript-eslint': typescriptEslint
    },

    languageOptions: {
        parser: tsParser,
        ecmaVersion: 2018,
        sourceType: 'module',

        parserOptions: {
            project: './tsconfig.json',
            tsconfigRootDir: './'
        }
    },

    rules: {
        '@typescript-eslint/consistent-type-imports': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-empty-function': 'off',

        '@typescript-eslint/lines-between-class-members': [2, 'always', { 
            'exceptAfterOverload': true, 
            'exceptAfterSingleLine': true 
        }],
        
        'accessor-pairs': 2,

        'arrow-spacing': [2, {
            before: true,
            after: true
        }],

        'block-spacing': [2, 'always'],
        'comma-dangle': [2, 'never'],

        'comma-spacing': [2, {
            before: false,
            after: true
        }],

        'comma-style': [2, 'last'],

        'key-spacing': [2, {
            beforeColon: false,
            afterColon: true
        }],

        'keyword-spacing': [2, {
            before: true,
            after: true
        }],

        'linebreak-style': [2, 'unix'],
        'lines-between-class-members': 'off',
        'max-nested-callbacks': [1, 5],
        'max-params': [1, 5],
        'padded-blocks': [2, 'never'],
        'prefer-const': [2],
        quotes: [1, 'single'],
        semi: [2, 'never'],

        'semi-spacing': [2, {
            before: false,
            after: true
        }],

        'space-before-blocks': [2, 'always'],
        'space-in-parens': [2, 'never'],
        'space-infix-ops': 2,

        'space-unary-ops': [2, {
            words: true,
            nonwords: false
        }],

        'no-multi-spaces': [1, {
            ignoreEOLComments: true
        }]
    }
}]