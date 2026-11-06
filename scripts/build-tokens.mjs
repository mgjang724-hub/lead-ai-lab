// design-system/tokens.json → styles/tokens.css
// 디자인 시스템의 토큰을 CSS 커스텀 프로퍼티로 변환합니다. (npm run tokens — build 전에 자동 실행)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(path.join(root, 'design-system/tokens.json'), 'utf8'));

const lines = [];
const out = (s = '') => lines.push(s);

const resolve = (v) => (typeof v === 'string' ? v.replace(/\{([a-z0-9-]+)\}/g, 'var(--$1)') : v);
const themeValue = (v, theme) => (v && typeof v === 'object' ? v[theme] : v);

out(`/* Generated from design-system/tokens.json — do not edit by hand. Run \`npm run tokens\`. */`);
out();

// @font-face — self-hosted variable fonts (public/fonts)
for (const f of tokens.type.fonts) {
  const file = f.file.replace(/^fonts\//, '/fonts/');
  out(`@font-face { font-family: "${f.family}"; src: url("${file}") format("woff2"); font-weight: ${f.weight}; font-style: ${f.style}; font-display: swap; }`);
}
out();

// :root — primitives, semantic (light), type families, spacing, radius, shadow, border, layout, motion, z
out(':root {');
out('  color-scheme: light;');
out(`  --font-display: ${tokens.type.families.display};`);
out(`  --font-sans: ${tokens.type.families.sans};`);
for (const t of tokens.color.tokens) out(`  --${t.name}: ${resolve(themeValue(t.value, 'light'))};`);
for (const group of ['spacing', 'radius', 'borderWidth', 'layout', 'duration', 'easing', 'zIndex']) {
  for (const t of tokens[group].tokens) out(`  --${t.name}: ${resolve(themeValue(t.value, 'light'))};`);
}
for (const t of tokens.shadow.tokens) out(`  --${t.name}: ${resolve(themeValue(t.value, 'light'))};`);
for (const t of tokens.breakpoint.tokens) out(`  --${t.name}: ${t.value};`);
out('}');
out();

// dark theme — only tokens whose value differs
out(':root[data-theme="dark"] {');
out('  color-scheme: dark;');
for (const t of [...tokens.color.tokens, ...tokens.shadow.tokens]) {
  if (t.value && typeof t.value === 'object' && t.value.dark !== t.value.light) {
    out(`  --${t.name}: ${resolve(t.value.dark)};`);
  }
}
out('}');
out();

// fixed type sizes as reference variables (fluid clamp() values live in components.css)
out(':root {');
for (const g of tokens.type.groups) {
  for (const s of g.styles) {
    out(`  --fs-${s.name}: ${s.fontSize}; --lh-${s.name}: ${s.lineHeight}; --fw-${s.name}: ${s.fontWeight}; --ls-${s.name}: ${s.letterSpacing};`);
  }
}
out('}');

writeFileSync(path.join(root, 'styles/tokens.css'), lines.join('\n') + '\n');
console.log(`[tokens] styles/tokens.css — ${tokens.color.tokens.length} color tokens, ${lines.length} lines`);
