import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import nunjucks from 'nunjucks';
import { loadTemplateData, updateAssetPaths } from './build-utils.js';

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
    // Load all template data
    const dataDir = path.join(__dirname, 'resources/data');
    const templateData = await loadTemplateData(dataDir);

    // Configure Nunjucks
    const viewsPath = path.join(__dirname, 'resources/views');
    const env = nunjucks.configure(viewsPath, {
      autoescape: false,
      noCache: false,
    });

    // Render the template
    const templatePath = path.join(viewsPath, 'index.html');
    const html = env.render(templatePath, templateData);

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

    // Update asset paths in HTML
    const updatedHtml = updateAssetPaths(html, cssPath, jsPath);

    fs.writeFileSync(path.join(distDir, 'index.html'), updatedHtml);

    // Copy images to dist
    await copyImages(distDir);

    // Optimize images
    await optimizeImages(distDir);
    
    console.log('✓ Build completed successfully');
  } catch (error) {
    console.error('✗ Build failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
})();

/**
 * Copy images from resources/images to dist/images
 */
async function copyImages(distDir) {
  const sourceImagesDir = path.join(__dirname, 'resources/images');
  const destImagesDir = path.join(distDir, 'images');

  if (!fs.existsSync(sourceImagesDir)) {
    console.warn('⚠ Images directory not found:', sourceImagesDir);
    return;
  }

  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destImagesDir)) {
    fs.mkdirSync(destImagesDir, { recursive: true });
  }

  // Copy all files from source to destination
  const files = fs.readdirSync(sourceImagesDir);
  let copiedCount = 0;
  
  for (const file of files) {
    const sourcePath = path.join(sourceImagesDir, file);
    const destPath = path.join(destImagesDir, file);
    
    // Skip directories and hidden files
    if (fs.statSync(sourcePath).isDirectory() || file.startsWith('.')) {
      continue;
    }

    fs.copyFileSync(sourcePath, destPath);
    copiedCount++;
  }

  if (copiedCount > 0) {
    console.log(`✓ Copied ${copiedCount} image(s) to dist/images`);
  }
}

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
        // Optimize PNG - preserve transparency
        const image = sharp(filePath);
        const metadata = await image.metadata();
        
        // Ensure alpha channel is preserved if it exists
        const buffer = await image
          .ensureAlpha()
          .png({
            quality: 90,
            compressionLevel: 9,
            adaptiveFiltering: true,
            palette: metadata.hasAlpha ? false : undefined
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
        console.log(`✓ Optimized ${file}: saved ${saved}%`);
      }
    } catch (error) {
      console.error(`✗ Failed to optimize ${file}:`, error.message);
    }
  }
}

