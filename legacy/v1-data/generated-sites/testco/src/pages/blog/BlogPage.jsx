import React, { useState, useMemo, useEffect } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { Calendar, ArrowRight, Filter, Tag, Archive, ChevronDown, ChevronUp, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { loadSiteConfig, isFeatureEnabled } from "@/config/config-loader";
import { getBlogArticles } from "@/config/markdown-loader";

const BlogPage = () => {
  const config = loadSiteConfig();
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [selectedYear, setSelectedYear] = useState("Toutes");
  const [selectedMonth, setSelectedMonth] = useState("Tous");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCategoryFilter, setShowCategoryFilter] = useState(true);
  const [showDateFilter, setShowDateFilter] = useState(true);
  const [showArchives, setShowArchives] = useState(true);
  
  // Chargement des articles
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    const loadArticles = async () => {
      try {
        const blogArticles = await getBlogArticles();
        setArticles(blogArticles);
      } catch (error) {
        console.error('Error loading blog articles:', error);
        // Fallback vers articles générés
        setArticles(getEnrichedArticles());
      }
    };

    loadArticles();
  }, []);
  
  // Si le blog n'est pas activé, rediriger ou afficher un message
  if (!isFeatureEnabled('blog')) {
    return (
      <>
        <div className="pt-24 pb-16 md:pt-32 md:pb-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-6">Blog non disponible</h1>
            <p className="text-gray-600 mb-8">
              Le blog n'est pas encore activé pour ce site.
            </p>
            <Link to="/" className="text-primary hover:underline">
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </>
    );
  }

  // 🎯 Configuration couleurs
  const blogSection = config.sections?.blog || {};
  const colors = config.brand?.colors || {};
  const designConfig = config.design?.pageHeaders || {};
  const textColors = config.design?.textColors || {};
  
  const sectionBg = blogSection.background || '#ffffff';
  const sectionTextColor = blogSection.textColor || '#1e293b';
  const primaryColor = colors.primary || '#8B4513';
  const accentColor = colors.accent || '#DAA520';

  // 🎨 Header style configurable comme les autres pages
  const headerBackgroundStyle = {
    background: designConfig.background?.type === 'gradient' 
      ? `linear-gradient(135deg, 
          ${designConfig.background.primary.color || primaryColor}${Math.round((designConfig.background.primary.opacity || 0.12) * 255).toString(16).padStart(2, '0')}, 
          ${designConfig.background.accent.color || accentColor}${Math.round((designConfig.background.accent.opacity || 0.08) * 255).toString(16).padStart(2, '0')}
        )`
      : designConfig.background?.color || '#f8fafc'
  };

  // 🎨 Configuration complète du blog
  const blogConfig = config.content?.blog || {
    title: "Notre Blog",
    description: `Découvrez nos dernières réflexions, conseils et actualités dans notre domaine d'expertise.`,
    filters: ["Tous", "Actualités", "Conseils"],
    featured: true,
    searchEnabled: false
  };

  // 🎯 Articles enrichis avec fallback spécifique par site
  const getEnrichedArticles = () => {
    const brandName = config.brand?.name || 'Notre entreprise';
    const siteId = config.meta?.siteId || 'unknown';
    
    if (config.content?.blog?.articles) {
      return config.content.blog.articles;
    }

    // 🎯 FALLBACK SPÉCIFIQUE PAR SITE (plus de hardcode qalyarab pour tous)
    if (siteId === 'testco') {
      return [
        {
          id: 1,
          title: "Comment l'IA révolutionne les entreprises",
          excerpt: "L'intelligence artificielle transforme la façon dont les entreprises opèrent au quotidien. Découvrez comment l'intégrer efficacement.",
          date: "2024-01-15T00:00:00Z",
          author: brandName,
          slug: "ia-revolutionne-entreprises",
          category: "IA",
          tags: ["intelligence artificielle", "innovation", "productivité"],
          image: "testco-image-1.jpg"
        },
        {
          id: 2,
          title: "Méthodes de développement agile en 2024",
          excerpt: "Les nouvelles approches agiles qui transforment la gestion de projet et améliorent la productivité des équipes.",
          date: "2024-01-10T00:00:00Z",
          author: brandName,
          slug: "methodes-developpement-agile-2024",
          category: "Développement",
          tags: ["agile", "scrum", "productivité"],
          image: "testco-image-2.png"
        },
        {
          id: 3,
          title: "Transformation digitale : guide pratique",
          excerpt: "Un guide complet pour accompagner votre entreprise dans sa transformation numérique avec des conseils pratiques.",
          date: "2024-01-05T00:00:00Z",
          author: brandName,
          slug: "transformation-digitale-guide",
          category: "Transformation",
          tags: ["digital", "transformation", "guide"],
          image: "testco-image-3.png"
        }
      ];
    } else if (siteId === 'qalyarab') {
      return [
        {
          id: 1,
          title: "L'histoire millénaire de la calligraphie arabe",
          excerpt: "Découvrez les origines fascinantes de cet art ancestral qui traverse les siècles, depuis les premiers manuscrits jusqu'aux créations contemporaines.",
          date: "2024-01-15T00:00:00Z",
          author: brandName,
          slug: "histoire-calligraphie-arabe",
          category: "Histoire",
          tags: ["patrimoine", "art-islamique", "manuscrits"],
          image: "qalyarab-image-1.jpg"
        },
        {
          id: 2,
          title: "Les différents styles de calligraphie : du Naskh au Thuluth",
          excerpt: "Explorez les caractéristiques uniques de chaque style calligraphique et apprenez à les reconnaître et les maîtriser.",
          date: "2024-01-10T00:00:00Z",
          author: brandName,
          slug: "styles-calligraphie-naskh-thuluth",
          category: "Techniques",
          tags: ["naskh", "thuluth", "styles"],
          image: "qalyarab-image-2.png"
        },
        {
          id: 3,
          title: "Débuter en calligraphie arabe : conseils et matériel",
          excerpt: "Guide pratique pour commencer votre apprentissage de la calligraphie arabe : choix du matériel, premières lettres, et exercices fondamentaux.",
          date: "2024-01-05T00:00:00Z",
          author: brandName,
          slug: "debuter-calligraphie-arabe",
          category: "Conseils",
          tags: ["débutant", "matériel", "exercices"],
          image: "qalyarab-image-3.png"
        }
      ];
    } else {
      // Fallback générique pour autres sites
      return [
        {
          id: 1,
          title: "Bienvenue sur notre blog",
          excerpt: "Découvrez nos dernières actualités et conseils dans notre domaine d'expertise.",
          date: "2024-01-15T00:00:00Z",
          author: brandName,
          slug: "bienvenue-blog",
          category: "Actualités",
          tags: ["actualités", "conseils"],
          image: "blog-default.jpg"
        }
      ];
    }
  };

  // 🎯 Extraction dynamique des filtres depuis les articles
  const availableFilters = useMemo(() => {
    const categories = [...new Set(articles.map(article => article.category))].filter(Boolean);
    const years = [...new Set(articles.map(article => new Date(article.date || article.publishDate).getFullYear()))].sort((a, b) => b - a);
    const months = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    
    return {
      categories: ["Tous", ...categories],
      years: ["Toutes", ...years],
      months: ["Tous", ...months]
    };
  }, [articles]);

  // 🎯 Filtrage intelligent des articles avec recherche
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const articleDate = new Date(article.date || article.publishDate);
      const categoryMatch = selectedCategory === "Tous" || article.category === selectedCategory;
      const yearMatch = selectedYear === "Toutes" || articleDate.getFullYear() === parseInt(selectedYear);
      const monthMatch = selectedMonth === "Tous" || articleDate.getMonth() === availableFilters.months.indexOf(selectedMonth) - 1;
      
      // Filtrage par recherche
      const searchMatch = !searchTerm || (
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (article.content && article.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (article.tags && article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
      
      return categoryMatch && yearMatch && monthMatch && searchMatch;
    });
  }, [articles, selectedCategory, selectedYear, selectedMonth, searchTerm, availableFilters.months]);

  // 🎯 Archives par année/mois
  const archivesByYear = useMemo(() => {
    const archives = {};
    articles.forEach(article => {
      const date = new Date(article.date || article.publishDate);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthName = availableFilters.months[month + 1];
      
      if (!archives[year]) archives[year] = {};
      if (!archives[year][monthName]) archives[year][monthName] = 0;
      archives[year][monthName]++;
    });
    return archives;
  }, [articles, availableFilters.months]);

  const resetFilters = () => {
    setSelectedCategory("Tous");
    setSelectedYear("Toutes");
    setSelectedMonth("Tous");
    setSearchTerm("");
  };

  return (
    <>
      <Helmet>
        <title>{blogConfig.title} | {config.brand.name}</title>
        <meta name="description" content={blogConfig.description} />
        <link rel="canonical" href={`https://${config.meta.domain}/blog`} />
      </Helmet>

      {/* 🎨 Header avec design cohérent - BADGE SUPPRIMÉ */}
      <section className="page-header" style={headerBackgroundStyle}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 
              className={`${designConfig.title?.size || 'text-3xl md:text-4xl'} ${designConfig.title?.weight || 'font-bold'} ${designConfig.title?.margin || 'mb-4'}`}
              style={{ color: designConfig.title?.color || primaryColor }}
            >
              {blogConfig.title}
            </h1>
            
            <p 
              className={`${designConfig.subtitle?.size || 'text-xl'} ${designConfig.subtitle?.weight || 'font-normal'} max-w-2xl mx-auto`}
              style={{ color: designConfig.subtitle?.color || textColors.primary || '#374151' }}
            >
              {blogConfig.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* 🎯 LAYOUT ORIGINAL : 75% articles + 25% sidebar */}
      <section 
        className="py-12"
        style={{
          backgroundColor: sectionBg,
          color: sectionTextColor
        }}
      >
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* 📝 ARTICLES - 75% (3 colonnes sur 4) */}
            <div className="lg:col-span-3">
              
              {/* Résumé des filtres actifs */}
              {(selectedCategory !== "Tous" || selectedYear !== "Toutes" || selectedMonth !== "Tous" || searchTerm) && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4" style={{ borderLeftColor: primaryColor }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Filtres actifs :</p>
                      <div className="flex items-center gap-2 text-sm flex-wrap">
                        {selectedCategory !== "Tous" && (
                          <span className="px-2 py-1 bg-white rounded-full text-xs border" style={{ color: primaryColor }}>
                            {selectedCategory}
                          </span>
                        )}
                        {selectedYear !== "Toutes" && (
                          <span className="px-2 py-1 bg-white rounded-full text-xs border" style={{ color: primaryColor }}>
                            {selectedYear}
                          </span>
                        )}
                        {selectedMonth !== "Tous" && (
                          <span className="px-2 py-1 bg-white rounded-full text-xs border" style={{ color: primaryColor }}>
                            {selectedMonth}
                          </span>
                        )}
                        {searchTerm && (
                          <span className="px-2 py-1 bg-white rounded-full text-xs border" style={{ color: primaryColor }}>
                            "{searchTerm}"
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={resetFilters}
                      className="text-sm hover:underline"
                      style={{ color: primaryColor }}
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>
              )}

              {/* Grid des articles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredArticles.map((article, index) => (
                  <motion.article
                    key={article.id || article.slug || index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 hover:-translate-y-1"
                  >
                    {/* Image de l'article */}
                    {article.image && (
                      <div className="mb-4">
                        <img
                          src={article.image.startsWith('http') ? article.image : `/assets/${article.image}`}
                          alt={article.title}
                          className="w-full h-48 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(article.date || article.publishDate).toLocaleDateString('fr-FR')}
                      {article.category && (
                        <span 
                          className="ml-4 px-2 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: accentColor }}
                        >
                          {article.category}
                        </span>
                      )}
                    </div>
                    
                    <h2 className="text-xl font-semibold mb-3">
                      <Link 
                        to={`/blog/${article.slug}`}
                        className="hover:opacity-80 transition-opacity"
                        style={{ color: primaryColor }}
                      >
                        {article.title}
                      </Link>
                    </h2>
                    
                    <p className="text-gray-700 mb-4 line-clamp-3">
                      {article.excerpt}
                    </p>

                    {/* Tags */}
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {article.tags.slice(0, 3).map((tag, idx) => (
                          <span 
                            key={idx}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <Link 
                      to={`/blog/${article.slug}`}
                      className="inline-flex items-center font-medium hover:underline"
                      style={{ color: primaryColor }}
                    >
                      Lire la suite
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </motion.article>
                ))}
              </div>
              
              {/* Message si pas d'articles */}
              {filteredArticles.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg mb-4">
                    {searchTerm 
                      ? `Aucun article ne contient "${searchTerm}".`
                      : "Aucun article ne correspond aux filtres sélectionnés."
                    }
                  </p>
                  <button
                    onClick={resetFilters}
                    className="hover:underline font-medium"
                    style={{ color: primaryColor }}
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              )}
            </div>

            {/* 🔍 SIDEBAR - 25% (1 colonne sur 4) */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                
                {/* 🔍 BARRE DE RECHERCHE (conditionnelle selon config) */}
                {blogConfig.searchEnabled && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: primaryColor }}>
                      <Search className="w-5 h-5 inline mr-2" />
                      Recherche
                    </h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Rechercher un article..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent text-sm"
                        style={{ 
                          focusRingColor: primaryColor,
                          '--tw-ring-color': primaryColor + '80'
                        }}
                      />
                    </div>
                    {searchTerm && (
                      <p className="text-xs text-gray-600 mt-2">
                        {filteredArticles.length} résultat{filteredArticles.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Filtres par catégories */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <button
                    onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                    className="flex items-center justify-between w-full mb-4"
                  >
                    <h3 className="text-lg font-semibold" style={{ color: primaryColor }}>
                      <Filter className="w-5 h-5 inline mr-2" />
                      Catégories
                    </h3>
                    {showCategoryFilter ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  
                  {showCategoryFilter && (
                    <div className="space-y-2">
                      {availableFilters.categories.map((category) => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`block w-full text-left px-3 py-2 rounded-lg transition-all text-sm ${
                            selectedCategory === category
                              ? 'text-white font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                          style={{
                            backgroundColor: selectedCategory === category ? primaryColor : undefined
                          }}
                        >
                          {category}
                          <span className="float-right text-xs opacity-60">
                            ({category === "Tous" ? articles.length : articles.filter(a => a.category === category).length})
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filtres par date */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <button
                    onClick={() => setShowDateFilter(!showDateFilter)}
                    className="flex items-center justify-between w-full mb-4"
                  >
                    <h3 className="text-lg font-semibold" style={{ color: primaryColor }}>
                      <Calendar className="w-5 h-5 inline mr-2" />
                      Date
                    </h3>
                    {showDateFilter ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  
                  {showDateFilter && (
                    <div className="space-y-4">
                      {/* Années */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Année</label>
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-opacity-50"
                          style={{ focusRingColor: primaryColor }}
                        >
                          {availableFilters.years.map((year) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Mois */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Mois</label>
                        <select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-opacity-50"
                          style={{ focusRingColor: primaryColor }}
                        >
                          {availableFilters.months.map((month) => (
                            <option key={month} value={month}>{month}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Archives */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <button
                    onClick={() => setShowArchives(!showArchives)}
                    className="flex items-center justify-between w-full mb-4"
                  >
                    <h3 className="text-lg font-semibold" style={{ color: primaryColor }}>
                      <Archive className="w-5 h-5 inline mr-2" />
                      Archives
                    </h3>
                    {showArchives ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  
                  {showArchives && (
                    <div className="space-y-2">
                      {Object.keys(archivesByYear).sort((a, b) => b - a).map((year) => (
                        <div key={year}>
                          <button
                            onClick={() => setSelectedYear(year)}
                            className="text-sm font-medium hover:underline text-left"
                            style={{ color: primaryColor }}
                          >
                            {year} ({Object.values(archivesByYear[year]).reduce((a, b) => a + b, 0)})
                          </button>
                          <div className="ml-4 space-y-1">
                            {Object.entries(archivesByYear[year]).map(([month, count]) => (
                              <button
                                key={month}
                                onClick={() => {
                                  setSelectedYear(year);
                                  setSelectedMonth(month);
                                }}
                                className="block text-xs text-gray-600 hover:underline"
                              >
                                {month} ({count})
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stats blog */}
                <div className="bg-gray-50 rounded-xl p-6 text-center">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <div className="text-2xl font-bold" style={{ color: primaryColor }}>
                        {articles.length}
                      </div>
                      <div className="text-sm text-gray-600">Articles</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold" style={{ color: primaryColor }}>
                        {availableFilters.categories.length - 1}
                      </div>
                      <div className="text-sm text-gray-600">Catégories</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default BlogPage;
