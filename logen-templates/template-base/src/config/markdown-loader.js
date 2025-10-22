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

// Inférer les métadonnées à partir du contenu sans front matter
function inferMetadataFromContent(content) {
  // Extraire le titre (premier # heading)
  const titleMatch = content.match(/^# (.+)$/m);
  const title = titleMatch ? titleMatch[1] : 'Article sans titre';
  
  // Créer un slug à partir du titre
  const slug = title.toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ýÿ]/g, 'y')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  // Extraire la date de publication s'il y en a une dans le contenu
  const dateMatch = content.match(/\*Publié le (.+?) •/);
  const publishDate = dateMatch ? parsePublishDate(dateMatch[1]) : new Date().toISOString();
  
  // Extraire le premier paragraphe comme excerpt (après le titre)
  const contentAfterTitle = content.replace(/^# .+$/m, '').trim();
  const excerptMatch = contentAfterTitle.match(/^(.+?)$/m);
  let excerpt = excerptMatch ? excerptMatch[1].replace(/\*/g, '').trim() : '';
  
  // Nettoyer l'excerpt des éléments de markdown
  excerpt = excerpt.replace(/\*Publié le .+? •.+?\*/g, '').trim();
  if (excerpt.length > 150) {
    excerpt = excerpt.substring(0, 150) + '...';
  }
  
  // Générer le nom d'image basé sur le slug
  const imageName = `${slug}.png`;
  
  // Métadonnées inférées
  const config = loadSiteConfig();
  const frontMatter = {
    title: title,
    slug: slug,
    excerpt: excerpt,
    date: publishDate,
    author: config?.brand?.name || 'Author', // Use site-specific brand name
    category: 'Article',
    tags: [],
    image: imageName
  };
  
  return { frontMatter, content };
}

// Parser une date de publication en français
function parsePublishDate(dateStr) {
  // Format attendu: "25 mai 2024" 
  const months = {
    'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
    'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
    'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
  };
  
  const parts = dateStr.split(' ');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = months[parts[1].toLowerCase()] || '01';
    const year = parts[2];
    return `${year}-${month}-${day}T12:00:00Z`;
  }
  
  return new Date().toISOString();
}

// Parse front matter from markdown file
function parseFrontMatter(content) {
  const frontMatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontMatterRegex);
  
  if (!match) {
    // Pas de front matter YAML, extraire les infos du contenu
    return inferMetadataFromContent(content);
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

// Cache pour éviter de recharger les articles à chaque fois
let articlesCache = null;
let cacheExpiry = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// 🎯 OPTIMISÉ : Auto-découverte des articles avec cache et chargement parallèle
async function discoverMarkdownArticles() {
  const config = loadSiteConfig();
  const siteId = config.meta?.siteId || 'unknown';
  
  // Vérifier le cache d'abord
  if (articlesCache && cacheExpiry && Date.now() < cacheExpiry) {
    console.log(`⚡ Articles chargés depuis le cache (${articlesCache.length} articles)`);
    return articlesCache;
  }
  
  const articles = [];
  const parser = new MarkdownParser();
  
  console.log(`🔍 Auto-découverte des articles Markdown pour: ${siteId}`);
  
  // 🎯 MÉTHODE 1: Utiliser l'index généré automatiquement
  try {
    const indexResponse = await fetch('/content/blog-index.json');
    if (indexResponse.ok) {
      const index = await indexResponse.json();
      console.log(`📋 Index trouvé avec ${index.count} articles`);
      
      // Charger tous les articles en parallèle pour éviter la latence
      const articlePromises = index.files.map(async (filename) => {
        try {
          const response = await fetch(`/content/blog/${filename}`);
          if (response.ok) {
            const rawContent = await response.text();
            const { frontMatter, content } = parseFrontMatter(rawContent);
            const htmlContent = parser.parse(content);

            let title = frontMatter.title;
            if (!title) {
              const titleMatch = content.match(/^#\s+(.+)$/m);
              title = titleMatch ? titleMatch[1] : filename.replace('.md', '').replace(/-/g, ' ');
            }

            return {
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
              status: frontMatter.status || 'published', // Include status from front matter
              filename: filename,
              source: 'markdown',
              loadedAt: new Date().toISOString()
            };
          }
          return null;
        } catch (error) {
          console.warn(`❌ Erreur chargement: ${filename}`, error);
          return null;
        }
      });
      
      const results = await Promise.all(articlePromises);
      const validArticles = results.filter(article => article !== null);
      articles.push(...validArticles);
      
      console.log(`✅ ${validArticles.length} articles chargés en parallèle`);
      
      if (articles.length > 0) {
        // Trier par date (plus récent d'abord)
        articles.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Mettre en cache
        articlesCache = articles;
        cacheExpiry = Date.now() + CACHE_DURATION;
        
        console.log(`🎉 ${articles.length} articles Markdown chargés et mis en cache pour ${siteId}`);
        return articles;
      }
    }
  } catch (error) {
    console.log(`📄 Pas d'index trouvé, retour rapide sur articles vides...`);
  }
  
  // Retour rapide si aucun article trouvé
  console.log(`⚡ Aucun article trouvé, retour immédiat`);
  return [];
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
