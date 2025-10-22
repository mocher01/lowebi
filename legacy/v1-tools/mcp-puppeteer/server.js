#!/usr/bin/env node

/**
 * Puppeteer MCP Server for Website Generator
 * Provides tools for testing and validating generated websites locally
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WebsiteTestServer {
  constructor() {
    this.browser = null;
    this.serverProcess = null;
    this.currentPort = 3000;
  }

  async startBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async startDevServer(siteName, port = 3000) {
    const sitePath = path.join(__dirname, '..', 'generated-sites', siteName);
    
    // Check if site exists
    try {
      await fs.access(sitePath);
    } catch (error) {
      throw new Error(`Site ${siteName} not found at ${sitePath}`);
    }

    // Kill any existing server
    if (this.serverProcess) {
      this.serverProcess.kill();
    }

    return new Promise((resolve, reject) => {
      // Start npm dev server
      this.serverProcess = spawn('npm', ['run', 'dev', '--', '--port', port.toString()], {
        cwd: sitePath,
        shell: true
      });

      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`[Dev Server] ${output}`);
        
        // Check if server is ready
        if (output.includes('Local:') || output.includes('ready')) {
          this.currentPort = port;
          setTimeout(() => resolve(port), 2000); // Give it 2 seconds to fully start
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        console.error(`[Dev Server Error] ${data.toString()}`);
      });

      this.serverProcess.on('error', (error) => {
        reject(error);
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        reject(new Error('Dev server failed to start within 30 seconds'));
      }, 30000);
    });
  }

  async stopDevServer() {
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = null;
    }
  }

  async captureScreenshot(url, outputPath) {
    const browser = await this.startBrowser();
    const page = await browser.newPage();
    
    try {
      await page.setViewport({ width: 1920, height: 1080 });
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.screenshot({ path: outputPath, fullPage: true });
      return outputPath;
    } finally {
      await page.close();
    }
  }

  async testSite(siteName, tests = ['responsive', 'navigation', 'performance']) {
    const results = {
      siteName,
      timestamp: new Date().toISOString(),
      tests: {}
    };

    const port = await this.startDevServer(siteName);
    const url = `http://localhost:${port}`;
    const browser = await this.startBrowser();
    const page = await browser.newPage();

    try {
      // Test responsive design
      if (tests.includes('responsive')) {
        results.tests.responsive = await this.testResponsive(page, url);
      }

      // Test navigation
      if (tests.includes('navigation')) {
        results.tests.navigation = await this.testNavigation(page, url);
      }

      // Test performance
      if (tests.includes('performance')) {
        results.tests.performance = await this.testPerformance(page, url);
      }

      // Test accessibility
      if (tests.includes('accessibility')) {
        results.tests.accessibility = await this.testAccessibility(page, url);
      }

      return results;
    } finally {
      await page.close();
    }
  }

  async testResponsive(page, url) {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ];

    const results = [];

    for (const viewport of viewports) {
      await page.setViewport({ width: viewport.width, height: viewport.height });
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      // Check if menu is visible/hidden appropriately
      const mobileMenuVisible = await page.$eval(
        '[data-mobile-menu], .mobile-menu, #mobile-menu',
        el => window.getComputedStyle(el).display !== 'none'
      ).catch(() => null);

      // Check if content is properly sized
      const contentOverflow = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });

      results.push({
        viewport: viewport.name,
        dimensions: `${viewport.width}x${viewport.height}`,
        mobileMenuVisible,
        hasHorizontalScroll: contentOverflow,
        passed: !contentOverflow
      });
    }

    return results;
  }

  async testNavigation(page, url) {
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Get all navigation links
    const links = await page.$$eval('nav a, .nav a, .navbar a', elements =>
      elements.map(el => ({
        text: el.textContent.trim(),
        href: el.href,
        target: el.target
      }))
    );

    const results = {
      linksFound: links.length,
      links: links,
      tested: []
    };

    // Test each internal link
    for (const link of links) {
      if (link.href.startsWith('http://localhost') || link.href.startsWith('/')) {
        try {
          const response = await page.goto(link.href, { 
            waitUntil: 'domcontentloaded',
            timeout: 10000 
          });
          
          results.tested.push({
            url: link.href,
            text: link.text,
            status: response.status(),
            success: response.ok()
          });
        } catch (error) {
          results.tested.push({
            url: link.href,
            text: link.text,
            error: error.message,
            success: false
          });
        }
      }
    }

    return results;
  }

  async testPerformance(page, url) {
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    const metrics = await page.evaluate(() => {
      const timing = performance.timing;
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime || 0
      };
    });

    // Get resource count and sizes
    const resources = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      const types = {};
      
      resources.forEach(resource => {
        const type = resource.name.split('.').pop().split('?')[0];
        if (!types[type]) {
          types[type] = { count: 0, size: 0 };
        }
        types[type].count++;
        types[type].size += resource.transferSize || 0;
      });
      
      return types;
    });

    return {
      metrics,
      resources,
      recommendations: this.getPerformanceRecommendations(metrics, resources)
    };
  }

  async testAccessibility(page, url) {
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    const results = await page.evaluate(() => {
      const checks = {
        hasLangAttribute: !!document.documentElement.lang,
        imagesHaveAlt: true,
        headingsInOrder: true,
        hasMainLandmark: !!document.querySelector('main'),
        hasNavLandmark: !!document.querySelector('nav'),
        formLabels: true
      };

      // Check images for alt text
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (!img.alt && !img.getAttribute('aria-label')) {
          checks.imagesHaveAlt = false;
        }
      });

      // Check heading hierarchy
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let lastLevel = 0;
      headings.forEach(heading => {
        const level = parseInt(heading.tagName[1]);
        if (level > lastLevel + 1) {
          checks.headingsInOrder = false;
        }
        lastLevel = level;
      });

      // Check form labels
      const inputs = document.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        if (input.type !== 'hidden' && !input.labels?.length && !input.getAttribute('aria-label')) {
          checks.formLabels = false;
        }
      });

      return checks;
    });

    return results;
  }

  getPerformanceRecommendations(metrics, resources) {
    const recommendations = [];

    if (metrics.domContentLoaded > 3000) {
      recommendations.push('DOM Content Loaded time is high (>3s). Consider optimizing JavaScript execution.');
    }

    if (metrics.loadComplete > 5000) {
      recommendations.push('Page load time is high (>5s). Consider optimizing resources and lazy loading.');
    }

    if (resources.js && resources.js.count > 10) {
      recommendations.push(`Too many JavaScript files (${resources.js.count}). Consider bundling.`);
    }

    if (resources.css && resources.css.count > 5) {
      recommendations.push(`Too many CSS files (${resources.css.count}). Consider bundling.`);
    }

    return recommendations;
  }
}

// Create MCP server
const server = new Server(
  {
    name: 'website-generator-puppeteer',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const testServer = new WebsiteTestServer();

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'test_generated_site',
        description: 'Test a generated website for responsive design, navigation, performance, and accessibility',
        inputSchema: {
          type: 'object',
          properties: {
            siteName: {
              type: 'string',
              description: 'Name of the generated site to test (e.g., "testmoderapide")',
            },
            tests: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['responsive', 'navigation', 'performance', 'accessibility']
              },
              description: 'Tests to run (default: all)',
              default: ['responsive', 'navigation', 'performance', 'accessibility']
            }
          },
          required: ['siteName'],
        },
      },
      {
        name: 'capture_screenshot',
        description: 'Capture a screenshot of a generated website',
        inputSchema: {
          type: 'object',
          properties: {
            siteName: {
              type: 'string',
              description: 'Name of the generated site',
            },
            outputPath: {
              type: 'string',
              description: 'Path to save the screenshot',
            },
            viewport: {
              type: 'string',
              enum: ['mobile', 'tablet', 'desktop'],
              default: 'desktop',
              description: 'Viewport size for the screenshot',
            }
          },
          required: ['siteName'],
        },
      },
      {
        name: 'start_dev_server',
        description: 'Start the development server for a generated site',
        inputSchema: {
          type: 'object',
          properties: {
            siteName: {
              type: 'string',
              description: 'Name of the generated site',
            },
            port: {
              type: 'number',
              description: 'Port to run the server on',
              default: 3000
            }
          },
          required: ['siteName'],
        },
      },
      {
        name: 'stop_dev_server',
        description: 'Stop the running development server',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'test_generated_site': {
        const results = await testServer.testSite(
          args.siteName,
          args.tests || ['responsive', 'navigation', 'performance', 'accessibility']
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      case 'capture_screenshot': {
        const port = await testServer.startDevServer(args.siteName);
        const url = `http://localhost:${port}`;
        
        const viewportSizes = {
          mobile: { width: 375, height: 667 },
          tablet: { width: 768, height: 1024 },
          desktop: { width: 1920, height: 1080 }
        };

        const viewport = viewportSizes[args.viewport || 'desktop'];
        const outputPath = args.outputPath || `screenshots/${args.siteName}-${args.viewport || 'desktop'}.png`;
        
        const browser = await testServer.startBrowser();
        const page = await browser.newPage();
        
        await page.setViewport(viewport);
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        // Ensure directory exists
        const dir = path.dirname(outputPath);
        await fs.mkdir(dir, { recursive: true });
        
        await page.screenshot({ path: outputPath, fullPage: true });
        await page.close();
        
        return {
          content: [
            {
              type: 'text',
              text: `Screenshot saved to ${outputPath}`,
            },
          ],
        };
      }

      case 'start_dev_server': {
        const port = await testServer.startDevServer(args.siteName, args.port || 3000);
        return {
          content: [
            {
              type: 'text',
              text: `Development server started at http://localhost:${port}`,
            },
          ],
        };
      }

      case 'stop_dev_server': {
        await testServer.stopDevServer();
        return {
          content: [
            {
              type: 'text',
              text: 'Development server stopped',
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Cleanup on exit
process.on('SIGINT', async () => {
  await testServer.closeBrowser();
  await testServer.stopDevServer();
  process.exit(0);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Puppeteer MCP Server started');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});