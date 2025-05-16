const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, size, size);

  // Emoji
  ctx.font = `${size * 0.7}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🏍️', size / 2, size / 2);

  return canvas.toBuffer('image/png');
}

// Generate icons
const sizes = [16, 32, 64, 192, 512];
sizes.forEach(size => {
  const buffer = generateIcon(size);
  fs.writeFileSync(path.join(__dirname, '..', 'public', `logo${size}.png`), buffer);
});

// Generate favicon.ico (16x16)
const faviconBuffer = generateIcon(16);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.ico'), faviconBuffer); 