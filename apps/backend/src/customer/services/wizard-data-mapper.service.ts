import { Injectable } from '@nestjs/common';
import { WizardSession } from '../entities/wizard-session.entity';

/**
 * WizardDataMapperService
 *
 * Transforms V2 wizardData (PostgreSQL JSONB) to V1 site-config.json format.
 * This service bridges the new wizard format with the legacy generator system.
 *
 * Related: Issue #137 - Step 7: Review & Site Generation
 */
@Injectable()
export class WizardDataMapperService {
  /**
   * Transform complete wizard session data to V1 site-config.json format
   * Matches the structure expected by generate.sh script
   * Supports both V1 (flat) and V2 (step-based) wizard formats
   */
  async transformToSiteConfig(session: WizardSession): Promise<any> {
    const wizardData = session.wizardData || {};

    // Detect format: V2 (step-based) or V1 (flat)
    const isV2Format = wizardData.step0 !== undefined;

    // Extract business name from either format
    let businessName: string;
    if (isV2Format) {
      businessName = wizardData.step0?.businessName || 'Website';
    } else {
      // V1 format: try siteName from session, then about.title from wizardData
      businessName =
        session.siteName ||
        wizardData.siteName ||
        wizardData.about?.title ||
        wizardData.hero?.title ||
        'Website';
      console.log(
        `[V1 Mapper] session.siteName="${session.siteName}", wizardData.siteName="${wizardData.siteName}", wizardData.about?.title="${wizardData.about?.title}", wizardData.hero?.title="${wizardData.hero?.title}" => businessName="${businessName}"`,
      );
    }

    const siteId = this.generateSiteId(businessName);

    // If V1 flat format, transform to proper structure
    if (!isV2Format) {
      return this.transformV1ToStructured(
        wizardData,
        session,
        siteId,
        businessName,
      );
    }

    // V2 format: transform step-based data to V1 flat format
    return {
      meta: {
        siteId,
        domain: `${siteId}.locod-ai.com`,
        language: 'fr',
        timezone: 'Europe/Paris',
        template: 'template-basic',
      },

      businessType: wizardData.step0?.businessType || 'business',
      terminology: 'services',

      brand: {
        name: businessName,
        slogan: wizardData.step0?.activityDescription || '',
        logos: {
          navbar:
            this.extractFilename(wizardData.step1?.logoLight) ||
            `${siteId}-logo-clair.png`,
          footer:
            this.extractFilename(wizardData.step1?.logoDark) ||
            `${siteId}-logo-sombre.png`,
        },
        favicons: {
          light:
            this.extractFilename(wizardData.step5?.favicon) ||
            `${siteId}-favicon-clair.png`,
          dark:
            this.extractFilename(wizardData.step5?.favicon) ||
            `${siteId}-favicon-sombre.png`,
        },
        colors: {
          primary: wizardData.step1?.primaryColor || '#4F46E5',
          secondary: wizardData.step1?.secondaryColor || '#7C3AED',
          accent: wizardData.step1?.accentColor || '#A78BFA',
        },
      },

      design: {
        colorScheme: wizardData.step2?.selectedLayout || 'vibrant',
      },

      sections: {
        hero: {
          background: wizardData.step1?.primaryColor || '#4F46E5',
          textColor: '#FFFFFF',
        },
      },

      routing: {
        enabledRoutes: ['home', 'services', 'about', 'contact'],
      },

      navbar: {
        background: wizardData.step1?.backgroundColor || '#FFFFFF',
        textColor: wizardData.step1?.textColor || '#1F2937',
        accentColor: wizardData.step1?.primaryColor || '#4F46E5',
      },

      footer: {
        background: '#1F2937',
        textColor: '#FFFFFF',
      },

      navigation: {
        links: [
          { name: 'Accueil', path: '/' },
          { name: 'Services', path: '/services' },
          { name: 'À propos', path: '/about' },
        ],
        cta: {
          text: 'Contactez-nous',
          path: '/contact',
        },
      },

      content: {
        hero: {
          title: wizardData.step3?.hero?.title || businessName,
          subtitle: wizardData.step3?.hero?.subtitle || '',
          ctaText: 'Get Started',
          ctaLink: '/contact',
        },
        services: wizardData.step3?.services || [],
        about: {
          title: wizardData.step3?.about?.title || 'À propos',
          content: wizardData.step3?.about?.content || '',
        },
        testimonials: [],
        faq: wizardData.step3?.faq || [],
      },

      contact: {
        email: wizardData.step3?.contact?.email || '',
        phone: wizardData.step3?.contact?.phone || '',
        address: wizardData.step3?.contact?.address || '',
        socialLinks: wizardData.step3?.contact?.socialLinks || {},
      },

      features: {
        blog: false,
        testimonials: false,
        faq: (wizardData.step3?.faq || []).length > 0,
        newsletter: false,
      },

      integrations: {
        n8n: {
          enabled: wizardData.step6?.features?.n8nAutomation ?? false,
          instance: '',
          workflows: {},
        },
        analytics: {
          googleAnalytics: wizardData.step6?.googleAnalyticsId || '',
        },
        security: {
          captcha: {
            enabled: wizardData.step6?.features?.recaptcha ?? false,
            provider: wizardData.step6?.features?.recaptcha ? 'recaptcha' : '',
            siteKey: wizardData.step6?.recaptchaSiteKey || '',
          },
        },
      },

      seo: {
        title: `${businessName} - ${wizardData.step0?.activityDescription || 'Website'}`,
        description:
          wizardData.step2?.description ||
          wizardData.step0?.activityDescription ||
          '',
        keywords: [],
      },
    };
  }

