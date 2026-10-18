const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none">
  <defs>
    <linearGradient id="heroGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF0B3" />
      <stop offset="30%" stop-color="#F5DC9A" />
      <stop offset="60%" stop-color="#D4AF37" />
      <stop offset="100%" stop-color="#9A7426" />
    </linearGradient>
  </defs>

  <!-- Oxford Navy Rounded Square Base -->
  <rect
    x="2"
    y="2"
    width="36"
    height="36"
    rx="9"
    fill="#142236"
    stroke="url(#heroGold)"
    stroke-width="1.4"
  />

  <!-- HERO QUILL FEATHER (The Main Centerpiece Highlight) -->
  <path
    d="M29 6C26 8 21 13 17 19C16 20.5 17 21 18.5 20.5C21 19 25 15 27 11.5M29 6C31 8 31 11.5 28.5 14C26.5 16 23 17.5 20.5 18.5M29 6C28 11 23 18 13 28L10 31L13 28C17 24 22 17 29 6Z"
    fill="url(#heroGold)"
  />

  <!-- Central Gilded Quill Shaft / Rachis -->
  <line
    x1="29"
    y1="6"
    x2="10.5"
    y2="30.5"
    stroke="#FFF0B3"
    stroke-width="1.3"
    stroke-linecap="round"
  />

  <!-- Calligraphic Nib Tip Poised at the Bottom-Left -->
  <polygon points="10.5,30.5 9,33 13,31.5" fill="url(#heroGold)" />

  <!-- Flanking Serif Initials: 'R' Top-Left, 'D' Bottom-Right -->
  <text
    x="11.5"
    y="16.5"
    font-family="Georgia, serif"
    font-size="11.5"
    font-weight="bold"
    fill="url(#heroGold)"
    text-anchor="middle"
  >R</text>

  <text
    x="26.5"
    y="32.5"
    font-family="Georgia, serif"
    font-size="11.5"
    font-weight="bold"
    fill="url(#heroGold)"
    text-anchor="middle"
  >D</text>
</svg>`;

// Helper function to create an ICO file from an array of PNG buffers
function createIco(images) {
  // images: [{ width, height, buffer }]
  const count = images.length;
  const headerSize = 6;
  const entrySize = 16;
  const entriesOffset = headerSize;
  const dataOffset = headerSize + count * entrySize;

  let currentOffset = dataOffset;
  const entries = [];

  for (const img of images) {
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0); // width
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1); // height
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // size of image data
    entry.writeUInt32LE(currentOffset, 12); // offset of image data

    entries.push(entry);
    currentOffset += img.buffer.length;
  }

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // icon type (1 = ICO)
  header.writeUInt16LE(count, 4); // number of images

  return Buffer.concat([header, ...entries, ...images.map(img => img.buffer)]);
}

async function generate() {
  const publicDir = path.resolve(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Write the clean SVG favicon
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf8');
  console.log('✓ Created public/favicon.svg');

  const svgBuffer = Buffer.from(svgContent);

  // 2. Generate PNGs at various resolutions
  const p16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
  const p32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  const p48 = await sharp(svgBuffer).resize(48, 48).png().toBuffer();
  const p64 = await sharp(svgBuffer).resize(64, 64).png().toBuffer();
  const p180 = await sharp(svgBuffer).resize(180, 180).png().toBuffer();
  const p192 = await sharp(svgBuffer).resize(192, 192).png().toBuffer();
  const p512 = await sharp(svgBuffer).resize(512, 512).png().toBuffer();

  // 3. Write apple-touch-icon.png (180x180 standard)
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), p180);
  console.log('✓ Created public/apple-touch-icon.png (180x180)');

  // 4. Write standard favicon.png (192x192 and 32x32)
  fs.writeFileSync(path.join(publicDir, 'favicon.png'), p192);
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), p32);
  fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), p16);
  console.log('✓ Created public/favicon.png & public/favicon-32x32.png');

  // 5. Build multi-resolution ICO file (16x16, 32x32, 48x48)
  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: p16 },
    { width: 32, height: 32, buffer: p32 },
    { width: 48, height: 48, buffer: p48 }
  ]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log('✓ Created public/favicon.ico (multi-resolution 16/32/48)');
}

generate().catch(console.error);
