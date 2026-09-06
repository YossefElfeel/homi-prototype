/**
 * Every message string, and every key a screen asks for.
 *
 * Two failures live here that nothing else in the repo catches, because `tsc`
 * checks a key's *type* and never touches its content or its existence:
 *
 *  1. next-intl compiles these as ICU MessageFormat at render time, so a stray
 *     brace is a runtime crash on one screen in one locale — which is how
 *     `admin.messages.templateHint` took screen 48 down in every locale while
 *     every check in the repo stayed green.
 *  2. `useTranslations` is typed on the namespace, not the key, so `t('foo')`
 *     against a key nobody added throws MISSING_MESSAGE the first time that
 *     branch renders — and a branch behind a status or a filter can sit
 *     unrendered for weeks.
 *
 * Locale matters for the first: plural categories resolve per locale, so each
 * tree is parsed against its own.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { IntlMessageFormat } from 'intl-messageformat';
import { globSync } from 'tinyglobby';

import { de, en } from '../src/messages/index.ts';
import { ADMIN_PERMISSIONS } from '../src/mock/schema.ts';
import { PERMISSION_GROUPS } from '../src/lib/admin-permissions.ts';
import { STATUS_ENTITIES, statesOf } from '../src/lib/status-registry.ts';

let passed = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail = '') {
  if (ok) passed += 1;
  else failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
}

/* ------------------------------------------------------ 1. every string */

function walk(node: unknown, path: string, locale: string) {
  if (typeof node === 'string') {
    let ok = true;
    let message = '';
    try {
      new IntlMessageFormat(node, locale);
    } catch (error) {
      ok = false;
      message = (error as Error).message;
    }
    check(`${locale} ${path} parses`, ok, message);
    return;
  }
  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      walk(value, path ? `${path}.${key}` : key, locale);
    }
  }
}

walk(de, '', 'de-CH');
walk(en, '', 'en');

/* -------------------------------------------------- 2. every key asked for */

function resolve(tree: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) => {
    if (node && typeof node === 'object') return (node as Record<string, unknown>)[key];
    return undefined;
  }, tree);
}

let dynamic = 0;

for (const file of globSync('src/**/*.tsx', { cwd: process.cwd() })) {
  const source = readFileSync(join(process.cwd(), file), 'utf8');

  /* Variable → namespace, from `const t = useTranslations('admin.booking')`.
     Screens routinely hold three of these (`t`, `rt`, `listT`), so the binding
     name is what decides which tree a call belongs to. */
  const namespaces = new Map<string, string>();
  for (const m of source.matchAll(/const\s+(\w+)\s*=\s*useTranslations\('([^']+)'\)/g)) {
    namespaces.set(m[1]!, m[2]!);
  }
  if (namespaces.size === 0) continue;

  for (const [variable, namespace] of namespaces) {
    const keys: string[] = [];

    for (const m of source.matchAll(new RegExp('\\b' + variable + "\\(\\s*'([^'\\n]*)'", 'g'))) {
      keys.push(m[1]!);
    }
    /* Backtick calls are how a key gets built from a status or a filter value.
       The ones with a hole in them cannot be resolved from the source, so they
       are counted rather than skipped in silence. */
    for (const m of source.matchAll(new RegExp('\\b' + variable + '\\(\\s*`([^`\\n]*)`', 'g'))) {
      if (m[1]!.includes('${')) dynamic += 1;
      else keys.push(m[1]!);
    }

    for (const key of keys) {
      if (!key) continue;
      const full = `${namespace}.${key}`;
      check(`${file} → ${full}`, typeof resolve(de, full) === 'string', 'no such key in de');
    }
  }
}

/* ---- the runtime-built keys whose value set *is* knowable ---------------
 *
 * The counter below is honest and it is also where a real bug hid: the
 * construction dialog asked the dictionary for a per-group heading for a wave
 * after that block was deleted, and printed the raw key at somebody. The
 * pattern is unresolvable from source, but the *values* are enumerable — they
 * come from a union or a registry this file can import. Those get checked.
 *
 * What stays uncounted is the genuinely open kind: a key built from a slug the
 * office invents. There is no list to check it against, which is exactly why
 * a service's count question and a section's headings are fields on records
 * rather than message keys.
 */
for (const [name, dict] of [['de', de], ['en', en]] as const) {
  for (const permission of ADMIN_PERMISSIONS) {
    check(
      `[dynamic] admin.shell.nav.${permission} in ${name}`,
      typeof resolve(dict, `admin.shell.nav.${permission}`) === 'string',
    );
  }
  for (const group of PERMISSION_GROUPS) {
    check(
      `[dynamic] admin.shell.groups.${group} in ${name}`,
      typeof resolve(dict, `admin.shell.groups.${group}`) === 'string',
    );
  }
  for (const entity of STATUS_ENTITIES) {
    for (const state of statesOf(entity)) {
      check(
        `[dynamic] status.${entity}.${state} in ${name}`,
        typeof resolve(dict, `status.${entity}.${state}`) === 'string',
      );
    }
  }
}


console.log(`\n${passed} checks passed, ${failures.length} failed`);
if (dynamic > 0) console.log(`${dynamic} keys are built at runtime and not checked`);
for (const entry of failures) console.log(`  ✗ ${entry}`);
process.exit(failures.length > 0 ? 1 : 0);
