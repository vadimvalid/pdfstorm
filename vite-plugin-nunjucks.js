import { readFileSync, existsSync, statSync } from 'fs';
import { resolve, extname } from 'path';
import nunjucks from 'nunjucks';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { loadTemplateData } from './build-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MIME types for images
const mimeTypes = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

export function nunjucksPlugin() {
  return {
    name: 'nunjucks',
    configureServer(server) {
      // Serve images from resources/images at /images path
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/images/')) {
          const imagePath = resolve(__dirname, 'resources/images', req.url.replace('/images/', ''));
          
          if (existsSync(imagePath) && statSync(imagePath).isFile()) {
            const ext = extname(imagePath).toLowerCase();
            const mimeType = mimeTypes[ext] || 'application/octet-stream';
            
            try {
              const fileContent = readFileSync(imagePath);
              res.setHeader('Content-Type', mimeType);
              res.setHeader('Cache-Control', 'public, max-age=3600');
              res.end(fileContent);
              return;
            } catch (error) {
              console.error('Error serving image:', error);
            }
          }
        }
        next();
      });

      // Intercept requests for index.html
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/' || req.url === '/index.html') {
          try {
            const viewsPath = resolve(__dirname, 'resources/views');
            const env = nunjucks.configure(viewsPath, {
              autoescape: false,
              noCache: true,
            });

            // Load all template data
            const dataPath = resolve(__dirname, 'resources/data');
            const templateData = await loadTemplateData(dataPath);

            // Render the template
            const template = readFileSync(resolve(viewsPath, 'index.html'), 'utf-8');
            const html = env.renderString(template, templateData);

            res.setHeader('Content-Type', 'text/html');
            res.end(html);
          } catch (error) {
            console.error('Error rendering Nunjucks template:', error);
            next();
          }
        } else {
          next();
        }
      });
    },
  };
}

