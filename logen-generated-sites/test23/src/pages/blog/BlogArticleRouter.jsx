import React, { useState, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Calendar, ArrowLeft, Tag, User } from "lucide-react";
import { loadSiteConfig } from "../../config/config-loader";
import { getBlogArticle } from "../../config/markdown-loader";

const BlogArticleRouter = () => {
  const { slug } = useParams();
  const config = loadSiteConfig();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const colors = config.brand?.colors || {};
  const primaryColor = colors.primary || '#8B4513';
  const accentColor = colors.accent || '#DAA520';
  
  useEffect(() => {
    const loadArticle = async () => {
      try {
        const foundArticle = await getBlogArticle(slug);
        setArticle(foundArticle);
      } catch (error) {
        console.error('Error loading article:', error);
        setArticle(null);
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [slug]);

  // Loading state
  if (loading) {
    return (
      <div className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4 w-1/4"></div>
            <div className="h-12 bg-gray-200 rounded mb-6"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded mb-6 w-1/2"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Si l'article n'existe pas, rediriger vers le blog
  if (!article) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <>
      <Helmet>
        <title>{article.title} | Blog | {config.brand.name}</title>
        <meta name="description" content={article.excerpt} />
        <link rel="canonical" href={`https://${config.meta.domain}/blog/${slug}`} />
      </Helmet>

      <article className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <Link 
              to="/blog" 
              className="inline-flex items-center hover:underline"
              style={{ color: primaryColor }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au blog
            </Link>
          </nav>
          
          {/* Article Header */}
          <header className="mb-8">
            <div className="mb-4">
              <span 
                className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: accentColor }}
              >
                {article.category}
              </span>
            </div>
            
            <h1 
              className="text-4xl md:text-5xl font-bold mb-6 leading-tight"
              style={{ color: primaryColor }}
            >
              {article.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-gray-600 text-sm mb-6">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>
                  {new Date(article.date || article.publishDate).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              
              {article.author && (
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  <span>Par {article.author}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {article.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>
          
          {/* Article Image */}
          {article.image && (
            <div className="mb-8">
              <img
                src={article.image.startsWith('http') ? article.image : `/assets/blog/images/${article.image}`}
                alt={article.title}
                className="w-full h-96 object-cover rounded-xl shadow-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
          
          {/* Article Content */}
          <div className="prose prose-lg max-w-none">
            <style>{`
              .prose {
                color: #374151;
              }
              .prose h1, .prose h2, .prose h3 {
                color: ${primaryColor};
              }
              .prose h2 {
                border-bottom: 2px solid ${primaryColor}20;
                padding-bottom: 0.5rem;
                margin-top: 2rem;
                margin-bottom: 1rem;
              }
              .prose h3 {
                margin-top: 1.5rem;
                margin-bottom: 0.75rem;
              }
              .prose p {
                margin-bottom: 1rem;
                line-height: 1.75;
              }
              .prose ul li {
                margin: 0.5rem 0;
              }
              .prose table {
                margin: 1.5rem 0;
                border-collapse: collapse;
                width: 100%;
              }
              .prose table th,
              .prose table td {
                border: 1px solid #e5e7eb;
                padding: 0.75rem;
                text-align: left;
              }
              .prose table th {
                background: #f9fafb;
                font-weight: 600;
              }
              .prose strong {
                color: ${primaryColor};
                font-weight: 600;
              }
              .prose em {
                color: #6b7280;
              }
              .prose code {
                background: #f3f4f6;
                color: #374151;
                padding: 0.25rem 0.5rem;
                border-radius: 0.25rem;
                font-size: 0.875em;
              }
              .prose pre {
                background: #1f2937;
                color: #f9fafb;
                padding: 1rem;
                border-radius: 0.5rem;
                overflow-x: auto;
              }
              .prose pre code {
                background: transparent;
                color: inherit;
                padding: 0;
              }
              .prose blockquote {
                border-left: 4px solid ${accentColor};
                padding-left: 1rem;
                margin: 1.5rem 0;
                font-style: italic;
                color: #6b7280;
              }
            `}</style>
            
            <div 
              dangerouslySetInnerHTML={{ 
                __html: article.content || `<p>${article.excerpt}</p>` 
              }}
            />
          </div>
          
          {/* Article Footer */}
          <footer className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <Link 
                to="/blog" 
                className="inline-flex items-center hover:underline font-medium"
                style={{ color: primaryColor }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voir tous les articles
              </Link>
              
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Link 
                  to="/contact"
                  className="inline-flex items-center px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                >
                  Nous contacter
                </Link>
                
                <div className="text-sm text-gray-500">
                  Article • {slug}
                </div>
              </div>
            </div>
          </footer>
        </div>
      </article>
    </>
  );
};

export default BlogArticleRouter;