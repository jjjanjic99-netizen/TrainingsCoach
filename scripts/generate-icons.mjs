// Erzeugt alle benötigten PWA-Icons aus einem SVG-Motiv.
// Aufruf: `npm run icons`
//
// Ausgabe:
//   public/icons/icon-192.png        (any)
//   public/icons/icon-512.png        (any)
//   public/icons/maskable-192.png    (maskable, mit Safe-Zone-Padding)
//   public/icons/maskable-512.png    (maskable)
//   public/icons/apple-touch-icon.png (180x180, opaker Hintergrund für iOS)
//   app/icon.png                     (Favicon, von Next automatisch genutzt)

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// Farben (passend zum Theme in app/globals.css)
const BG_DARK = "#0b1220";
const BG_DARK_2 = "#161f36";
const LIME = "#a3e635"; // Akzent (lime-400)
const SKY = "#38bdf8"; // Sekundärakzent (sky-400)

/**
 * Baut das Icon-SVG.
 * @param {number} contentScale  1 = randlos, <1 = eingerückt (für maskable Safe-Zone)
 */
function iconSvg(contentScale = 1) {
  const S = 512;
  const c = S / 2;
  // Motiv: monogrammartiges „H" (Hyrox) mit Speed-Chevrons.
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${BG_DARK}"/>
      <stop offset="1" stop-color="${BG_DARK_2}"/>
    </linearGradient>
  </defs>
  <rect width="${S}" height="${S}" fill="url(#bg)"/>
  <g transform="translate(${c} ${c}) scale(${contentScale}) translate(${-c} ${-c})">
    <!-- Speed-Chevrons -->
    <g fill="none" stroke="${SKY}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" opacity="0.85">
      <path d="M96 200 L150 256 L96 312"/>
      <path d="M416 200 L362 256 L416 312"/>
    </g>
    <!-- „H" -->
    <g fill="${LIME}">
      <rect x="176" y="150" width="46" height="212" rx="12"/>
      <rect x="290" y="150" width="46" height="212" rx="12"/>
      <rect x="176" y="233" width="160" height="46" rx="12"/>
    </g>
  </g>
</svg>`.trim();
}

async function render(svg, size, outPath) {
  const full = resolve(root, outPath);
  await mkdir(dirname(full), { recursive: true });
  const png = await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toBuffer();
  await writeFile(full, png);
  console.log("✓", outPath, `(${size}x${size})`);
}

async function main() {
  const any = iconSvg(1);
  const maskable = iconSvg(0.72); // Inhalt in der Safe-Zone halten

  await render(any, 192, "public/icons/icon-192.png");
  await render(any, 512, "public/icons/icon-512.png");
  await render(maskable, 192, "public/icons/maskable-192.png");
  await render(maskable, 512, "public/icons/maskable-512.png");
  await render(any, 180, "public/icons/apple-touch-icon.png");
  await render(any, 256, "app/icon.png");

  console.log("\nAlle Icons erzeugt.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
