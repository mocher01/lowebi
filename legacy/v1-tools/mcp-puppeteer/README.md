# Website Generator Puppeteer MCP Server

A Model Context Protocol (MCP) server that provides Puppeteer-based testing tools for the Website Generator project. This allows Claude to test generated websites locally before deployment.

## Features

- **Visual Testing**: Capture screenshots in different viewports (mobile, tablet, desktop)
- **Responsive Design Testing**: Verify no horizontal scrolling across devices
- **Navigation Testing**: Check all links work correctly
- **Performance Testing**: Measure load times and resource usage
- **Accessibility Testing**: Basic accessibility checks (alt text, landmarks, labels)
- **Dev Server Management**: Start/stop local development servers for testing

## Installation

```bash
cd mcp-puppeteer
npm install
```

## Usage

### As MCP Server (for Claude)

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "website-generator-puppeteer": {
      "command": "node",
      "args": ["server.js"],
      "cwd": "path/to/website-generator/mcp-puppeteer"
    }
  }
}
```

### Standalone Testing

Test a generated site:

```bash
# Test a site (will start dev server automatically)
npm test testmoderapide

# Test on specific port
npm test testmoderapide 3001
```

### Available MCP Tools

1. **test_generated_site**
   - Tests a site for responsive design, navigation, performance, and accessibility
   - Returns detailed test results

2. **capture_screenshot**
   - Captures screenshots of a site in different viewports
   - Saves to `screenshots/` directory

3. **start_dev_server**
   - Starts the development server for a generated site
   - Returns the URL where the site is running

4. **stop_dev_server**
   - Stops the running development server

## Test Categories

### Responsive Design
- Tests mobile (375x667), tablet (768x1024), and desktop (1920x1080) viewports
- Checks for horizontal scrolling
- Verifies mobile menu behavior

### Navigation
- Finds all navigation links
- Tests each internal link
- Reports broken links

### Performance
- Measures DOM Content Loaded time
- Measures full page load time
- Counts resources by type
- Provides optimization recommendations

### Accessibility
- Checks for lang attribute
- Verifies images have alt text
- Checks heading hierarchy
- Verifies form inputs have labels
- Checks for landmark elements (main, nav)

## Output

### Test Results
```
Testing testmoderapide
======================

Testing Responsive Design
==========================
✓ Mobile (375x667): No horizontal scroll
✓ Tablet (768x1024): No horizontal scroll
✓ Desktop (1920x1080): No horizontal scroll

Testing Navigation Links
========================
ℹ Found 4 navigation links
✓ Link "Accueil" → 200
✓ Link "Services" → 200
✓ Link "À propos" → 200
✓ Link "Contact" → 200

Testing Performance
===================
✓ DOM Content Loaded: 1234ms (< 3000ms)
✓ Page Load Complete: 2345ms (< 5000ms)

Testing Accessibility
=====================
✓ HTML has lang attribute
✓ Has <main> landmark
✓ Has <nav> landmark
✓ All images have alt text
✓ All form inputs have labels

Capturing Screenshots
=====================
✓ Screenshot saved: screenshots/testmoderapide-desktop.png
✓ Screenshot saved: screenshots/testmoderapide-tablet.png
✓ Screenshot saved: screenshots/testmoderapide-mobile.png

Test Summary
============
✓ All tests passed! 🎉
```

## Development

Run the MCP server in development mode:

```bash
npm run dev
```

## Requirements

- Node.js 18+
- npm or yarn
- Generated site must have `npm run dev` script configured

## Troubleshooting

### Dev server fails to start
- Ensure the site has been generated first
- Check that port is not already in use
- Verify npm dependencies are installed in the generated site

### Screenshots not saving
- Ensure write permissions for screenshots directory
- Check disk space

### Tests timing out
- Increase timeout values in server.js
- Check network connectivity
- Ensure site builds successfully