const { argv } = require('process');
const fs = require('fs');

const { createCanvas, Image } = require('canvas');

// Extract parameters
const filePath = argv[2];
const options = JSON.parse(argv[3].replace(/'/g, '"'));
const images = argv.slice(4);

// Create canvas (use dpi factor to make image larger - it will always be at 96 dpi)
const canvasWidth = options.spacing.left + (options.width * options.imageWidth) + ((options.width - 1) * options.spacing.betweenImages) + options.spacing.right;
const canvasHeight = options.spacing.top + (options.height * options.imageHeight) + ((options.height - 1) * options.spacing.betweenImages) + options.spacing.bottom;

const dpiFactor = Math.ceil((options.dpi || 96) / 96);
const canvas = createCanvas(canvasWidth * dpiFactor, canvasHeight * dpiFactor)

// Draw background
const ctx = canvas.getContext("2d");
ctx.scale(dpiFactor, dpiFactor); // Scale by the dpi factor, so all other actions should still work
ctx.fillStyle = options.backgroundColor || '#ffffff';
ctx.fillRect(0, 0, canvasWidth, canvasHeight);

// Draw images
const maxImages = options.width * options.height;
for (let i = 0; i < images.length && i < maxImages; i++) {
    const source = images[i];

    const img = new Image();
    img.src = fs.readFileSync(source);

    const x = options.spacing.left + ((i % options.width) * (options.imageWidth + options.spacing.betweenImages));
    const y = options.spacing.top + (Math.floor(i / options.width) * (options.imageHeight + options.spacing.betweenImages));

    // Shrink image to the available space
    const hRatio = options.imageWidth / img.width;
    const vRatio = options.imageHeight / img.height;
    const ratio  = Math.min(hRatio, vRatio);

    const targetWidth = img.width * ratio;
    const targetHeight = img.height * ratio;

    // Position in the middle/middle of the available space
    const xMiddle = x + ((options.imageWidth - targetWidth) / 2);
    const yMiddle = y + ((options.imageHeight - targetHeight) / 2);
    ctx.drawImage(img, 0, 0, img.width, img.height,
                       xMiddle, yMiddle, targetWidth, targetHeight);
}

// Write output
const stream = canvas.createJPEGStream({ quality: 100 });
const writable = fs.createWriteStream(filePath);
stream.pipe(writable);