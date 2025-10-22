'use client';

import { useState, useRef, useEffect } from 'react';
import { AiRequest } from '@/services/api-client';

interface ProcessingModalProps {
  request: AiRequest;
  onClose: () => void;
  onComplete: (request: AiRequest, content: string) => Promise<void>;
}

interface ImageUpload {
  label: string;
  filename: string;
  type: string;
  description?: string;
}

export default function ProcessingModal({ request, onClose, onComplete }: ProcessingModalProps) {
  const [generatedContent, setGeneratedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<Record<number, string>>({});
  const [comprehensivePrompt, setComprehensivePrompt] = useState<string>('');
  const [promptLoading, setPromptLoading] = useState(true);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Base URL for API calls and image loading
  const baseURL = typeof window !== 'undefined' && window.location.hostname === 'admin.logen.locod-ai.com'
    ? 'https://logen.locod-ai.com'  // Backend production URL for image serving
    : 'http://localhost:7600';
  
  // Initialize with existing content for completed requests
  useEffect(() => {
    if (request.status === 'completed' && request.generatedContent) {
      try {
        // Handle both string and object content
        const content = typeof request.generatedContent === 'string' 
          ? request.generatedContent 
          : JSON.stringify(request.generatedContent, null, 2);
        setGeneratedContent(content);
        console.log('✅ Loaded existing content for completed request:', request.id);
      } catch (error) {
        console.error('❌ Error loading existing content:', error);
        setGeneratedContent(request.generatedContent?.toString() || '');
      }
    }
  }, [request]);

  // Load existing image drafts on component mount
  useEffect(() => {
    const loadImageDrafts = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        // V2.2 FIX: Use backend URL to fetch images-draft from correct server
        const apiBaseURL = window.location.hostname === 'admin.logen.locod-ai.com' ? 'https://logen.locod-ai.com' : 'http://localhost:7600';
        const response = await fetch(`${apiBaseURL}/admin/ai-requests/${request.id}/images-draft`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const draft = data?.imagesDraft || {};

          // V2.2 FIX: Calculate imagesList locally to avoid undefined reference
          const localImagesList = getImagesList();

          // Map server draft back to UI indices by matching role to imageInfo.type
          const restored: Record<number, string> = {};
          localImagesList.forEach((imageInfo, index) => {
            const entry = draft[imageInfo.type];
            if (entry?.url) {
              // Use server public URL (persisted, not ephemeral)
              restored[index] = entry.url;
            }
          });

          setUploadedImages(restored);
          console.log(`✅ Loaded ${Object.keys(restored).length} draft images from server for request ${request.id}`);
        }
      } catch (error) {
        console.warn('Failed to load image drafts from server:', error);
        // Keep empty state, user can upload fresh images
      }
    };

    if (request.id) {
      loadImageDrafts();
    }
  }, [request.id]);

  // Initialize image uploads for image requests (including hero)
  const getImagesList = (): ImageUpload[] => {
    const imageTypes = ['images', 'hero', 'logo', 'banner', 'gallery'];
    if (!imageTypes.includes(request.requestType)) return [];

    const siteId = request.siteId || 'site';
    const imagesNeeded = request.requestData?.imagesNeeded || {};
    const imagesList: ImageUpload[] = [];

    // Special handling for hero requests
    if (request.requestType === 'hero') {
      return [{
        label: 'Image Hero Bannière',
        filename: `${siteId}-hero.png`,
        type: 'hero',
        description: 'Image d\'accueil principale (bannière hero)'
      }];
    }

    // V1 COMPATIBILITY FIX: For 'images' requests without imagesNeeded data
    // Provide COMPLETE default image set to maintain V1 functionality
    if (request.requestType === 'images' && Object.keys(imagesNeeded).length === 0) {
      const services = request.requestData?.wizardData?.services || request.requestData?.services || [];
      const defaultImages = [
        {
          label: 'Logo Navigation (clair)',
          filename: `${siteId}-logo-clair.png`,
          type: 'logo',
          description: 'Logo pour la navigation (fond clair)'
        },
        {
          label: 'Logo Footer (sombre)',
          filename: `${siteId}-logo-sombre.png`,
          type: 'logoFooter',
          description: 'Logo pour le pied de page (fond sombre)'
        },
        {
          label: 'Image Hero Bannière',
          filename: `${siteId}-hero.png`,
          type: 'hero',
          description: 'Image d\'accueil principale (bannière hero)'
        },
        {
          label: 'Favicon Clair',
          filename: `${siteId}-favicon-clair.png`,
          type: 'faviconLight',
          description: 'Icône du site pour thème clair (32x32px)'
        },
        {
          label: 'Favicon Sombre',
          filename: `${siteId}-favicon-sombre.png`,
          type: 'faviconDark',
          description: 'Icône du site pour thème sombre (32x32px)'
        }
      ];

      // Ajouter les images des services
      services.forEach((service: any, index: number) => {
        const serviceName = service.name || service.title || `Service ${index + 1}`;
        defaultImages.push({
          label: `Image Service - ${serviceName}`,
          filename: `${siteId}-service-${serviceName.toLowerCase().replace(/\s+/g, '-')}.png`,
          type: `service_${index}`,  // FIX: Use service_0, service_1, etc. consistently
          description: `Image pour le service: ${serviceName}`
        });
      });

      // V1 FALLBACK: Add blog article images if blog articles exist
      const blogArticles = request.requestData?.wizardData?.blog?.articles || request.requestData?.blog?.articles || [];
      if (blogArticles && Array.isArray(blogArticles) && blogArticles.length > 0) {
        blogArticles.forEach((article: any, index: number) => {
          const articleTitle = article.title || `Article ${index + 1}`;
          defaultImages.push({
            label: `Blog Article ${index + 1}: ${articleTitle}`,
            filename: `${siteId}-blog-${index + 1}.png`,
            type: `blog_${index}`,
            description: `Image pour l'article "${articleTitle}"`
          });
        });
      }

      return defaultImages;
    }

    if (imagesNeeded.logo) {
      imagesList.push({
        label: 'Logo Navigation (clair)',
        filename: `${siteId}-logo-clair.png`,
        type: 'logo',
        description: 'Logo pour la navigation (fond clair)'
      });
    }

    if (imagesNeeded.logoFooter) {
      imagesList.push({
        label: 'Logo Footer (sombre)',
        filename: `${siteId}-logo-sombre.png`,
        type: 'logoFooter',
        description: 'Logo pour le pied de page (fond sombre)'
      });
    }

    if (imagesNeeded.hero) {
      imagesList.push({
        label: 'Image Hero Bannière',
        filename: `${siteId}-hero.png`,
        type: 'hero',
        description: 'Image d\'accueil principale (bannière hero)'
      });
    }

    if (imagesNeeded.faviconLight) {
      imagesList.push({
        label: 'Favicon Clair',
        filename: `${siteId}-favicon-clair.png`,
        type: 'faviconLight',
        description: 'Icône du site pour thème clair (32x32px)'
      });
    }

    if (imagesNeeded.faviconDark) {
      imagesList.push({
        label: 'Favicon Sombre',
        filename: `${siteId}-favicon-sombre.png`,
        type: 'faviconDark',
        description: 'Icône du site pour thème sombre (32x32px)'
      });
    }

    // Service images
    if (imagesNeeded.services && Array.isArray(imagesNeeded.services)) {
      imagesNeeded.services.forEach((service: string, index: number) => {
        imagesList.push({
          label: `Service: ${service}`,
          filename: `${siteId}-service-${index + 1}.png`,
          type: `service_${index}`,  // FIX: Use service_0, service_1, etc. consistently
          description: `Image pour le service "${service}"`
        });
      });
    }

    // Blog article images from imagesNeeded
    if (imagesNeeded.blogArticles && Array.isArray(imagesNeeded.blogArticles)) {
      imagesNeeded.blogArticles.forEach((articleTitle: string, index: number) => {
        imagesList.push({
          label: `Blog Article ${index + 1}: ${articleTitle}`,
          filename: `${siteId}-blog-${index + 1}.png`,
          type: `blog_${index}`,
          description: `Image pour l'article "${articleTitle}"`
        });
      });
    } else {
      // Fallback: Blog article images from wizardData if not in imagesNeeded
      const blogArticles = request.requestData?.wizardData?.blog?.articles || request.requestData?.blog?.articles || [];
      if (blogArticles && Array.isArray(blogArticles) && blogArticles.length > 0) {
        blogArticles.forEach((article: any, index: number) => {
          const articleTitle = article.title || `Article ${index + 1}`;
          imagesList.push({
            label: `Blog Article ${index + 1}: ${articleTitle}`,
            filename: `${siteId}-blog-${index + 1}.png`,
            type: `blog_${index}`,
            description: `Image pour l'article "${articleTitle}"`
          });
        });
      }
    }

    return imagesList;
  };

  const imagesList = getImagesList();

  // Fetch comprehensive prompt from backend on component mount
  useEffect(() => {
    const fetchComprehensivePrompt = async () => {
      try {
        setPromptLoading(true);
        console.log(`🔄 Fetching comprehensive prompt for request ${request.id}...`);
        
        // Use proper API client with authentication and correct URL routing
        const token = localStorage.getItem('adminToken');
        if (!token) {
          console.error('❌ No admin token found, using fallback');
          setComprehensivePrompt(generatePromptFallback());
          return;
        }
        
        // Use nginx proxy route - empty baseURL for admin.logen.locod-ai.com
        const baseURL = window.location.hostname === 'admin.logen.locod-ai.com' ? '' : 'http://localhost:7600';
        const response = await fetch(`${baseURL}/admin/queue/${request.id}/prompt`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`📊 Response status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Comprehensive prompt loaded: ${data.prompt.length} characters`);
          setComprehensivePrompt(data.prompt);
        } else {
          console.warn(`⚠️ Backend failed with status ${response.status}, using fallback`);
          console.error('Response error:', await response.text());
          setComprehensivePrompt(generatePromptFallback());
        }
      } catch (error) {
        console.error('❌ Failed to fetch comprehensive prompt:', error);
        console.warn('🔄 Using fallback prompt generation');
        setComprehensivePrompt(generatePromptFallback());
      } finally {
        setPromptLoading(false);
      }
    };

    fetchComprehensivePrompt();
  }, [request.id]);

  // V1 Theme Detection Algorithm (from V1 legacy code)
  const detectSiteTheme = (requestData: any) => {
    const name = (requestData?.siteName || '').toLowerCase();
    const description = (requestData?.businessDescription || '').toLowerCase();
    const businessType = (request.businessType || '').toLowerCase();
    const content = JSON.stringify(requestData || {}).toLowerCase();

    const themeKeywords = {
      "calligraphie japonaise": ["calligraphie", "japonais", "shodo", "pinceau", "encre", "kanji", "kaisho", "sumi", "fude"],
      "traduction": ["traduction", "translate", "langue", "language", "interpreter", "multilingual", "global"],
      "technologie": ["tech", "software", "développement", "app", "digital", "code", "programming", "innovation"],
      "santé": ["santé", "health", "médical", "wellness", "thérapie", "medical", "care", "treatment"],
      "éducation": ["éducation", "formation", "cours", "école", "apprentissage", "learning", "teaching", "academic"],
      "plomberie": ["plombier", "plomberie", "plumbing", "canalisation", "eau", "sanitaire", "chauffage"],
      "boulangerie": ["boulangerie", "boulanger", "pain", "pâtisserie", "viennoiserie", "bakery"]
    };

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some(keyword =>
        name.includes(keyword) ||
        description.includes(keyword) ||
        businessType.includes(keyword) ||
        content.includes(keyword)
      )) {
        return theme;
      }
    }

    return "default";
  };

  // V1 Adaptive Prompt Templates (from V1 legacy code)
  const generateV1ImagePrompt = (type: string, requestData: any) => {
    const theme = detectSiteTheme(requestData);
    const siteName = requestData?.siteName || request.siteId;
    const primaryColor = requestData?.colors?.primary || '#4F46E5';
    const secondaryColor = requestData?.colors?.secondary || '#7C3AED';
    const style = requestData?.aiStyle || 'modern';

    const promptTemplates: any = {
      logo: {
        base: "Create a professional horizontal logo for '{siteName}' website. Include both an icon AND the text '{siteName}' clearly visible. Theme: {siteTheme}. Style: {logoStyle}. Colors: {primaryColor} and {secondaryColor}. The icon should be: {iconDescription}. Layout: icon on the left, text '{siteName}' on the right. Wide horizontal format (3:1 ratio). Clean, modern, professional design.",
        themes: {
          "calligraphie japonaise": {
            iconDescription: "a stylized Japanese brush (fude) or ink stone, elegant and minimalist",
            logoStyle: "Japanese-inspired, zen, elegant"
          },
          "traduction": {
            iconDescription: "abstract language symbols, speech bubbles, or translation arrows",
            logoStyle: "modern, international, professional"
          },
          "technologie": {
            iconDescription: "geometric tech symbols, circuit patterns, or digital elements",
            logoStyle: "modern, tech-forward, innovative"
          },
          "plomberie": {
            iconDescription: "stylized wrench, water drop, or pipe symbol",
            logoStyle: "professional, trustworthy, practical"
          },
          "boulangerie": {
            iconDescription: "wheat grain, bread loaf, or bakery oven symbol",
            logoStyle: "warm, artisanal, traditional"
          },
          "default": {
            iconDescription: "geometric shapes or abstract symbol representing the brand",
            logoStyle: "clean, professional, modern"
          }
        }
      },
      hero: {
        base: "Create a hero background image for {siteName}, a {siteTheme} website. Style: {heroStyle}. Mood: professional, welcoming. Colors palette: {primaryColor}, {secondaryColor}. Content: {heroDescription}. High quality, web-optimized, no text overlay.",
        themes: {
          "calligraphie japonaise": {
            heroDescription: "Traditional Japanese calligraphy workspace with brush, ink stone, rice paper, serene and minimalist atmosphere",
            heroStyle: "Traditional Japanese aesthetic, zen, natural lighting"
          },
          "traduction": {
            heroDescription: "Modern office setup with multiple language books, global communication concept",
            heroStyle: "Professional, international, modern workspace"
          },
          "technologie": {
            heroDescription: "Modern tech workspace with computers, code, digital interfaces",
            heroStyle: "Futuristic, innovative, high-tech environment"
          },
          "plomberie": {
            heroDescription: "Professional plumbing workspace with modern tools, clean pipes, quality craftsmanship",
            heroStyle: "Professional, reliable, trustworthy service environment"
          },
          "boulangerie": {
            heroDescription: "Warm bakery interior with fresh bread, artisanal ovens, welcoming atmosphere",
            heroStyle: "Warm, artisanal, traditional bakery aesthetic"
          },
          "default": {
            heroDescription: "Clean, professional workspace or abstract geometric background",
            heroStyle: "Modern, professional, clean"
          }
        }
      }
    };

    const template = promptTemplates[type];
    if (!template) return null;

    const themeConfig = template.themes[theme] || template.themes.default;

    let prompt = template.base
      .replace('{siteName}', siteName)
      .replace('{siteTheme}', theme)
      .replace('{primaryColor}', primaryColor)
      .replace('{secondaryColor}', secondaryColor);

    // Add theme-specific variables
    for (const [key, value] of Object.entries(themeConfig)) {
      prompt = prompt.replace(`{${key}}`, value as string);
    }

    return prompt;
  };

  // Enhanced prompt generation with V1 intelligence
  const generatePromptFallback = () => {
    const { requestType, businessType, requestData } = request;
    const siteName = requestData?.siteName || request.siteId;
    const detectedTheme = detectSiteTheme(requestData);
    
    // For 'content' requests, return a basic comprehensive prompt
    if (requestType === 'content') {
      return `Génère TOUT le contenu textuel pour un site de ${businessType}.
Site: ${siteName}
Business: ${businessType}
Terminologie: ${(request as any).terminology || 'services'}

Instructions:
- Génère du contenu professionnel et cohérent
- Format JSON strict requis
- Inclus OBLIGATOIREMENT: hero, services, about, testimonials, faq, blog (avec 3 articles), seo

IMPORTANT: Le format JSON DOIT inclure la section "blog" avec exactement 3 articles. Chaque article doit avoir: title, excerpt, content, category, tags.`;
    }
    
    // V1 Enhanced Image generation prompts with theme intelligence
    const imageTypes = ['images', 'hero', 'logo', 'banner', 'gallery'];
    if (imageTypes.includes(requestType)) {
      const style = requestData?.aiStyle || 'modern';
      const colors = requestData?.colors || {};
      const imagesNeeded = requestData?.imagesNeeded || {};

      const costInfo = calculateImageCost(requestData);

      let prompts = `🎨 PROMPTS DE GÉNÉRATION D'IMAGES (V1 Intelligence)

📊 ANALYSE AUTOMATIQUE:
• Site: ${siteName}
• Business: ${businessType}
• Thème détecté: ${detectedTheme.toUpperCase()}
• Style: ${style}
• Couleurs: ${colors.primary || '#4F46E5'}, ${colors.secondary || '#7C3AED'}

💰 ESTIMATION COÛT V1:
• Nombre d'images: ${costInfo.imageCount}
• Coût par image: $${costInfo.costPerImage} (DALL-E)
• TOTAL ESTIMÉ: ${costInfo.formattedCost}
• ⚠️ Confirmation requise avant génération

🔄 WORKFLOW V1:
1. Copiez chaque prompt → DALL-E/Midjourney/Claude
2. Confirmez le coût estimé ${costInfo.formattedCost}
3. Uploadez les images générées ci-dessous
4. L'application renommera automatiquement

📌 PROMPTS ADAPTATIFS (THÈME: ${detectedTheme}):

`;

      // Generate smart prompts for each image type
      let imageCount = 0;

      if (imagesNeeded.logo) {
        imageCount++;
        const logoPrompt = generateV1ImagePrompt('logo', requestData);
        prompts += `${imageCount}. LOGO NAVIGATION\nPrompt V1: "${logoPrompt}"\nFilename: ${siteName}-logo-clair.png\n\n`;
      }

      if (imagesNeeded.logoFooter) {
        imageCount++;
        const logoPrompt = generateV1ImagePrompt('logo', requestData)?.replace('(clair)', '(sombre)').replace('light', 'dark');
        prompts += `${imageCount}. LOGO FOOTER\nPrompt V1: "${logoPrompt} - Dark version suitable for dark backgrounds"\nFilename: ${siteName}-logo-sombre.png\n\n`;
      }

      if (imagesNeeded.hero) {
        imageCount++;
        const heroPrompt = generateV1ImagePrompt('hero', requestData);
        prompts += `${imageCount}. IMAGE HERO BANNIÈRE\nPrompt V1: "${heroPrompt}"\nFilename: ${siteName}-hero.png\nDimensions: 1792x1024\n\n`;
      }

      if (imagesNeeded.faviconLight) {
        imageCount++;
        prompts += `${imageCount}. FAVICON CLAIR\nPrompt V1: "Create a simple favicon icon for ${siteName}, ${detectedTheme} theme. 32x32 pixels, clear on light backgrounds. Minimalist design."\nFilename: ${siteName}-favicon-clair.png\n\n`;
      }

      if (imagesNeeded.faviconDark) {
        imageCount++;
        prompts += `${imageCount}. FAVICON SOMBRE\nPrompt V1: "Create a simple favicon icon for ${siteName}, ${detectedTheme} theme. 32x32 pixels, clear on dark backgrounds. Minimalist design."\nFilename: ${siteName}-favicon-sombre.png\n\n`;
      }

      // Service images
      if (imagesNeeded.services && Array.isArray(imagesNeeded.services)) {
        imagesNeeded.services.forEach((serviceName: string, index: number) => {
          imageCount++;
          prompts += `${imageCount}. SERVICE: ${serviceName.toUpperCase()}\nPrompt V1: "Create a professional image representing '${serviceName}' for a ${detectedTheme} ${businessType} website. Style: ${style}. Colors: ${colors.primary || '#4F46E5'}, ${colors.secondary || '#7C3AED'}. High-quality, web-optimized."\nFilename: ${siteName}-service-${index + 1}.png\n\n`;
        });
      }

      // Blog article images (one per article)
      const blogArticles = requestData?.wizardData?.blog?.articles || requestData?.blog?.articles || [];
      if (blogArticles && Array.isArray(blogArticles) && blogArticles.length > 0) {
        blogArticles.forEach((article: any, index: number) => {
          const articleTitle = article.title || `Article ${index + 1}`;
          const articleSummary = article.summary || article.excerpt || '';
          imageCount++;
          prompts += `${imageCount}. BLOG ARTICLE ${index + 1}: ${articleTitle.toUpperCase()}\nPrompt V1: "Create an illustration for the blog article '${articleTitle}' for a ${businessType} website. ${articleSummary ? `Topic: ${articleSummary}. ` : ''}Style: ${style}, professional, illustrating the article subject. Colors: ${colors.primary || '#4F46E5'}, ${colors.secondary || '#7C3AED'}. Format: 1200x600. High-quality, no text overlay."\nFilename: ${siteName}-blog-${index + 1}.png\n\n`;
        });
      }

      prompts += `\n🎯 THÈME "${detectedTheme.toUpperCase()}" DÉTECTÉ:\n`;
      if (detectedTheme === 'calligraphie japonaise') {
        prompts += `• Style zen, minimaliste, esthétique japonaise traditionnelle\n• Éléments: pinceaux, encre, papier de riz\n• Couleurs naturelles et épurées`;
      } else if (detectedTheme === 'traduction') {
        prompts += `• Style professionnel, international\n• Éléments: langues, communication globale\n• Couleurs modernes et corporate`;
      } else if (detectedTheme === 'plomberie') {
        prompts += `• Style pratique, fiable, professionnel\n• Éléments: outils, tuyauterie, eau\n• Couleurs bleu/gris professionnelles`;
      } else if (detectedTheme === 'boulangerie') {
        prompts += `• Style chaleureux, artisanal, traditionnel\n• Éléments: pain, four, blé\n• Couleurs chaudes et accueillantes`;
      } else {
        prompts += `• Style moderne et professionnel\n• Éléments adaptés au secteur d'activité\n• Couleurs cohérentes avec la marque`;
      }

      return prompts;
    }

    // Text content prompts
    const prompts = {
      services: `Génère 5 services professionnels pour un site de ${businessType}.
Site: ${siteName}
Business: ${businessType}
Terminologie: services

Format JSON:
{
  "services": [
    {
      "title": "Nom du service",
      "description": "Description détaillée",
      "features": ["Caractéristique 1", "Caractéristique 2", "Caractéristique 3"]
    }
  ]
}`,
      about: `Génère le contenu "À propos" pour ${siteName}.
Business: ${businessType}

Format JSON:
{
  "title": "À propos de ${siteName}",
  "subtitle": "Sous-titre engageant",
  "description": "Présentation de l'entreprise (3-4 phrases)",
  "values": [
    {"title": "Valeur 1", "description": "Description valeur 1"},
    {"title": "Valeur 2", "description": "Description valeur 2"},
    {"title": "Valeur 3", "description": "Description valeur 3"}
  ]
}`,
      hero: `Génère le contenu hero pour un site de ${businessType}.
Site: ${siteName}
Business: ${businessType}

Format JSON:
{
  "title": "Titre accrocheur (max 60 caractères)",
  "subtitle": "Sous-titre descriptif",
  "description": "Description engageante (2-3 phrases)"
}`,
      testimonials: `Génère 3 témoignages réalistes pour ${siteName}.
Business: ${businessType}

Format JSON:
{
  "testimonials": [
    {
      "text": "Témoignage authentique (2-3 phrases)",
      "name": "Prénom Nom",
      "position": "Poste, Entreprise",
      "rating": 5
    }
  ]
}`,
      faq: `Génère 6 questions fréquentes pour ${siteName}.
Business: ${businessType}

Format JSON:
{
  "faq": [
    {
      "question": "Question fréquente?",
      "answer": "Réponse détaillée et professionnelle"
    }
  ]
}`,
      seo: `Génère le contenu SEO pour ${siteName}.
Business: ${businessType}

Format JSON:
{
  "title": "Titre SEO optimisé (max 60 caractères)",
  "description": "Meta description (150-160 caractères)",
  "keywords": ["mot-clé 1", "mot-clé 2", "mot-clé 3"]
}`
    };

    return prompts[requestType as keyof typeof prompts] || `Génère du contenu ${requestType} pour ${siteName} (${businessType})`;
  };

  // V1 Cost Estimation System
  const calculateImageCost = (requestData: any) => {
    const imagesNeeded = requestData?.imagesNeeded || {};
    let imageCount = 0;

    // Count each image type
    if (imagesNeeded.logo) imageCount++;
    if (imagesNeeded.logoFooter) imageCount++;
    if (imagesNeeded.hero) imageCount++;
    if (imagesNeeded.faviconLight) imageCount++;
    if (imagesNeeded.faviconDark) imageCount++;
    if (imagesNeeded.services && Array.isArray(imagesNeeded.services)) {
      imageCount += imagesNeeded.services.length;
    }

    const costPerImage = 0.50; // DALL-E cost
    const totalCost = imageCount * costPerImage;

    return {
      imageCount,
      costPerImage,
      totalCost,
      formattedCost: `$${totalCost.toFixed(2)}`
    };
  };

  // Get the current prompt (comprehensive from backend or fallback)
  const getCurrentPrompt = () => {
    return comprehensivePrompt || generatePromptFallback();
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(getCurrentPrompt());
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy prompt:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('❌ Seuls les fichiers image sont acceptés');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('❌ Fichier trop volumineux (max 10MB)');
      return;
    }

    // Show immediate preview while uploading to server
    const preview = URL.createObjectURL(file);
    setUploadedImages(prev => ({ ...prev, [index]: preview }));

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const dataUrl = e.target?.result as string;
        const imageInfo = imagesList[index];

        console.log(`🔄 [DRAFT SAVE] Starting save for ${imageInfo.type} (index ${index})`);
        console.log(`📋 [DRAFT SAVE] Request ID: ${request.id}`);
        console.log(`📋 [DRAFT SAVE] Filename: ${imageInfo.filename}`);
        console.log(`📋 [DRAFT SAVE] DataURL length: ${dataUrl?.length || 0} bytes`);

        // Save to SERVER immediately (persistent storage)
        const token = localStorage.getItem('adminToken');
        if (!token) {
          console.error('❌ [DRAFT SAVE] No admin token found');
          alert('❌ Token d\'authentification manquant');
          return;
        }
        console.log(`✅ [DRAFT SAVE] Token found: ${token.substring(0, 20)}...`);

        // V2.2 FIX: Use backend URL for upload (same fix as load)
        const uploadBaseURL = window.location.hostname === 'admin.logen.locod-ai.com' ? 'https://logen.locod-ai.com' : 'http://localhost:7600';
        const endpoint = `${uploadBaseURL}/admin/ai-requests/${request.id}/images-draft`;
        console.log(`🌐 [DRAFT SAVE] Calling PUT ${endpoint}`);

        const payload = {
          role: imageInfo.type,
          filename: imageInfo.filename,
          dataUrl
        };
        console.log(`📤 [DRAFT SAVE] Payload: role=${payload.role}, filename=${payload.filename}, dataUrl=${payload.dataUrl.substring(0, 50)}...`);

        const response = await fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        console.log(`📥 [DRAFT SAVE] Response status: ${response.status} ${response.statusText}`);

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ [DRAFT SAVE] Success! Response:`, result);

          // Replace preview with server public URL (persistent)
          // Add timestamp to bust browser cache when replacing images
          const urlWithCacheBuster = `${result.image.url}?t=${Date.now()}`;
          setUploadedImages(prev => ({
            ...prev,
            [index]: urlWithCacheBuster
          }));

          console.log(`✅ Server-side draft saved: ${imageInfo.type} -> ${urlWithCacheBuster}`);

          // Clean up object URL to free memory
          URL.revokeObjectURL(preview);
        } else {
          const error = await response.text();
          console.error(`❌ [DRAFT SAVE] Server returned error:`, error);
          console.error('Server draft save failed:', error);
          alert('❌ Erreur de sauvegarde sur le serveur');
        }
      } catch (error) {
        console.error(`❌ [DRAFT SAVE] Exception caught:`, error);
        console.error('Draft upload failed:', error);
        alert('❌ Erreur de sauvegarde (brouillon)');
        // Keep the preview - user can still see the image locally
      }
    };
    reader.onerror = () => {
      alert('❌ Erreur lors de la lecture du fichier');
    };
    reader.readAsDataURL(file);
  };

  const handleImageDrop = (event: React.DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const fakeEvent = {
        target: { files: files }
      } as React.ChangeEvent<HTMLInputElement>;
      handleImageUpload(fakeEvent, index);
    }
  };

  const triggerFileUpload = (index: number) => {
    fileInputRefs.current[index]?.click();
  };

  const uploadedCount = Object.keys(uploadedImages).length;

  const handleComplete = async () => {
    const imageTypes = ['images', 'hero', 'logo', 'banner', 'gallery'];
    if (imageTypes.includes(request.requestType)) {
      // Check if image data is provided via "Résultat IA" JSON (like content workflow)
      if (generatedContent.trim()) {
        console.log('🎨 Using image data from Résultat IA (JSON workflow)');
        setLoading(true);
        try {
          await onComplete(request, generatedContent);
          console.log('✅ Image request completed via JSON workflow');
        } catch (error) {
          console.error('Error completing image request via JSON:', error);
        } finally {
          setLoading(false);
        }
        return;
      }

      // Fallback to file upload workflow
      // CRITICAL FIX: Allow partial uploads for testing - at least 1 image required
      if (uploadedCount === 0) {
        alert(`Veuillez uploader au moins une image ou remplir le champ "Résultat IA"`);
        return;
      }

      // Show confirmation for partial uploads
      if (uploadedCount < imagesList.length) {
        const proceed = confirm(`Vous avez uploadé ${uploadedCount}/${imagesList.length} images. Voulez-vous continuer avec les images disponibles?`);
        if (!proceed) return;
      }

      // CRITICAL V2.1 FIX: Save all uploaded images as drafts BEFORE completion
      // This ensures images persist even if onChange wasn't triggered (e.g., Playwright tests)
      console.log(`🔄 [V2.1] Saving ${uploadedCount} images as drafts before completion...`);

      const token = localStorage.getItem('adminToken');
      const baseURL = window.location.hostname === 'admin.logen.locod-ai.com' ? '' : 'http://localhost:7600';

      let draftsSaved = 0;
      for (let index = 0; index < imagesList.length; index++) {
        if (uploadedImages[index]) {
          const imageInfo = imagesList[index];
          const imageUrl = uploadedImages[index];

          // Skip if already a server URL (already saved as draft)
          if (imageUrl.startsWith('/uploads/requests/')) {
            console.log(`✅ [V2.1] Image ${index} already persisted: ${imageInfo.type}`);
            draftsSaved++;
            continue;
          }

          // Convert blob URL or data URL to dataUrl for server
          let dataUrl = imageUrl;
          if (imageUrl.startsWith('blob:')) {
            console.log(`🔄 [V2.1] Converting blob URL to dataUrl for ${imageInfo.type}...`);
            try {
              const response = await fetch(imageUrl);
              const blob = await response.blob();
              dataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
              console.log(`✅ [V2.1] Converted blob to dataUrl (${dataUrl.length} bytes)`);
            } catch (error) {
              console.error(`❌ [V2.1] Failed to convert blob for ${imageInfo.type}:`, error);
              continue;
            }
          }

          // Save to server
          try {
            console.log(`📤 [V2.1] Saving draft: ${imageInfo.type} (${imageInfo.filename})`);
            const response = await fetch(`${baseURL}/admin/ai-requests/${request.id}/images-draft`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                role: imageInfo.type,
                filename: imageInfo.filename,
                dataUrl
              })
            });

            if (response.ok) {
              const result = await response.json();
              console.log(`✅ [V2.1] Draft saved: ${imageInfo.type} -> ${result.image.url}`);
              draftsSaved++;

              // Update uploadedImages with server URL
              setUploadedImages(prev => ({
                ...prev,
                [index]: result.image.url
              }));
            } else {
              const error = await response.text();
              console.error(`❌ [V2.1] Failed to save draft ${imageInfo.type}:`, error);
            }
          } catch (error) {
            console.error(`❌ [V2.1] Exception saving draft ${imageInfo.type}:`, error);
          }
        }
      }

      console.log(`✅ [V2.1] Saved ${draftsSaved}/${uploadedCount} images as drafts`);

      // Prepare image data with proper filenames
      const imageData: Record<string, any> = {};
      imagesList.forEach((imageInfo, index) => {
        if (uploadedImages[index]) {
          imageData[imageInfo.type] = {
            filename: imageInfo.filename,
            data: uploadedImages[index]
          };
        }
      });

      setLoading(true);
      try {
        await onComplete(request, JSON.stringify(imageData));
        console.log('✅ Image request completed via file upload workflow');
        console.log(`✅ ${draftsSaved} draft images will persist on server for future reference`);
      } catch (error) {
        console.error('Error completing image request:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // Text content request
      if (!generatedContent.trim()) return;
      
      setLoading(true);
      try {
        await onComplete(request, generatedContent);
      } catch (error) {
        console.error('Error completing request:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[95vw] max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  🤖 Traiter - Demande #{request.id}
                </h2>
                <p className="text-blue-100 text-sm">
                  {request.requestType === 'images' ? '🎨 Interface de génération d\'images' : '📝 Interface de génération de contenu'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-2 rounded-lg hover:bg-white hover:bg-opacity-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content - Two Column Layout */}
        <div className="flex h-full max-h-[calc(95vh-140px)]">
          {/* Left Column - Prompt Suggéré */}
          <div className="w-1/2 bg-blue-50 border-r border-gray-200 flex flex-col">
            <div className="px-6 py-4 border-b border-blue-200 bg-blue-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-blue-900 text-lg">📋 Prompt Suggéré</h3>
                <button
                  onClick={handleCopyPrompt}
                  className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  📋 Copier
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-white rounded-lg border border-blue-200 p-4">
                {promptLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                    <span className="text-blue-700">Génération du prompt complet...</span>
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap text-sm text-blue-800 overflow-x-auto">
                    {getCurrentPrompt()}
                  </pre>
                )}
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Informations de la Demande</h4>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div><strong>Site:</strong> {request.requestData?.siteName || request.siteId}</div>
                  <div><strong>Business:</strong> {request.businessType}</div>
                  <div><strong>Type:</strong> {request.requestType}</div>
                  <div><strong>Customer:</strong> {request.customerId}</div>
                </div>
              </div>

              {/* V1 Cost Protection Warning */}
              {request.requestType === 'images' && (
                <div className="bg-red-50 rounded-lg border border-red-200 p-4 mb-4">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 18.5c-.77.833-.23 2.5 1.732 2.5z" />
                    </svg>
                    <h4 className="font-medium text-red-800">💰 Protection Coût V1</h4>
                  </div>
                  <p className="text-sm text-red-700 mb-2">
                    Génération IA coûteuse détectée. Estimation: <strong>{(() => {
                      const costInfo = calculateImageCost(request.requestData);
                      return costInfo.formattedCost;
                    })()}</strong>
                  </p>
                  <p className="text-xs text-red-600">
                    ⚠️ Vérifiez le nombre d'images avant génération externe
                  </p>
                </div>
              )}

              <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
                <h4 className="font-medium text-amber-800 mb-2">🔄 Workflow V1</h4>
                <ol className="text-sm text-amber-700 space-y-1">
                  <li>1. Copier le prompt → DALL-E/Claude/ChatGPT</li>
                  <li>2. Confirmer le coût estimé</li>
                  <li>3. Coller le résultat dans la section droite</li>
                  <li>3. Cliquer "Appliquer & Terminer"</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Right Column - Résultat IA */}
          <div className="w-1/2 bg-gray-50 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-100">
              <h3 className="font-semibold text-gray-900 text-lg">
                {request.requestType === 'images' ? '🎨 Images Générées' : '🤖 Résultat IA'}
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {request.requestType === 'images' ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>🖼️ Upload d'Images:</strong> Uploadez les fichiers générés dans les champs ci-dessous. Les images seront automatiquement renommées avec le préfixe du site.
                    </p>
                  </div>
                  
                  {/* Image upload grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {imagesList.map((imageInfo, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
                        <div className="text-sm font-medium mb-1">{imageInfo.label}</div>
                        {imageInfo.description && (
                          <div className="text-xs text-gray-600 mb-2">{imageInfo.description}</div>
                        )}
                        <div className="text-xs text-gray-500 mb-2">
                          <span className="text-gray-400">Nom final:</span> 
                          <code className="bg-gray-100 px-1 rounded text-xs ml-1">{imageInfo.filename}</code>
                        </div>
                        
                        {/* Upload area */}
                        <div 
                          onDrop={(e) => handleImageDrop(e, index)} 
                          onDragOver={(e) => e.preventDefault()} 
                          onDragEnter={(e) => e.preventDefault()}
                          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 cursor-pointer transition-colors" 
                          onClick={() => triggerFileUpload(index)}
                        >
                          {!uploadedImages[index] ? (
                            <div>
                              <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                              </svg>
                              <p className="text-xs text-gray-600">Cliquez ou glissez</p>
                            </div>
                          ) : (
                            <div>
                              <img
                                src={
                                  uploadedImages[index].startsWith('/uploads/') || uploadedImages[index].includes('/uploads/')
                                    ? `${baseURL}${uploadedImages[index]}`
                                    : uploadedImages[index]
                                }
                                alt=""
                                className="max-h-20 mx-auto mb-2 rounded pointer-events-none"
                                crossOrigin="anonymous"
                                key={uploadedImages[index]}
                              />
                              <p className="text-xs text-green-600 font-medium">✓ Uploadé</p>
                              <p className="text-xs text-gray-500 mt-1">Cliquer pour changer</p>
                              {(uploadedImages[index].startsWith('/uploads/') || uploadedImages[index].includes('/uploads/')) && (
                                <a
                                  href={`${baseURL}${uploadedImages[index].split('?')[0]}`}
                                  download
                                  className="text-xs text-blue-600 hover:underline block mt-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  📥 Télécharger
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                        <input 
                          type="file" 
                          onChange={(e) => handleImageUpload(e, index)} 
                          accept="image/*" 
                          className="hidden" 
                          ref={el => { fileInputRefs.current[index] = el; }}
                        />
                      </div>
                    ))}
                  </div>
                  
                  {uploadedCount > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-800">
                        Images uploadées: <strong>{uploadedCount} / {imagesList.length}</strong>
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {request.status === 'completed' ? 'Contenu Généré (Terminé)' : 'Résultat Généré par l\'IA'}
                      {request.status === 'completed' && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✅ Complété
                        </span>
                      )}
                    </label>
                    <textarea
                      value={generatedContent}
                      onChange={(e) => setGeneratedContent(e.target.value)}
                      readOnly={request.status === 'completed'}
                      className={`w-full h-80 p-4 border rounded-lg font-mono text-sm resize-none ${
                        request.status === 'completed' 
                          ? 'border-green-300 bg-green-50 text-green-800 cursor-not-allowed' 
                          : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder={request.status === 'completed' ? 'Contenu généré...' : "Collez ici le contenu généré par Claude/ChatGPT..."}
                    />
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">✅ Validation</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Format JSON valide requis</li>
                      <li>• Contenu en français</li>
                      <li>• Longueur appropriée pour le web</li>
                      <li>• Style professionnel</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-5 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>Demande créée: {new Date(request.createdAt).toLocaleDateString('fr-FR')}</span>
            <span>•</span>
            <span>Statut: {request.status}</span>
            {request.requestType === 'images' && uploadedCount > 0 && (
              <>
                <span>•</span>
                <span className="text-green-600 font-medium">Images: {uploadedCount}/{imagesList.length}</span>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              {request.status === 'completed' ? 'Fermer' : 'Annuler'}
            </button>
            
            {request.status !== 'completed' && (
              <button
                onClick={handleComplete}
                disabled={loading || ((['images', 'hero', 'logo', 'banner', 'gallery'].includes(request.requestType)) ? (uploadedCount === 0 && !generatedContent.trim()) : !generatedContent.trim())}
                className="px-8 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Traitement...
                  </div>
                ) : (
                  '✅ Appliquer & Terminer'
                )}
              </button>
            )}
            
            {request.status === 'completed' && (
              <div className="flex items-center text-sm text-green-600 bg-green-50 px-4 py-3 rounded-lg border border-green-200">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Demande terminée avec succès
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}