  /**
   * Transform V1 flat wizard data to proper structured site-config format
   * Maps flat fields to nested brand/content/navigation/routing/layout structure
   */
  private transformV1ToStructured(
    wizardData: any,
    session: WizardSession,
    siteId: string,
    businessName: string,
  ): any {
    console.log(
      `[V1→Structured] Transforming flat wizard data for siteId: ${siteId}`,
    );

    // Normalize image paths (remove /uploads/sessions/ prefix and ?t= query params)
    const normalizeImagePath = (path: string | undefined): string => {
      if (!path) return '';
      // Extract just the filename from /uploads/sessions/{sessionId}/filename.png?t=timestamp
      const filename = path.split('/').pop()?.split('?')[0] || '';
      return filename;
    };

    // Extract colors from wizard data or use defaults
    // Colors are saved to wizardData.colors.* by frontend (Step 5)
    const primaryColor = wizardData.colors?.primary || '#4F46E5';
    const secondaryColor = wizardData.colors?.secondary || '#7C3AED';
    const accentColor = wizardData.colors?.accent || '#A78BFA';

    // Build structured config matching qalyjap-3006 format
    return {
      meta: {
        siteId,
        domain: `${siteId}.locod-ai.com`,
        language: wizardData.siteLanguage || wizardData.meta?.language || 'fr',
        timezone: wizardData.meta?.timezone || 'Europe/Paris',
        template:
          wizardData.selectedTemplate ||
          wizardData.meta?.template ||
          'template-basic',
      },

      deployment: {
        // Will be filled by orchestrator during deployment
        port: null,
        server: '162.55.213.90',
      },

      api: {
        // Extract from integrations if present
        openai: wizardData.api?.openai || '',
      },

      brand: {
        name: wizardData.siteName || businessName,
        slogan: wizardData.slogan || wizardData.hero?.subtitle || '',
        logos: {
          navbar:
            normalizeImagePath(wizardData.images?.logo) ||
            `${siteId}-logo-clair.png`,
          footer:
            normalizeImagePath(wizardData.images?.logoFooter) ||
            `${siteId}-logo-sombre.png`,
          default:
            normalizeImagePath(wizardData.images?.logo) || `${siteId}-logo.png`,
        },
        favicons: {
          light:
            normalizeImagePath(wizardData.images?.faviconLight) ||
            `${siteId}-favicon-clair.png`,
          dark:
            normalizeImagePath(wizardData.images?.faviconDark) ||
            `${siteId}-favicon-sombre.png`,
          default:
            normalizeImagePath(wizardData.images?.faviconLight) ||
            `${siteId}-favicon.ico`,
        },
        colors: {
          primary: primaryColor,
          secondary: secondaryColor,
          accent: accentColor,
        },
      },

      design: {
        pageHeaders: {
          background: { type: 'solid', color: primaryColor },
          title: {
            color: '#FFFFFF',
            size: 'text-3xl md:text-4xl',
            weight: 'font-bold',
            margin: 'mb-4',
          },
          subtitle: {
            color: '#FFFFFF',
            size: 'text-lg md:text-xl',
            weight: 'font-medium',
            margin: 'mb-6',
          },
        },
        textColors: {
          primary: '#1F2937',
          secondary: '#4B5563',
          muted: '#9CA3AF',
        },
      },

      sections: this.generateSectionStyles(primaryColor, secondaryColor),

      layout: {
        components: {
          pageHeader: {
            spacing: 'pt-16 pb-8 md:pt-20 md:pb-12',
            titleSize: 'text-3xl md:text-4xl lg:text-5xl',
            subtitleSize: 'text-lg md:text-xl',
            titleMargin: 'mb-4',
            subtitleMargin: 'mb-6',
          },
          section: {
            spacing: 'py-20',
            spacingSmall: 'py-16',
          },
        },
      },

      routing: {
        scrollBehavior: 'smooth',
        scrollOffset: 80,
        routes: {
          '/': { scroll: 'top' },
          '/services': { scroll: 'top' },
          '/service/*': { scroll: 'top' },
          '/blog': { scroll: 'top' },
          '/contact': { scroll: 'top', anchor: 'contact-form' },
          '/about': { scroll: 'top' },
        },
      },

      navbar: {
        contrast: 'medium',
        tone: 'elegant',
        background: '#FFFFFF',
        textColor: primaryColor,
        accentColor: primaryColor,
      },

      footer: {
        background: primaryColor,
        textColor: '#F5F5F5',
      },

      navigation: {
        links: [
          { name: 'Accueil', path: '/' },
          { name: 'Services', path: '/services' },
          ...(wizardData.enableBlog || wizardData.blog
            ? [{ name: 'Blog', path: '/blog' }]
            : []),
          { name: 'À propos', path: '/about' },
        ],
        cta: {
          text: 'Contactez-nous',
          path: '/contact',
        },
      },

      content: {
        hero: {
          title:
            wizardData.hero?.title ||
            wizardData.heroContent?.title ||
            `Bienvenue chez ${businessName}`,
          subtitle:
            wizardData.hero?.subtitle || wizardData.heroContent?.subtitle || '',
          description:
            wizardData.hero?.description ||
            wizardData.heroContent?.description ||
            '',
          image: normalizeImagePath(wizardData.images?.hero),
          cta: {
            primary: 'Découvrir nos services',
            secondary: 'En savoir plus',
          },
        },
        services: this.transformServices(
          wizardData.services || [],
          wizardData.images,
        ),
        images: this.extractServiceImages(wizardData.images),
        servicesSection: {
          viewAllText: 'Voir tous nos services',
          learnMoreText: 'En savoir plus',
        },
        servicesPage: {
          subtitle: 'Découvrez nos différents services adaptés à vos besoins',
          ctaTitle: 'Prêt à démarrer ?',
          ctaDescription: 'Contactez-nous pour en savoir plus sur nos services',
          ctaButton: 'Nous contacter',
        },
        contactPage: {
          title: 'Contactez-nous',
          description: "N'hésitez pas à nous contacter pour toute question",
          formTitle: 'Envoyez-nous un message',
          infoTitle: 'Nos informations',
        },
        about: {
          title:
            wizardData.about?.title ||
            wizardData.aboutContent?.title ||
            'À propos',
          subtitle:
            wizardData.about?.subtitle ||
            wizardData.aboutContent?.subtitle ||
            '',
          description:
            wizardData.about?.description ||
            wizardData.aboutContent?.description ||
            '',
          values:
            wizardData.about?.values || wizardData.aboutContent?.values || [],
        },
        aboutCta: {
          title: 'Découvrez-en plus',
          description: 'Contactez-nous pour en savoir plus sur notre approche',
          buttonText: 'Nous contacter',
        },
        valuesSection: {
          title: 'Nos Valeurs',
          description: 'Les principes qui guident notre travail',
        },
        testimonials: wizardData.testimonials || [],
        faq: wizardData.faq || [],
        blog: wizardData.blog
          ? {
              title: wizardData.blog.title || 'Blog',
              description:
                wizardData.blog.description ||
                'Découvrez nos derniers articles',
              filters: ['Tous'],
              searchEnabled: true,
              searchPlaceholder: 'Rechercher un article...',
              articles: (wizardData.blog.articles || []).map(
                (article, index) => {
                  const filename = this.extractFilename(
                    wizardData.images?.[`blog_${index}`],
                  );
                  // ✅ ISSUE #138 FIX: Add slug for blog article links
                  const slug = this.generateSlug(
                    article.title || `article-${index + 1}`,
                  );
                  return {
                    ...article,
                    slug,
                    image: filename || undefined,
                    date: article.date || this.generateRecentDate(index),
                  };
                },
              ),
            }
          : null,
      },

      contact: {
        email: wizardData.contact?.email || '',
        phone: wizardData.contact?.phone || '',
        address: wizardData.contact?.address || '',
        hours: wizardData.contact?.hours || '',
        social: wizardData.contact?.social || {},
      },

      features: {
        blog:
          wizardData.enableBlog ||
          (wizardData.blog?.articles && wizardData.blog.articles.length > 0) ||
          false,
        testimonials: (wizardData.testimonials || []).length > 0,
        faq: (wizardData.faq || []).length > 0,
        newsletter: wizardData.enableNewsletter || false,
        darkMode: false,
        adaptiveLogos: true,
        adaptiveFavicons: true,
        blogSearch:
          wizardData.enableBlog ||
          (wizardData.blog?.articles && wizardData.blog.articles.length > 0) ||
          false,
      },

      seo: {
        title:
          wizardData.seo?.title ||
          wizardData.seoSettings?.title ||
          `${businessName} - Site officiel`,
        description:
          wizardData.seo?.description ||
          wizardData.seoSettings?.description ||
          '',
        keywords:
          wizardData.seo?.keywords || wizardData.seoSettings?.keywords || [],
        ogImage:
          normalizeImagePath(wizardData.images?.logo) || `${siteId}-logo.png`,
        analytics: {
          googleAnalytics: wizardData.seo?.analytics?.googleAnalytics || '',
        },
      },

      integrations: wizardData.integrations || {
        n8n: {
          enabled: false,
          instance: '',
          workflows: {},
        },
        captcha: {
          enabled: false,
          provider: 'recaptcha',
          version: 'v2',
          siteKey: '',
          secretKey: '',
          theme: 'light',
          size: 'normal',
        },
      },
    };
  }

