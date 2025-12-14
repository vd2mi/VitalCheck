import eslintConfigPrettier from 'eslint-config-prettier';
import js from '@eslint/js';
import { flatConfigs as importConfigs } from 'eslint-plugin-import';
import tsParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  importConfigs.recommended,
  eslintConfigPrettier,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: tsParser
    },
    rules: {
      'import/order': 'off',
      'import/no-unresolved': 'off'
    }
  }
];

