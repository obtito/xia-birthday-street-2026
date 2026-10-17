import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
let html = await readFile(resolve(dist, 'index.html'), 'utf8');
const css = await readFile(resolve(dist, 'styles.css'), 'utf8');
const js = await readFile(resolve(dist, 'app.js'), 'utf8');
html = html.replace('<link rel="stylesheet" href="styles.css">', () => `<style>${css}</style>`);
html = html.replace('<script src="app.js" defer></script>', '');
const mime = { '.svg': 'image/svg+xml', '.png': 'image/png' };
for (const match of [...html.matchAll(/(?:src|href)="(assets\/[^"]+)"/g)]) {
  const path = match[1];
  const bytes = await readFile(resolve(dist, path));
  const uri = `data:${mime[extname(path)]};base64,${bytes.toString('base64')}`;
  html = html.replaceAll(`"${path}"`, `"${uri}"`);
}
html = html.replace('</body>', () => `<script>${js}</script>\n</body>`);
if (/(?:src|href)="(?:assets\/|styles\.css|app\.js)/.test(html)) throw new Error('Unresolved offline dependency');
const destination = resolve(root, '夏夏的生日小街.html');
await writeFile(destination, html);
console.log(`Offline website exported: ${destination}`);
console.log(`Self-contained document: ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MiB; no network resources.`);
