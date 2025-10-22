import { loadSiteConfig } from "./config-loader";

// Simple markdown parser sans dépendances externes
class MarkdownParser {
  constructor() {
    this.rules = [
      // Headers
      { pattern: /^### (.*$)/gm, replacement: '<h3>$1</h3>' },
      { pattern: /^## (.*$)/gm, replacement: '<h2>$1</h2>' },
      { pattern: /^# (.*$)/gm, replacement: '<h1>$1</h1>' },
      
      // Bold and italic
      { pattern: /\*\*(.*?)\*\*/g, replacement: '<strong>$1</strong>' },
      { pattern: /\*(.*?)\*/g, replacement: '<em>$1</em>' },
      
      // Links
      { pattern: /\[([^\]]+)\]\(([^)]+)\)/g, replacement: '<a href="$2">$1</a>' },
      
      // Code blocks and inline code
      { pattern: /```[\s\S]*?```/g, replacement: (match) => {
        const content = match.replace(/```/g, '').trim();
        return `<pre><code>${content}</code></pre>`;
      }},
      { pattern: /`([^`]+)`/g, replacement: '<code>$1</code>' },
      
      // Tables (basic support)
      { pattern: /\|(.+)\|/g, replacement: (match, content) => {
        const cells = content.split('|').map(cell => cell.trim());
        const cellTags = cells.map(cell => `<td>${cell}</td>`).join('');
        return `<tr>${cellTags}</tr>`;
      }},
      
      // Lists
      { pattern: /^- (.*$)/gm, replacement: '<li>$1</li>' },
      { pattern: /^\d+\. (.*$)/gm, replacement: '<li>$1</li>' },
      
      // Paragraphs (must be last)
      { pattern: /^(?!<[h|u|o|l|p|b|t])(.*$)/gm, replacement: (match, content) => {
        if (content.trim() === '' || content.startsWith('<')) return content;
        return `<p>${content}</p>`;
      }}
    ];
  }

  parse(markdown) {
    let html = markdown;
    
    // Apply all rules
    this.rules.forEach(rule => {
      if (typeof rule.replacement === 'function') {
        html = html.replace(rule.pattern, rule.replacement);
      } else {
        html = html.replace(rule.pattern, rule.replacement);
      }
    });

    // Wrap consecutive li tags in ul
    html = html.replace(/(<li>.*?<\/li>\s*)+/gs, '<ul>$&</ul>');
    
    // Wrap consecutive tr tags in table
    html = html.replace(/(<tr>.*?<\/tr>\s*)+/gs, '<table>$&</table>');
    
    // Clean up empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');
    
    return html;
  }
}

// Parse front matter from markdown file
function parseFrontMatter(content) {
  const frontMatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontMatterRegex);
  
  if (!match) {
    return { frontMatter: {}, content: content };
  }
  
  const frontMatterText = match[1];
  const markdownContent = match[2];
  
  // Simple YAML parser for front matter
  const frontMatter = {};
  frontMatterText.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Parse arrays (tags)
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(item => 
          item.trim().replace(/['"]/g, '')
        );
      }
      
      frontMatter[key] = value;
    }
  });
  
  return { frontMatter, content: markdownContent };
}

// 🎯 NOUVEAU SYSTÈME INTELLIGENT : Auto-découverte des articles
async function discoverMarkdownArticles() {
  const config = loadSiteConfig();
  const siteId = config.meta?.siteId || 'unknown';
  const articles = [];
  const parser = new MarkdownParser();
  
  console.log(`🔍 Auto-découverte des articles Markdown pour: ${siteId}`);
  
  // 🎯 MÉTHODE 1: Utiliser l'index généré automatiquement
  try {
    const indexResponse = await fetch('/content/blog-index.json');
    if (indexResponse.ok) {
      const index = await indexResponse.json();
      console.log(`📋 Index trouvé avec ${index.count} articles`);
      
      // Charger tous les articles listés dans l'index
      for (const filename of index.files) {
        try {
          console.log(`⏳ Chargement: ${filename}`);
          const response = await fetch(`/content/blog/${filename}`);
      
          if (response.ok) {
            const rawContent = await response.text();
            const { frontMatter, content } = parseFrontMatter(rawContent);
            const htmlContent = parser.parse(content);
            
            // Extraire le titre du contenu si pas dans frontMatter
            let title = frontMatter.title;
            if (!title) {
              // Chercher le premier # dans le contenu
              const titleMatch = content.match(/^#\s+(.+)$/m);
              title = titleMatch ? titleMatch[1] : filename.replace('.md', '').replace(/-/g, ' ');
            }
            
            const article = {
              id: frontMatter.id || filename.replace('.md', ''),
              title: title,
              slug: frontMatter.slug || filename.replace('.md', ''),
              excerpt: frontMatter.excerpt || frontMatter.description || content.substring(0, 200).replace(/^#.*$/m, '').trim() + '...',
              date: frontMatter.date || frontMatter.publishDate || new Date().toISOString(),
              author: frontMatter.author || config.brand?.name || siteId,
              category: frontMatter.category || 'Article',
              tags: frontMatter.tags || [],
              image: frontMatter.image || '',
              content: htmlContent,
              filename: filename,
              source: 'markdown',
              loadedAt: new Date().toISOString()
            };
            
            articles.push(article);
            console.log(`✅ Article chargé: ${article.title}`);
          } else {
            console.log(`❌ Article non trouvé: ${filename} (${response.status})`);
          }
        } catch (error) {
          console.warn(`❌ Erreur chargement: ${filename}`, error);
        }
      }
      
      return articles; // Retourner les articles trouvés via l'index
    }
  } catch (error) {
    console.log(`📄 Pas d'index trouvé, fallback sur découverte manuelle...`);
  }
  
  // 🎯 MÉTHODE 2: Fallback - essayer l'ancien système d'index si aucun article trouvé
  if (articles.length === 0) {
    console.log(`🔄 Fallback: tentative de lecture de l'index blog-index.json`);
    try {
      const response = await fetch('/content/blog-index.json');
      if (response.ok) {
        const index = await response.json();
        const indexedFiles = index.files || [];
        console.log(`📋 Index trouvé avec ${indexedFiles.length} fichiers`);
        
        // Charger les articles listés dans l'index
        for (const filename of indexedFiles) {
          try {
            const response = await fetch(`/content/blog/${filename}`);
            if (response.ok) {
              const rawContent = await response.text();
              const { frontMatter, content } = parseFrontMatter(rawContent);
              const htmlContent = parser.parse(content);
              
              const article = {
                id: frontMatter.id || filename.replace('.md', ''),
                title: frontMatter.title || 'Article sans titre',
                slug: frontMatter.slug || filename.replace('.md', ''),
                excerpt: frontMatter.excerpt || frontMatter.description || content.substring(0, 200) + '...',
                date: frontMatter.date || frontMatter.publishDate || new Date().toISOString(),
                author: frontMatter.author || config.brand?.name || siteId,
                category: frontMatter.category || 'Article',
                tags: frontMatter.tags || [],
                image: frontMatter.image || '',
                content: htmlContent,
                filename: filename,
                source: 'markdown-indexed',
                loadedAt: new Date().toISOString()
              };
              
              articles.push(article);
              console.log(`✅ Article indexé chargé: ${article.title}`);
            }
          } catch (error) {
            console.warn(`❌ Erreur chargement article indexé: ${filename}`, error);
          }
        }
      }
    } catch (error) {
      console.log(`❌ Pas d'index trouvé: ${error.message}`);
    }
  }
  
  // Trier par date (plus récent d'abord)
  articles.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  console.log(`🎉 ${articles.length} articles Markdown chargés pour ${siteId}`);
  return articles;
}

// Get articles - Auto-découverte intelligente
export async function getBlogArticles() {
  const config = loadSiteConfig();
  const siteId = config.meta?.siteId || 'unknown';
  
  try {
    const markdownArticles = await discoverMarkdownArticles();
    
    if (markdownArticles.length > 0) {
      console.log(`📝 ${markdownArticles.length} articles Markdown découverts pour ${siteId}`);
      return markdownArticles;
    } else {
      console.log(`📄 Aucun article disponible pour ${siteId}`);
      return [];
    }
  } catch (error) {
    console.error('Erreur lors de la découverte des articles:', error);
    return [];
  }
}

// Get single article by slug
export async function getBlogArticle(slug) {
  const articles = await getBlogArticles();
  const article = articles.find(article => article.slug === slug);
  
  if (article) {
    console.log(`📖 Article trouvé: ${article.title}`);
  } else {
    console.warn(`❌ Article introuvable: ${slug}`);
  }
  
  return article;
}

export { MarkdownParser, parseFrontMatter };