  /**
   * Generate section styles based on primary/secondary colors
   * NOTE: Uses neutral dark color for textColor to avoid overriding CSS gradients
   */
  private generateSectionStyles(
    primaryColor: string,
    secondaryColor: string,
  ): any {
    const lightBg = '#FFFFFF';
    const alternateBg = this.lightenColor(primaryColor, 90);
    const neutralTextColor = '#1F2937'; // Neutral dark gray - doesn't override gradients

    return {
      hero: { background: lightBg, textColor: neutralTextColor },
      services: {
        background: alternateBg,
        textColor: neutralTextColor,
        cardBackground: lightBg,
      },
      about: {
        background: lightBg,
        textColor: neutralTextColor,
        cardBackground: alternateBg,
      },
      testimonials: { background: alternateBg, textColor: neutralTextColor },
      faq: { background: lightBg, textColor: neutralTextColor },
      cta: { background: alternateBg, textColor: neutralTextColor },
      values: {
        background: lightBg,
        textColor: neutralTextColor,
        cardBackground: alternateBg,
      },
      blog: {
        background: lightBg,
        titleBackground: primaryColor,
        titleTextColor: '#FFFFFF',
        subtitleTextColor: '#FFFFFF',
        textColor: neutralTextColor,
      },
      courses: {
        background: lightBg,
        titleBackground: primaryColor,
        titleTextColor: '#FFFFFF',
        subtitleTextColor: '#FFFFFF',
        textColor: neutralTextColor,
      },
      contact: {
        background: lightBg,
        titleBackground: primaryColor,
        titleTextColor: '#FFFFFF',
        subtitleTextColor: '#FFFFFF',
        textColor: neutralTextColor,
      },
    };
  }

