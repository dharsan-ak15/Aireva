module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  ignorePatterns: ['dist', 'node_modules'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  rules: {
    'no-undef': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
};