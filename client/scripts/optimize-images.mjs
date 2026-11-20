// One-off: converts large PNG/JPG in public/images to resized WebP and rewrites references in src + index.html + manifest.
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const root = path.resolve('public/images');
const MAX_W = 1600;
const converted = [];

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]
  );

for (const f of walk(root)) {
  const ext = path.extname(f).toLowerCase();
  if (!['.png', '.jpg', '.jpeg'].includes(ext)) continue;
  if (fs.statSync(f).size < 100 * 1024) continue;
  const out = f.slice(0, -ext.length) + '.webp';
  await sharp(f).rotate().resize({ width: MAX_W, withoutEnlargement: true }).webp({ quality: 80 }).toFile(out);
  const before = fs.statSync(f).size, after = fs.statSync(out).size;
  console.log(path.basename(f), (before / 1024) | 0, 'KB ->', (after / 1024) | 0, 'KB');
  converted.push({ old: path.basename(f), neu: path.basename(out) });
  fs.unlinkSync(f);
}

const files = [
  ...walk(path.resolve('src')).filter((p) => /\.(tsx?|css)$/.test(p)),
  path.resolve('index.html'),
];
converted.sort((a, b) => b.old.length - a.old.length);
for (const file of files) {
  let t = fs.readFileSync(file, 'utf8'), o = t;
  for (const { old, neu } of converted) t = t.split(old).join(neu);
  if (t !== o) { fs.writeFileSync(file, t); console.log('updated', path.relative('.', file)); }
}

