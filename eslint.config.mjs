import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

/**
 * eslint-config-next 16 ships flat configs directly. Going through FlatCompat
 * makes it serialise a config object that contains a circular reference and
 * crashes the validator, so the flat entries are imported as-is.
 */
const config = [
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // Underscore-prefixed arguments are deliberately unused — kept so a
      // signature stays honest about what it will need (e.g. the locale on
      // getLegalDocument, once translated documents exist).
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'],
  },
];

export default config;
