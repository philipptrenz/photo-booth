const { argv } = require('process');
const fs = require('fs');
const path = require('path');

const { createCanvas, Image } = require('canvas');

// Extract parameters
const filePath = argv[2];
const layoutAsString = new Buffer(argv[3], 'base64').toString('ascii');
const layout = JSON.parse(layoutAsString);
const optionsAsString = new Buffer(argv[4], 'base64').toString('ascii');
const options = JSON.parse(optionsAsString);
const images = argv.slice(5);

// Create canvas (use dpi factor to make image larger - it will always be at 96 dpi)
const canvasWidth = layout.spacing.left + (layout.width * layout.imageWidth) + ((layout.width - 1) * layout.spacing.betweenImages) + layout.spacing.right;
const canvasHeight = layout.spacing.top + (layout.height * layout.imageHeight) + ((layout.height - 1) * layout.spacing.betweenImages) + layout.spacing.bottom;

const dpiFactor = Math.ceil((layout.dpi || 96) / 96);
const canvas = createCanvas(canvasWidth * dpiFactor, canvasHeight * dpiFactor)

// Prepare context
const ctx = canvas.getContext("2d");
ctx.scale(dpiFactor, dpiFactor); // Scale by the dpi factor, so all other actions should still work

// Draw background
ctx.fillStyle = layout.backgroundColor || '#ffffff';
ctx.fillRect(0, 0, canvasWidth, canvasHeight);

// Draw images
const maxImages = layout.width * layout.height;
for (let i = 0; i < images.length && i < maxImages; i++) {
    const source = images[i];

    const img = new Image();
    img.src = fs.readFileSync(source);

    const x = layout.spacing.left + ((i % layout.width) * (layout.imageWidth + layout.spacing.betweenImages));
    const y = layout.spacing.top + (Math.floor(i / layout.width) * (layout.imageHeight + layout.spacing.betweenImages));

    // Shrink image to the available space
    const hRatio = layout.imageWidth / img.width;
    const vRatio = layout.imageHeight / img.height;
    const ratio  = Math.min(hRatio, vRatio);

    const targetWidth = img.width * ratio;
    const targetHeight = img.height * ratio;

    // Position in the middle/middle of the available space
    const xMiddle = x + ((layout.imageWidth - targetWidth) / 2);
    const yMiddle = y + ((layout.imageHeight - targetHeight) / 2);
    ctx.drawImage(img, 0, 0, img.width, img.height,
                       xMiddle, yMiddle, targetWidth, targetHeight);
}

// Draw overlay (with respect to outer spacing)
if (options.overlay) {
    const img = new Image();
    const overlayPath = path.join('../../', options.overlay.image);
    img.src = fs.readFileSync(overlayPath);

    let x = layout.spacing.left;
    switch (options.overlay.x || 'middle') {
        case 'middle':
            x = Math.floor((canvasWidth - img.width) / 2);
            break;
        case 'right':
            x = canvasWidth - layout.spacing.right - img.width;
            break;
    }

    let y = layout.spacing.top;
    switch (options.overlay.y || 'middle') {
        case 'middle':
            y = Math.floor((canvasHeight - img.height) / 2);
            break;
        case 'bottom':
            y = canvasHeight - layout.spacing.bottom - img.height;
            break;
    }

    ctx.drawImage(img, x, y, img.width, img.height);
}

// Grayscale
if (options.grayscale) {
    const id = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const data = id.data;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const y = 0.299 * r + 0.587 * g + 0.114 * b;
        data[i] = y;
        data[i + 1] = y;
        data[i + 2] = y;
    }

    ctx.putImageData(id, 0, 0);
}

// Write output
const stream = canvas.createJPEGStream({ quality: 100 });
const writable = fs.createWriteStream(filePath);
stream.pipe(writable);