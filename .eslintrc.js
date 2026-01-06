module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    es6: true,
    node: true,
    browser: true,
  },
  plugins: ['react', 'react-native'],
  rules: {
    // Add custom rules here if needed
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-undef': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};