  /**
   * Lighten a hex color by a percentage
   */
  private lightenColor(hex: string, percent: number): string {
    // Remove # if present
    hex = hex.replace(/^#/, '');

    // Parse RGB
    const num = parseInt(hex, 16);
    let r = (num >> 16) + Math.round((255 - (num >> 16)) * (percent / 100));
    let g =
      ((num >> 8) & 0x00ff) +
      Math.round((255 - ((num >> 8) & 0x00ff)) * (percent / 100));
    let b =
      (num & 0x0000ff) + Math.round((255 - (num & 0x0000ff)) * (percent / 100));

    // Clamp values
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));

    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  /**
   * Transform services array and add slug/icon/image fields
   */
  private transformServices(services: any[], images: any): any[] {
    return (services || []).map((service, index) => {
      const slug = this.generateSlug(service.title || `service-${index}`);
      const imageKey = `service_${index}`;
      const imagePath = images?.[imageKey];
      const filename = imagePath
        ? imagePath.split('/').pop()?.split('?')[0]
        : '';

      return {
        title: service.title || 'Service',
        slug,
        description: service.description || '',
        icon: 'brush', // Default icon
        image: filename || '',
        features: service.features || [],
      };
    });
  }

  /**
   * Extract service images into content.images object
   */
  private extractServiceImages(images: any): any {
    const contentImages: any = {};

    if (!images) return contentImages;

    // Extract service images (service_0, service_1, etc.)
    Object.keys(images).forEach((key) => {
      if (key.startsWith('service_')) {
        const index = key.replace('service_', '');
        const filename = images[key].split('/').pop()?.split('?')[0] || '';
        contentImages[`image-${parseInt(index) + 1}`] = filename;
      }
    });

    return contentImages;
  }

