import { readFile, access, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const html = await readFile(resolve(dist, 'index.html'), 'utf8');
const script = await readFile(resolve(dist, 'app.js'), 'utf8');
const css = await readFile(resolve(dist, 'styles.css'), 'utf8');
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
check(new Set(ids).size === ids.length, 'Duplicate HTML IDs');
check(html.includes('lang="zh-CN"'), 'Missing Chinese language declaration');
check((html.match(/<h1\b/g) || []).length === 1, 'There must be one H1');
for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  const value = match[1];
  if (/^(https?:|data:|mailto:|blob:)/.test(value)) continue;
  try { await access(resolve(dist, value)); } catch { failures.push(`Missing local resource: ${value}`); }
}
for (const match of html.matchAll(/href="#([^"]+)"/g)) check(ids.includes(match[1]), `Broken section link: ${match[1]}`);
for (const match of html.matchAll(/<img\b([^>]+)>/g)) check(/\balt="[^"]*"/.test(match[1]), 'Image without alt text');
for (const match of html.matchAll(/<button\b([^>]+)>/g)) check(/\btype="button"/.test(match[1]), 'Button without an explicit type');
for (const match of script.matchAll(/\$\('([^']+)'\)/g)) check(ids.includes(match[1]), `Script references missing element: ${match[1]}`);
try { new vm.Script(script); } catch (error) { failures.push(`JavaScript syntax: ${error.message}`); }
check(css.includes('prefers-reduced-motion'), 'Missing reduced-motion support');
check(!/fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/.test(script), 'Unexpected network/data transmission API');
check(!/\b(?:src|href)="https?:\/\//.test(html), 'Unexpected external page dependency');
const assets = await readdir(resolve(dist, 'assets'));
check(assets.includes('street-watercolor.png'), 'Missing generated street illustration');
try {
  const manifest = JSON.parse(await readFile(resolve(root, '.openai/hosting.json'), 'utf8'));
  check(!!manifest.project_id && manifest.static?.directory === 'dist', 'Invalid local Sites hosting manifest');
} catch (error) {
  if (error.code !== 'ENOENT') failures.push(`Local hosting manifest: ${error.message}`);
}
const workflow = await readFile(resolve(root, '.github/workflows/pages.yml'), 'utf8');
check(workflow.includes('path: dist') && workflow.includes('actions/deploy-pages@'), 'Invalid GitHub Pages workflow');
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`Passed: JavaScript syntax, ${ids.length} unique IDs, all local resources and section links, image alternatives, button types, controller references, motion preferences, and Pages deployment configuration.`);
console.log('No external runtime dependencies or data-transmission calls.');
