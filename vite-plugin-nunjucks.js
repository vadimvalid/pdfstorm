import { readFileSync } from 'fs';
import { resolve } from 'path';
import nunjucks from 'nunjucks';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function nunjucksPlugin() {
  return {
    name: 'nunjucks',
    configureServer(server) {
      // Intercept requests for index.html
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/' || req.url === '/index.html') {
          try {
            const viewsPath = resolve(__dirname, 'resources/views');
            const env = nunjucks.configure(viewsPath, {
              autoescape: false,
              noCache: true,
            });

            // Load tools data
            const toolsPath = resolve(__dirname, 'resources/data/tools.js');
            const toolsModule = await import(pathToFileURL(toolsPath).href);
            const tools = toolsModule.tools;

            // Render the template
            const template = readFileSync(resolve(viewsPath, 'index.html'), 'utf-8');
            const html = env.renderString(template, { tools });

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

