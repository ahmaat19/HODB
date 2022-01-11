module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ['airbnb-base'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    semi: ['error', 'never'],
    'linebreak-style': 0,
    'nextline-without-break': 0,
    'import/export': 0,
    'import/extensions': 0,
    'comma-dangle': 0,
    'import/prefer-default-export': 0,
  },
}
