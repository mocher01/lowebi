#!/usr/bin/env node

/**
 * Generate blog-index.json from Markdown files
 * This script scans the blog directory and creates an index file
 */

const fs = require('fs');
const path = require('path');

const blogDir = process.argv[2];
const outputPath = process.argv[3];

if (!blogDir || !outputPath) {
  console.error('Usage: node generate-blog-index.js <blog-dir> <output-path>');
  process.exit(1);
}

try {
  // Check if blog directory exists
  if (!fs.existsSync(blogDir)) {
    console.log(`⚠️  Blog directory not found: ${blogDir}`);
    process.exit(0);
  }

  // Read all .md files from blog directory
  const files = fs.readdirSync(blogDir)
    .filter(file => file.endsWith('.md'))
    .sort();

  // Parse each markdown file to extract metadata
  const articles = files.map(file => {
    const filepath = path.join(blogDir, file);
    const content = fs.readFileSync(filepath, 'utf8');
    
    // Extract title from first # heading
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : path.basename(file, '.md');
    
    // Extract description from first paragraph after title
    const lines = content.split('\n');
    let description = '';
    let foundTitle = false;
    
    for (const line of lines) {
      if (line.trim().startsWith('#') && !foundTitle) {
        foundTitle = true;
        continue;
      }
      if (foundTitle && line.trim() && !line.trim().startsWith('#')) {
        description = line.trim();
        break;
      }
    }
    
    // Create slug from filename
    const slug = path.basename(file, '.md');
    
    return {
      file: file,
      slug: slug,
      title: title,
      description: description || `Article sur ${title}`,
      summary: description || `Découvrez ${title}`
    };
  });

  // Create index object
  const index = {
    generated: new Date().toISOString(),
    count: files.length,
    files: files,
    articles: articles
  };

  // Write index file
  fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));
  
  console.log(`✅ Blog index generated: ${files.length} articles`);
  console.log(`📄 Index saved to: ${outputPath}`);
  
} catch (error) {
  console.error('❌ Error generating blog index:', error.message);
  process.exit(1);
}