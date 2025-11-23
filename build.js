import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import sharp from 'sharp';
import nunjucks from 'nunjucks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Process Nunjucks templates and build
(async () => {
  try {
    // Load tools data
    const toolsPath = path.join(__dirname, 'resources/data/tools.js');
    const toolsModule = await import(pathToFileURL(toolsPath).href);
    const tools = toolsModule.tools;

    // Configure Nunjucks
    const viewsPath = path.join(__dirname, 'resources/views');
    const env = nunjucks.configure(viewsPath, {
      autoescape: false,
      noCache: false,
    });

    // Render the template
    const templatePath = path.join(viewsPath, 'index.html');
    const html = env.render(templatePath, { tools });

    // Find actual built asset files from Vite
    const assetsDir = path.join(distDir, 'assets');
    let cssPath = './assets/index.css';
    let jsPath = './assets/index.js';

    if (fs.existsSync(assetsDir)) {
      const files = fs.readdirSync(assetsDir);
      const cssFile = files.find(f => f.endsWith('.css'));
      const jsFile = files.find(f => f.endsWith('.js'));

      if (cssFile) {
        cssPath = `./assets/${cssFile}`;
      }
      if (jsFile) {
        jsPath = `./assets/${jsFile}`;
      }
    }

    // Update asset paths in HTML - replace development paths with built asset paths
    const updatedHtml = html
      // Replace CSS path
      .replace(/href="[^"]*\/resources\/css\/[^"]*"/g, `href="${cssPath}"`)
      // Replace JS path
      .replace(/src="[^"]*\/resources\/js\/[^"]*"/g, `src="${jsPath}"`)
      // Replace image paths to use relative paths
      .replace(/src="\/images\/([^"]+)"/g, `src="./images/$1"`)
      // Also replace any absolute paths that might already exist
      .replace(/href="\/assets\/([^"]+)"/g, `href="./assets/$1"`)
      .replace(/src="\/assets\/([^"]+)"/g, `src="./assets/$1"`);

    fs.writeFileSync(path.join(distDir, 'index.html'), updatedHtml);


    // Optimize images
    await optimizeImages(distDir);
  } catch (error) {
    process.exit(1);
  }
})();

/**
 * Optimize images in the dist/images directory
 */
async function optimizeImages(distDir) {
  const imagesDir = path.join(distDir, 'images');

  if (!fs.existsSync(imagesDir)) {
    return;
  }

  const files = fs.readdirSync(imagesDir);
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp'];


  for (const file of files) {
    const filePath = path.join(imagesDir, file);
    const ext = path.extname(file).toLowerCase();

    // Skip SVG files (they're already optimized text files)
    if (ext === '.svg') {
      continue;
    }

    // Only optimize supported image formats
    if (!imageExtensions.includes(ext)) {
      continue;
    }

    try {
      const stats = fs.statSync(filePath);
      const originalSize = stats.size;

      let optimized = false;

      if (ext === '.png') {
        // Optimize PNG
        const buffer = await sharp(filePath)
          .png({
            quality: 90,
            compressionLevel: 9,
            adaptiveFiltering: true
          })
          .toBuffer();

        if (buffer.length < originalSize) {
          fs.writeFileSync(filePath, buffer);
          optimized = true;
        }
      } else if (ext === '.jpg' || ext === '.jpeg') {
        // Optimize JPEG
        const buffer = await sharp(filePath)
          .jpeg({
            quality: 85,
            mozjpeg: true
          })
          .toBuffer();

        if (buffer.length < originalSize) {
          fs.writeFileSync(filePath, buffer);
          optimized = true;
        }
      } else if (ext === '.webp') {
        // Optimize WebP
        const buffer = await sharp(filePath)
          .webp({
            quality: 85
          })
          .toBuffer();

        if (buffer.length < originalSize) {
          fs.writeFileSync(filePath, buffer);
          optimized = true;
        }
      }

      if (optimized) {
        const newStats = fs.statSync(filePath);
        const saved = ((originalSize - newStats.size) / originalSize * 100).toFixed(1);
      } else {
        console.log('Image already optimized');
      }
    } catch (error) {
      console.error(error.message);
    }
  }
}

