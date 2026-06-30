/**
 * Copia os ícones de icon/ → resources/ no formato do @capacitor/assets.
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'icon');
const outDir = join(root, 'resources');

const APP_BACKGROUND = '#F5F0EA';

async function upscale(src, dest, size) {
  await sharp(join(srcDir, src))
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(outDir, dest));
  console.log(`  ${dest} (${size}×${size})`);
}

await mkdir(outDir, { recursive: true });
console.log('Preparando resources/ a partir de icon/…');

await upscale('ic_laucher_foreground.png', 'icon-foreground.png', 1024);
await upscale('ic_laucher_background.png', 'icon-background.png', 1024);
await upscale('play_store_512.png', 'icon-only.png', 1024);

// Splash: logo centralizado sobre fundo do app
const logo = await sharp(join(srcDir, 'play_store_512.png'))
  .resize(820, 820, { fit: 'contain' })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: 2732,
    height: 2732,
    channels: 4,
    background: APP_BACKGROUND,
  },
})
  .composite([{ input: logo, gravity: 'center' }])
  .png()
  .toFile(join(outDir, 'splash.png'));

console.log('  splash.png (2732×2732)');
console.log('Pronto.');
