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
    // Each agent worktree under .claude/ carries its own .next, and the
    // '.next/**' pattern only reaches the one at the repo root. Without this
    // entry `npm run lint` linted those generated chunks as source and
    // reported 18k+ problems, burying every real finding in src.
    ignores: [
      '.next/**',
      '.claude/worktrees/**',
      'node_modules/**',
      'next-env.d.ts',
    ],
  },
];

export default config;
