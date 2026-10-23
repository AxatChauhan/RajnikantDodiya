const fs = require('fs');
const path = require('path');
const sharp = require('../node_modules/sharp');

const inputPath = 'C:/Users/DELL/.gemini/antigravity/brain/c6c0d83b-a439-4809-bc3e-9fe8251576e4/.user_uploaded/media_1792763943321_2c4ecadd.jpg';
const publicDir = path.resolve('public');

async function processIcons() {
  console.log('Processing user photo for logos and favicons...');

  // 1. Copy full portrait
  await sharp(inputPath)
    .jpeg({ quality: 95 })
    .toFile(path.join(publicDir, 'dr-rajnikant-dodiya.jpg'));
  console.log('Saved dr-rajnikant-dodiya.jpg');

  // 2. High-res logo
  await sharp(inputPath)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'logo.png'));
  console.log('Saved logo.png');

  // 3. Apple Touch Icon (180x180)
  await sharp(inputPath)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Saved apple-touch-icon.png');

  // 4. Favicon 32x32
  await sharp(inputPath)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('Saved favicon-32x32.png');

  // 5. Favicon 16x16
  await sharp(inputPath)
    .resize(16, 16)
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));
  console.log('Saved favicon-16x16.png');

  // 6. Favicon 512x512
  await sharp(inputPath)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Saved favicon.png');

  // 7. Favicon ICO (using 32x32 PNG buffer)
  const icoBuf = await sharp(inputPath).resize(32, 32).png().toBuffer();
  // Simple ICO header containing one 32x32 PNG
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // ICO type
  icoHeader.writeUInt16LE(1, 4); // 1 image

  const icoEntry = Buffer.alloc(16);
  icoEntry.writeUInt8(32, 0); // Width
  icoEntry.writeUInt8(32, 1); // Height
  icoEntry.writeUInt8(0, 2);  // Palette count
  icoEntry.writeUInt8(0, 3);  // Reserved
  icoEntry.writeUInt16LE(1, 4); // Color planes
  icoEntry.writeUInt16LE(32, 6); // Bits per pixel
  icoEntry.writeUInt32LE(icoBuf.length, 8); // Size of image data
  icoEntry.writeUInt32LE(22, 12); // Offset of image data (6 + 16 = 22)

  const finalIco = Buffer.concat([icoHeader, icoEntry, icoBuf]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), finalIco);
  console.log('Saved favicon.ico');

  // 8. Favicon SVG (with base64 embedded image)
  const b64 = (await sharp(inputPath).resize(128, 128).png().toBuffer()).toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <clipPath id="circleClip">
    <circle cx="64" cy="64" r="62" />
  </clipPath>
  <circle cx="64" cy="64" r="63" fill="#800020" stroke="#C5A059" stroke-width="2" />
  <image href="data:image/png;base64,${b64}" x="2" y="2" width="124" height="124" clip-path="url(#circleClip)" />
</svg>`;
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);
  console.log('Saved favicon.svg');

  console.log('ALL ICONS GENERATED SUCCESSFULLY!');
}

processIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
