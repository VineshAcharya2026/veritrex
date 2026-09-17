/**
 * Derive brand assets from AI-generated Veritrex logo sources.
 *
 * Usage: node scripts/generate-brand-assets.mjs
 */
import sharp from "sharp";
import { mkdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const MARK_SOURCE = join(root, "veritrex", "veritrex-mark-source.png");
const LOCKUP_SOURCE = join(root, "veritrex", "veritrex-lockup-source.png");
const WORDMARK_SOURCE = join(root, "veritrex", "veritrex-wordmark-source.png");
const OUT_DIR = join(root, "public", "brand");

const BLACK = { r: 0, g: 0, b: 0 };

function flattenBlack(pipeline) {
  return pipeline.flatten({ background: BLACK });
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const lockupMeta = await sharp(LOCKUP_SOURCE).metadata();
  const wordmarkMeta = await sharp(WORDMARK_SOURCE).metadata();
  console.log(`Lockup source: ${lockupMeta.width}x${lockupMeta.height}`);
  console.log(`Wordmark source: ${wordmarkMeta.width}x${wordmarkMeta.height}`);

  const markBase = flattenBlack(sharp(MARK_SOURCE).resize(512, 512, { fit: "contain", background: BLACK }));
  for (const size of [512, 192, 96, 32]) {
    await markBase.clone().resize(size, size).png().toFile(join(OUT_DIR, `mark-${size}.png`));
  }

  for (const width of [1200, 800, 480]) {
    const height = Math.round((width / lockupMeta.width) * lockupMeta.height);
    await flattenBlack(sharp(LOCKUP_SOURCE).resize(width, height, { fit: "inside", background: BLACK }))
      .png()
      .toFile(join(OUT_DIR, `lockup-${width}.png`));
  }

  const wordmarkBuffer = await flattenBlack(
    sharp(WORDMARK_SOURCE).resize(1200, null, { fit: "inside", background: BLACK })
  )
    .png()
    .toBuffer();
  const wmMeta = await sharp(wordmarkBuffer).metadata();

  for (const width of [720, 480, 320, 240]) {
    const height = Math.round((width / wmMeta.width) * wmMeta.height);
    await sharp(wordmarkBuffer).resize(width, height).png().toFile(join(OUT_DIR, `wordmark-${width}.png`));
  }

  // App icons
  await sharp(MARK_SOURCE)
    .resize(512, 512, { fit: "contain", background: BLACK })
    .png()
    .toFile(join(root, "app", "icon.png"));
  copyFileSync(join(root, "app", "icon.png"), join(root, "app", "apple-icon.png"));

  console.log("Brand assets generated in public/brand/");
  console.log(`Suggested LOCKUP_ASPECT = ${lockupMeta.width} / ${lockupMeta.height}`);
  console.log(`Suggested WORDMARK_ASPECT = ${wmMeta.width} / ${wmMeta.height}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