  /**
   * Generate URL-safe slug from text
   */
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Remove duplicate hyphens
  }

  /**
   * Extract filename from file path or URL
   */
  private extractFilename(path: string | undefined): string {
    if (!path) return '';
    return path.split('/').pop() || '';
  }

  /**
   * Generate realistic publication date for blog article
   * Returns date from 1-6 months ago, randomized per article index
   */
  private generateRecentDate(articleIndex: number): string {
    const now = new Date();
    // Generate dates 1-6 months ago, staggered by article index
    const monthsAgo = (articleIndex % 6) + 1;
    const daysOffset = Math.floor(Math.random() * 20) + 5; // Random 5-25 days offset
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - monthsAgo,
      now.getDate() - daysOffset,
    );
    return date.toISOString();
  }

  /**
   * Generate unique site ID from business name
   * Format: lowercase, remove special chars, replace spaces with hyphens
   * Examples: "Qalyarab Institute" -> "qalyarab-institute"
   */
  generateSiteId(businessName: string): string {
    return businessName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Remove duplicate hyphens
  }

  /**
   * Determine N8N workflow scenario based on wizard data
   */
  determineN8NScenario(
    wizardData: any,
  ): 'oauth2' | 'locodai-default' | 'no-form' {
    if (!wizardData.step4?.hasContactForm) {
      return 'no-form';
    }

    if (wizardData.step4?.oauth2?.status === 'connected') {
      return 'oauth2';
    }

    if (wizardData.step4?.recipientEmail) {
      return 'locodai-default';
    }

    return 'no-form';
  }

  /**
   * Extract all image URLs from wizard data for copying to site-configs
   */
  extractImageUrls(wizardData: any): string[] {
    const images: string[] = [];

    // Step 1: Logo
    if (wizardData.step1?.logo) images.push(wizardData.step1.logo);
    if (wizardData.step1?.logoLight) images.push(wizardData.step1.logoLight);
    if (wizardData.step1?.logoDark) images.push(wizardData.step1.logoDark);

    // Step 3: Hero and About
    if (wizardData.step3?.hero?.image) images.push(wizardData.step3.hero.image);
    if (wizardData.step3?.about?.image)
      images.push(wizardData.step3.about.image);

    // Step 5: All images
    if (wizardData.step5?.favicon) images.push(wizardData.step5.favicon);
    if (wizardData.step5?.images?.hero)
      images.push(wizardData.step5.images.hero);
    if (wizardData.step5?.images?.about)
      images.push(wizardData.step5.images.about);
    if (wizardData.step5?.images?.services) {
      images.push(...wizardData.step5.images.services.filter((img) => img));
    }
    if (wizardData.step5?.images?.gallery) {
      images.push(...wizardData.step5.images.gallery.filter((img) => img));
    }

    return images.filter((url) => url && url.startsWith('/'));
  }
}
