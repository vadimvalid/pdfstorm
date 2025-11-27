import { pathToFileURL } from 'url';
import path from 'path';

/**
 * Load all data files needed for Nunjucks templates
 */
export async function loadTemplateData(dataDir) {
  const toolsModule = await import(pathToFileURL(path.join(dataDir, 'tools.js')).href);
  const servicesModule = await import(pathToFileURL(path.join(dataDir, 'services.js')).href);
  const tabsModule = await import(pathToFileURL(path.join(dataDir, 'tabs.js')).href);

  return {
    tools: toolsModule.tools,
    services: servicesModule.services,
    tabs: tabsModule.tabs
  };
}

/**
 * Replace asset paths in HTML with production paths
 * Uses a more robust approach than regex
 */
export function updateAssetPaths(html, cssPath, jsPath) {
  // Replace CSS link tags
  html = html.replace(
    /<link[^>]+href=["']([^"']*\/resources\/css\/[^"']*)["'][^>]*>/gi,
    (match, href) => match.replace(href, cssPath)
  );

  // Replace JS script tags
  html = html.replace(
    /<script[^>]+src=["']([^"']*\/resources\/js\/[^"']*)["'][^>]*>/gi,
    (match, src) => match.replace(src, jsPath)
  );

  // Replace image paths (handle both src and srcset)
  html = html.replace(
    /(src|srcset)=["']\/images\/([^"']+)["']/gi,
    (match, attr, imagePath) => `${attr}="./images/${imagePath}"`
  );

  // Replace asset paths (handle both href and src)
  html = html.replace(
    /(href|src)=["']\/assets\/([^"']+)["']/gi,
    (match, attr, assetPath) => `${attr}="./assets/${assetPath}"`
  );

  return html;
}

