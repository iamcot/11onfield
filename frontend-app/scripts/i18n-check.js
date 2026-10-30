#!/usr/bin/env node
/**
 * Lists Vietnamese text in src/ that has no entry in src/i18n/messages (and stale entries).
 *   node scripts/i18n-check.js            report
 *   node scripts/i18n-check.js --json     missing strings as a JSON array
 * Skipped: a line marked `// i18n-ignore` (or the line after it), lines between
 * `// i18n-ignore-start` and `// i18n-ignore-end`, files containing `i18n-ignore-file`.
 */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..', 'src');
const MSG_DIR = path.join(ROOT, 'i18n', 'messages');
const VI = /[À-ÃÈ-ÊÌÍÒ-ÕÙÚÝà-ãè-êìíò-õùúýĂăĐđĨĩŨũƠơƯưẠ-ỹ]/;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?)$/.test(e.name)) out.push(p);
  }
  return out;
}

function parse(file) {
  return ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
}

// message keys: property names of object literals in messages/*.ts
const keys = new Map();
for (const file of walk(MSG_DIR)) {
  const sf = parse(file);
  const visit = (n) => {
    if (ts.isPropertyAssignment(n) && (ts.isStringLiteral(n.name) || ts.isIdentifier(n.name))) {
      const k = n.name.text;
      if (keys.has(k)) console.warn(`duplicate key: ${k} (${path.relative(ROOT, file)})`);
      keys.set(k, file);
      if (ts.isArrayLiteralExpression(n.initializer) && n.initializer.elements.length !== 3) console.warn(`needs 3 translations: ${k}`);
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}

// SEO keyword lists stay Vietnamese
function inKeywords(n) {
  for (let p = n.parent; p; p = p.parent) if (ts.isPropertyAssignment(p) && p.name.getText() === 'keywords') return true;
  return false;
}

const missing = [];
const used = new Set();
const SKIP_DIRS = [MSG_DIR, path.join(ROOT, 'mocks'), path.join(ROOT, 'components', 'landing'), path.join(ROOT, 'content')];
for (const file of walk(ROOT)) {
  if (SKIP_DIRS.some((d) => file.startsWith(d))) continue;
  const text = fs.readFileSync(file, 'utf8');
  if (text.includes('i18n-ignore-file')) continue;
  const lines = text.split('\n');
  const blocked = new Set();
  let on = false;
  lines.forEach((l, i) => {
    if (l.includes('i18n-ignore-start')) on = true;
    if (on) blocked.add(i);
    if (l.includes('i18n-ignore-end')) on = false;
  });
  const sf = parse(file);
  const visit = (n) => {
    let s = null;
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) s = n.text;
    else if (ts.isJsxText(n)) s = n.text.replace(/\s+/g, ' ').trim();
    else if (ts.isTemplateExpression(n)) s = [n.head, ...n.templateSpans.map((x) => x.literal)].map((x) => x.text).join('…');
    // t('…') calls must have an entry even without Vietnamese diacritics
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 't' && n.arguments[0] && ts.isStringLiteral(n.arguments[0])) {
      const k = n.arguments[0].text;
      if (keys.has(k)) used.add(k);
      else if (!VI.test(k)) {
        const line = sf.getLineAndCharacterOfPosition(n.getStart()).line;
        missing.push({ file: path.relative(ROOT, file), line: line + 1, kind: 'str', text: k });
      }
    }
    if (s && VI.test(s)) {
      const line = sf.getLineAndCharacterOfPosition(n.getStart()).line;
      const ignored = blocked.has(line) || /i18n-ignore/.test(lines[line]) || (line > 0 && /i18n-ignore/.test(lines[line - 1]));
      if (keys.has(s)) used.add(s);
      else if (!ignored && !(ts.isPropertyAssignment(n.parent) && n.parent.name === n) && !inKeywords(n)) {
        const kind = ts.isJsxText(n) ? 'jsx' : ts.isTemplateExpression(n) ? 'tpl' : 'str';
        missing.push({ file: path.relative(ROOT, file), line: line + 1, kind, text: s });
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify([...new Set(missing.filter((m) => m.kind === 'str').map((m) => m.text))], null, 1));
} else {
  for (const m of missing) console.log(`${m.file}:${m.line} [${m.kind}] ${m.text}`);
  const stale = [...keys.keys()].filter((k) => !used.has(k));
  if (process.argv.includes('--stale')) for (const k of stale) console.log(`stale: ${k}`);
  console.log(`\n${missing.length} untranslated, ${keys.size} keys, ${stale.length} unused`);
}
process.exitCode = missing.length ? 1 : 0;
