/**
 * Every message string, through the compiler that renders it.
 *
 * `tsc` proves a key exists; it says nothing about what is inside the string,
 * and next-intl compiles these as ICU MessageFormat at render time. A stray
 * brace is therefore a runtime crash on one screen in one locale — which is
 * exactly how `admin.messages.templateHint` took screen 48 down in every
 * locale while every check in the repo stayed green.
 *
 * Locale matters: plural categories are resolved per locale, so each tree is
 * parsed against its own.
 */
import { IntlMessageFormat } from 'intl-messageformat';

import { de, en } from '../src/messages/index';

const LOCALES = [
  ['de-CH', de],
  ['en', en],
] as const;

let checked = 0;
const bad: string[] = [];

function walk(node: unknown, path: string, locale: string) {
  if (typeof node === 'string') {
    checked += 1;
    try {
      new IntlMessageFormat(node, locale);
    } catch (error) {
      bad.push(`${locale} ${path}\n    ${(error as Error).message}\n    ${node.slice(0, 140)}`);
    }
    return;
  }
  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      walk(value, path ? `${path}.${key}` : key, locale);
    }
  }
}

for (const [locale, tree] of LOCALES) walk(tree, '', locale);

console.log(`\n${checked} strings parsed, ${bad.length} malformed`);
for (const entry of bad) console.log(`  ✗ ${entry}`);
process.exit(bad.length > 0 ? 1 : 0);
