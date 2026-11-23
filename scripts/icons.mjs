import sharp from 'sharp';
import { readFileSync } from 'node:fs';
const svg = readFileSync(new URL('../public/icons/icon.svg', import.meta.url));
const out = (n) => new URL(`../public/icons/${n}`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
await sharp(svg).resize(192, 192).png().toFile(out('icon-192.png'));
await sharp(svg).resize(512, 512).png().toFile(out('icon-512.png'));
await sharp(svg).resize(180, 180).png().toFile(out('apple-touch-icon.png'));
// maskable: safe zone ~80 % → ikona zmenšená na pozadí stejné barvy
const bg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" fill="#f6a821"/></svg>');
const inner = await sharp(svg).resize(400, 400).png().toBuffer();
await sharp(bg).composite([{ input: inner, left: 56, top: 56 }]).png().toFile(out('icon-maskable-512.png'));
console.log('icons ok');
