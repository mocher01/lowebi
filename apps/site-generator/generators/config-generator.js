/**
 * 📋 Configuration Generator v1.1.1.9.2.4.2.4
 * 
 * Converts wizard/form data to site-config.json format
 * and manages template library system
 */

const fs = require('fs-extra');
const path = require('path');

class ConfigGenerator {
    constructor() {
        this.templatesDir = path.join(__dirname, '..', 'templates');
        this.configsDir = path.join(__dirname, '..', 'configs');
        this.businessTypeDefaults = this.loadBusinessTypeDefaults();
    }

    /**
     * Load business type default configurations
     */
    loadBusinessTypeDefaults() {
        return {
            'translation': {
                colors: { primary: '#059669', secondary: '#10B981', accent: '#34D399' },
                features: { blog: true, testimonials: true, faq: true },
                terminology: 'services',
                services: [
                    { title: 'Document Translation', icon: 'document' },
                    { title: 'Website Localization', icon: 'globe' },
                    { title: 'Certified Translation', icon: 'certificate' }
                ]
            },
            'education': {
                colors: { primary: '#3B82F6', secondary: '#60A5FA', accent: '#93C5FD' },
                features: { blog: true, testimonials: true, faq: true },
                terminology: 'cours',
                services: [
                    { title: 'Online Courses', icon: 'academic' },
                    { title: 'Private Tutoring', icon: 'user' },
                    { title: 'Group Classes', icon: 'users' }
                ]
            },
            'creative': {
                colors: { primary: '#8B5CF6', secondary: '#A78BFA', accent: '#C4B5FD' },
                features: { blog: true, testimonials: true, faq: false },
                terminology: 'créations',
                services: [
                    { title: 'Design Services', icon: 'palette' },
                    { title: 'Branding', icon: 'star' },
                    { title: 'Digital Art', icon: 'photograph' }
                ]
            },
            'business': {
                colors: { primary: '#1F2937', secondary: '#4B5563', accent: '#6B7280' },
                features: { blog: false, testimonials: true, faq: true },
                terminology: 'services',
                services: [
                    { title: 'Consulting', icon: 'briefcase' },
                    { title: 'Strategy', icon: 'chart' },
                    { title: 'Implementation', icon: 'cog' }
                ]
            },
            'plumbing': {
                colors: { primary: '#0891B2', secondary: '#06B6D4', accent: '#22D3EE' },
                features: { blog: false, testimonials: true, faq: true },
                terminology: 'interventions',
                services: [
                    { title: 'Emergency Repairs', icon: 'wrench' },
                    { title: 'Installation', icon: 'home' },
                    { title: 'Maintenance', icon: 'cog' }
                ]
            },
            'restaurant': {
                colors: { primary: '#DC2626', secondary: '#EF4444', accent: '#F87171' },
                features: { blog: true, testimonials: true, faq: false },
                terminology: 'spécialités',
                services: [
                    { title: 'Dining', icon: 'plate' },
                    { title: 'Catering', icon: 'truck' },
                    { title: 'Events', icon: 'calendar' }
                ]
            }
        };
    }

    /**
     * Convert wizard data to site configuration
     */
    generateConfig(wizardData) {
        const businessDefaults = this.businessTypeDefaults[wizardData.businessType] || this.businessTypeDefaults.business;
        const siteId = wizardData.siteId || this.generateSiteId(wizardData.siteName);
        
        const config = {
            meta: {
                siteId: siteId,
                domain: wizardData.domain || `${siteId}.example.com`,
                language: wizardData.language || 'fr',
                timezone: wizardData.timezone || 'Europe/Paris',
                template: wizardData.template || 'template-base'
            },
            businessType: wizardData.businessType,
            terminology: businessDefaults.terminology || 'services',
            brand: {
                name: wizardData.siteName,
                slogan: wizardData.slogan || '',
                logos: {
                    navbar: `${siteId}-logo-clair.png`,
                    footer: `${siteId}-logo-sombre.png`
                },
                favicons: {
                    light: `${siteId}-favicon-clair.png`,
                    dark: `${siteId}-favicon-sombre.png`
                },
                colors: wizardData.colors || businessDefaults.colors
            },
            design: this.generateDesignConfig(wizardData.colors || businessDefaults.colors),
            sections: this.generateSectionsConfig(wizardData.colors || businessDefaults.colors),
            layout: {
                components: {
                    pageHeader: {
                        spacing: "pt-16 pb-8 md:pt-20 md:pb-12",
                        titleSize: "text-3xl md:text-4xl lg:text-5xl",
                        subtitleSize: "text-lg md:text-xl",
                        titleMargin: "mb-4",
                        subtitleMargin: "mb-6"
                    },
                    section: {
                        spacing: "py-20",
                        spacingSmall: "py-16"
                    }
                }
            },
            routing: this.generateRoutingConfig(),
            navbar: this.generateNavbarConfig(wizardData.colors || businessDefaults.colors),
            footer: this.generateFooterConfig(wizardData.colors || businessDefaults.colors),
            navigation: {
                links: [
                    { name: "Accueil", path: "/" },
                    { name: this.capitalizeFirst(businessDefaults.terminology || 'Services'), path: "/services" },
                    ...(businessDefaults.features.blog ? [{ name: "Blog", path: "/blog" }] : []),
                    { name: "À propos", path: "/about" }
                ],
                cta: {
                    text: "Contactez-nous",
                    path: "/contact"
                }
            },
            content: this.generateContentConfig(wizardData, businessDefaults),
            contact: {
                email: wizardData.contact?.email || `contact@${siteId}.com`,
                phone: wizardData.contact?.phone || '',
                address: wizardData.contact?.address || {
                    street: '',
                    city: '',
                    country: 'France'
                },
                hours: wizardData.contact?.hours || 'Lundi - Vendredi : 9h00 - 18h00',
                social: wizardData.contact?.social || {}
            },
            features: {
                ...businessDefaults.features,
                ...(wizardData.features || {}),
                newsletter: wizardData.features?.newsletter || false,
                darkMode: wizardData.features?.darkMode || false,
                adaptiveLogos: true,
                adaptiveFavicons: true,
                blogSearch: (wizardData.features?.blog !== undefined ? wizardData.features.blog : businessDefaults.features.blog)
            },
            seo: {
                title: `${wizardData.siteName} - ${wizardData.slogan || wizardData.businessType}`,
                description: wizardData.seoDescription || `${wizardData.siteName} - Professional ${wizardData.businessType} services`,
                keywords: this.generateKeywords(wizardData),
                ogImage: `${siteId}-logo-clair.png`,
                analytics: {
                    googleAnalytics: wizardData.analytics?.ga || ''
                }
            },
            integrations: {
                // Store all integrations data for future implementation
                newsletter: wizardData.integrations?.newsletter || {
                    enabled: false,
                    provider: 'n8n',
                    apiKey: '',
                    listId: '',
                    welcomeEmail: true,
                    doubleOptIn: false
                },
                whatsapp: wizardData.integrations?.whatsapp || {
                    enabled: false,
                    number: '',
                    message: ''
                },
                liveChat: wizardData.integrations?.liveChat || {
                    enabled: false,
                    provider: 'tawkto',
                    widgetId: ''
                },
                googleMaps: wizardData.integrations?.googleMaps || {
                    enabled: false,
                    apiKey: ''
                },
                calendly: wizardData.integrations?.calendly || {
                    enabled: false,
                    hasAccount: false,
                    url: '',
                    type: 'inline'
                },
                analytics: wizardData.integrations?.analytics || {
                    googleAnalytics: '',
                    facebookPixel: '',
                    googleTagManager: ''
                },
                performance: wizardData.integrations?.performance || {
                    imageQuality: 85,
                    lazyLoading: true,
                    webp: false,
                    browserCaching: true,
                    cdnEnabled: false,
                    cdnProvider: '',
                    minifyHTML: true,
                    minifyCSS: true,
                    minifyJS: true
                },
                security: wizardData.integrations?.security || {
                    forceSSL: true,
                    cookieBanner: true,
                    privacyPolicy: false,
                    termsOfService: false,
                    captcha: {
                        enabled: wizardData.integrations?.security?.captcha?.enabled || false,
                        provider: wizardData.integrations?.security?.captcha?.provider || 'recaptcha-v2',
                        siteKey: wizardData.integrations?.security?.captcha?.siteKey || '',
                        secretKey: wizardData.integrations?.security?.captcha?.secretKey || '',
                        hasGoogleAccount: wizardData.integrations?.security?.captcha?.hasGoogleAccount || false
                    }
                },
                // Legacy n8n support
                n8n: {
                    enabled: wizardData.n8nEnabled || wizardData.integrations?.newsletter?.provider === 'n8n' || false,
                    instance: "https://automation.locod-ai.fr",
                    workflows: {}
                }
            }
        };

        return config;
    }

    /**
     * Generate site ID from name
     */
    generateSiteId(siteName) {
        return siteName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 30);
    }

    /**
     * Generate design configuration
     */
    generateDesignConfig(colors) {
        return {
            pageHeaders: {
                background: {
                    type: "solid",
                    color: this.darkenColor(colors.primary, 0.1)
                },
                title: {
                    color: "#FFFFFF",
                    size: "text-3xl md:text-4xl",
                    weight: "font-bold",
                    margin: "mb-4"
                },
                subtitle: {
                    color: "#FFFFFF",
                    size: "text-lg md:text-xl",
                    weight: "font-medium",
                    margin: "mb-6"
                }
            },
            textColors: {
                primary: "#1F2937",
                secondary: "#4B5563",
                muted: "#6B7280"
            }
        };
    }

    /**
     * Generate sections configuration
     */
    generateSectionsConfig(colors) {
        const lightBg = this.lightenColor(colors.primary, 0.95);
        
        return {
            hero: {
                background: "#FFFFFF",
                textColor: "#1F2937"
            },
            services: {
                background: lightBg,
                textColor: "#1F2937",
                cardBackground: "#FFFFFF"
            },
            about: {
                background: "#FFFFFF",
                textColor: "#1F2937",
                cardBackground: lightBg
            },
            testimonials: {
                background: lightBg,
                textColor: "#1F2937"
            },
            faq: {
                background: "#FFFFFF",
                textColor: "#1F2937"
            },
            cta: {
                background: lightBg,
                textColor: "#1F2937"
            },
            values: {
                background: "#FFFFFF",
                textColor: "#1F2937",
                cardBackground: lightBg
            },
            blog: {
                background: "#FFFFFF",
                titleBackground: this.darkenColor(colors.primary, 0.1),
                titleTextColor: "#FFFFFF",
                subtitleTextColor: "#FFFFFF",
                textColor: "#1F2937"
            },
            "services-page": {
                background: "#FFFFFF",
                titleBackground: this.darkenColor(colors.primary, 0.1),
                titleTextColor: "#FFFFFF",
                subtitleTextColor: "#FFFFFF",
                textColor: "#1F2937"
            },
            contact: {
                background: "#FFFFFF",
                titleBackground: this.darkenColor(colors.primary, 0.1),
                titleTextColor: "#FFFFFF",
                subtitleTextColor: "#FFFFFF",
                textColor: "#1F2937"
            }
        };
    }

    /**
     * Generate routing configuration
     */
    generateRoutingConfig() {
        return {
            scrollBehavior: "smooth",
            scrollOffset: 80,
            routes: {
                "/": { scroll: "top" },
                "/services": { scroll: "top" },
                "/service/*": { scroll: "top" },
                "/blog": { scroll: "top" },
                "/contact": { scroll: "top", anchor: "contact-form" },
                "/about": { scroll: "top" }
            }
        };
    }

    /**
     * Generate navbar configuration
     */
    generateNavbarConfig(colors) {
        return {
            contrast: "medium",
            tone: "professional",
            background: this.lightenColor(colors.primary, 0.9),
            textColor: this.darkenColor(colors.primary, 0.2),
            accentColor: colors.primary
        };
    }

    /**
     * Generate footer configuration
     */
    generateFooterConfig(colors) {
        return {
            background: this.darkenColor(colors.primary, 0.1),
            textColor: this.lightenColor(colors.primary, 0.8)
        };
    }

    /**
     * Generate content configuration
     */
    generateContentConfig(wizardData, businessDefaults) {
        const terminology = businessDefaults.terminology || 'services';
        const siteId = this.generateSiteId(wizardData.siteName);
        
        // Use generated content if available, otherwise create default
        const heroContent = wizardData.generatedContent?.hero || {
            title: wizardData.slogan || `Bienvenue chez ${wizardData.siteName}`,
            subtitle: this.getBusinessTypeSubtitle(wizardData.businessType),
            description: `${wizardData.siteName} offre des ${terminology} professionnels adaptés à vos besoins spécifiques.`
        };
        
        return {
            hero: {
                title: heroContent.title,
                subtitle: heroContent.subtitle,
                description: heroContent.description,
                image: `${siteId}-hero.png`,
                cta: {
                    primary: "Commencer",
                    secondary: "En savoir plus"
                }
            },
            services: this.processActivities(wizardData.activities || wizardData.services, businessDefaults.services, wizardData.siteName, terminology),
            images: {
                "image-1": `${this.generateSiteId(wizardData.siteName)}-services-1.png`,
                "image-2": `${this.generateSiteId(wizardData.siteName)}-services-2.png`,
                "image-3": `${this.generateSiteId(wizardData.siteName)}-services-3.png`
            },
            servicesSection: {
                viewAllText: `Voir tous nos ${terminology}`,
                learnMoreText: "En savoir plus"
            },
            servicesPage: {
                subtitle: `Découvrez nos ${terminology} professionnels en ${wizardData.businessType}`,
                ctaTitle: "Prêt à commencer ?",
                ctaDescription: "Contactez-nous dès aujourd'hui pour discuter de votre projet",
                ctaButton: "Nous contacter"
            },
            about: {
                title: `À propos de ${wizardData.siteName}`,
                subtitle: `Votre partenaire de confiance en ${wizardData.businessType}`,
                description: wizardData.aboutDescription || `Nous offrons des ${terminology} professionnels en ${wizardData.businessType} avec un engagement envers la qualité et la satisfaction client.`,
                values: this.generateDefaultValues(wizardData.businessType)
            },
            testimonials: this.generateDefaultTestimonials(wizardData.businessType),
            faq: this.generateDefaultFAQ(wizardData.businessType)
        };
    }

    /**
     * Process and validate activities/services array (enhanced for flexible terminology)
     */
    processActivities(wizardActivities, businessDefaults, siteName, terminology = 'services') {
        const siteId = this.generateSiteId(siteName);
        
        // If no wizard activities provided, use business defaults
        if (!wizardActivities || !Array.isArray(wizardActivities) || wizardActivities.length === 0) {
            return businessDefaults.map((service, index) => ({
                ...service,
                slug: service.title ? service.title.toLowerCase().replace(/\s+/g, '-') : `${terminology}-${index + 1}`,
                description: service.title ? `${this.capitalizeFirst(terminology)} professionnels en ${service.title.toLowerCase()}` : `${this.capitalizeFirst(terminology)} professionnels`,
                image: `${siteId}-services-${index + 1}.png`,
                features: [
                    `${this.capitalizeFirst(terminology)} professionnel`,
                    'Qualité garantie',
                    'Prix compétitifs',
                    'Livraison rapide'
                ]
            }));
        }
        
        // Process wizard activities with validation
        return wizardActivities.map((activity, index) => {
            if (!activity || typeof activity !== 'object') {
                return {
                    title: `${this.capitalizeFirst(terminology)} ${index + 1}`,
                    slug: `${terminology}-${index + 1}`,
                    description: `${this.capitalizeFirst(terminology)} professionnels`,
                    image: `${siteId}-services-${index + 1}.png`,
                    features: [`${this.capitalizeFirst(terminology)} professionnel`, 'Qualité garantie']
                };
            }
            
            const title = (activity.title || activity.name) && typeof (activity.title || activity.name) === 'string' 
                ? (activity.title || activity.name) 
                : `${this.capitalizeFirst(terminology)} ${index + 1}`;
            
            return {
                ...activity,
                title: title,
                slug: title.toLowerCase().replace(/\s+/g, '-'),
                description: activity.description || `${this.capitalizeFirst(terminology)} professionnels en ${title.toLowerCase()}`,
                image: activity.image || `${siteId}-services-${index + 1}.png`,
                features: activity.features || [
                    `${this.capitalizeFirst(terminology)} professionnel`,
                    'Qualité garantie',
                    'Prix compétitifs',
                    'Service personnalisé'
                ]
            };
        });
    }

    /**
     * Process and validate services array (legacy method for backward compatibility)
     */
    processServices(wizardServices, businessDefaults, siteName) {
        const siteId = this.generateSiteId(siteName);
        
        // If no wizard services provided, use business defaults
        if (!wizardServices || !Array.isArray(wizardServices) || wizardServices.length === 0) {
            return businessDefaults.map((service, index) => ({
                ...service,
                slug: service.title ? service.title.toLowerCase().replace(/\s+/g, '-') : `service-${index + 1}`,
                description: service.title ? `Professional ${service.title.toLowerCase()} services` : 'Professional services',
                image: `${siteId}-services-${index + 1}.png`,
                features: [
                    'Professional service',
                    'Quality guaranteed',
                    'Competitive pricing',
                    'Fast delivery'
                ]
            }));
        }
        
        // Process wizard services with validation
        return wizardServices.map((service, index) => {
            if (!service || typeof service !== 'object') {
                return {
                    title: `Service ${index + 1}`,
                    slug: `service-${index + 1}`,
                    description: 'Professional services',
                    image: `${siteId}-services-${index + 1}.png`,
                    features: ['Professional service', 'Quality guaranteed']
                };
            }
            
            const title = service.title && typeof service.title === 'string' ? service.title : `Service ${index + 1}`;
            
            return {
                ...service,
                title: title,
                slug: title.toLowerCase().replace(/\s+/g, '-'),
                description: service.description || `Professional ${title.toLowerCase()} services`,
                image: service.image || `${siteId}-services-${index + 1}.png`,
                features: service.features || [
                    'Professional service',
                    'Quality guaranteed',
                    'Competitive pricing',
                    'Fast delivery'
                ]
            };
        });
    }

    /**
     * Generate SEO keywords
     */
    generateKeywords(wizardData) {
        const baseKeywords = [
            wizardData.siteName.toLowerCase(),
            wizardData.businessType,
            `${wizardData.businessType} services`,
            'professional services'
        ];
        
        if (wizardData.services && Array.isArray(wizardData.services)) {
            wizardData.services.forEach(service => {
                if (service && service.title && typeof service.title === 'string') {
                    baseKeywords.push(service.title.toLowerCase());
                }
            });
        }
        
        return baseKeywords;
    }

    /**
     * Get business type subtitle
     */
    getBusinessTypeSubtitle(businessType) {
        const subtitles = {
            'translation': 'Professional Translation Services',
            'education': 'Quality Education & Training',
            'creative': 'Creative Design Solutions',
            'business': 'Business Consulting Excellence'
        };
        return subtitles[businessType] || 'Professional Services';
    }

    /**
     * Generate default values for business type
     */
    generateDefaultValues(businessType) {
        const valueTemplates = {
            'translation': [
                { title: 'Language Expertise', description: 'Native-level proficiency in multiple languages' },
                { title: 'Quality Assurance', description: 'Rigorous review process for accuracy' },
                { title: 'Fast Delivery', description: 'On-time delivery guaranteed' }
            ],
            'education': [
                { title: 'Expert Instructors', description: 'Learn from industry professionals' },
                { title: 'Flexible Learning', description: 'Study at your own pace' },
                { title: 'Proven Results', description: 'Track record of student success' }
            ],
            'creative': [
                { title: 'Creative Excellence', description: 'Unique designs that stand out' },
                { title: 'Brand Strategy', description: 'Comprehensive brand development' },
                { title: 'Digital Innovation', description: 'Cutting-edge digital solutions' }
            ],
            'business': [
                { title: 'Strategic Vision', description: 'Long-term business growth strategies' },
                { title: 'Industry Expertise', description: 'Deep knowledge of your sector' },
                { title: 'Results Driven', description: 'Focus on measurable outcomes' }
            ]
        };
        
        return valueTemplates[businessType] || valueTemplates.business;
    }

    /**
     * Generate default testimonials
     */
    generateDefaultTestimonials(businessType) {
        return [
            {
                text: `Excellent ${businessType} services. Professional, reliable, and great results!`,
                name: "Sarah Johnson",
                position: "CEO, Tech Company",
                rating: 5
            },
            {
                text: "Outstanding quality and attention to detail. Highly recommend!",
                name: "Michael Chen",
                position: "Marketing Director",
                rating: 5
            },
            {
                text: "Great experience from start to finish. Will definitely work with them again.",
                name: "Emma Davis",
                position: "Business Owner",
                rating: 5
            }
        ];
    }

    /**
     * Generate default FAQ
     */
    generateDefaultFAQ(businessType) {
        return [
            {
                question: "What services do you offer?",
                answer: `We offer comprehensive ${businessType} services tailored to your specific needs.`
            },
            {
                question: "How long does a typical project take?",
                answer: "Project timelines vary based on scope and complexity. We provide detailed estimates for each project."
            },
            {
                question: "What are your rates?",
                answer: "Our pricing is competitive and transparent. Contact us for a personalized quote."
            },
            {
                question: "Do you offer ongoing support?",
                answer: "Yes, we provide comprehensive support throughout and after project completion."
            }
        ];
    }

    /**
     * Validate configuration
     */
    validateConfig(config) {
        const errors = [];
        
        // Required fields
        if (!config.meta?.siteId) errors.push('Site ID is required');
        if (!config.brand?.name) errors.push('Brand name is required');
        if (!config.brand?.colors?.primary) errors.push('Primary color is required');
        if (!config.contact?.email) errors.push('Contact email is required');
        
        // Validate email format
        if (config.contact?.email && !this.isValidEmail(config.contact.email)) {
            errors.push('Invalid email format');
        }
        
        // Validate colors
        if (config.brand?.colors) {
            ['primary', 'secondary', 'accent'].forEach(color => {
                if (config.brand.colors[color] && !this.isValidColor(config.brand.colors[color])) {
                    errors.push(`Invalid ${color} color format`);
                }
            });
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Save configuration to file with all assets
     */
    async saveConfig(config, options = {}) {
        const validation = this.validateConfig(config);
        if (!validation.valid) {
            throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
        }
        
        const siteId = config.meta.siteId;
        const configDir = path.join(this.configsDir, siteId);
        const configPath = path.join(configDir, 'site-config.json');
        const assetsDir = path.join(configDir, 'assets');
        const blogDir = path.join(configDir, 'content', 'blog');
        
        // Create directories
        await fs.ensureDir(configDir);
        await fs.ensureDir(assetsDir);
        await fs.ensureDir(blogDir);
        
        // Save base64 images if provided
        if (options.images) {
            await this.saveImages(options.images, assetsDir, siteId);
        }
        
        // Save blog articles as markdown
        if (options.blogArticles && Array.isArray(options.blogArticles)) {
            await this.saveBlogArticles(options.blogArticles, blogDir);
        }
        
        // Save configuration
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
        
        // Save as template if requested
        if (options.saveAsTemplate) {
            await this.saveAsTemplate(config, options.templateName || siteId);
        }
        
        return {
            success: true,
            siteId: siteId,
            configPath: configPath,
            assetsDir: assetsDir,
            blogDir: blogDir,
            template: options.saveAsTemplate ? options.templateName || siteId : null
        };
    }

    /**
     * Save base64 images to files
     */
    async saveImages(images, assetsDir, siteId) {
        if (!images) return;
        
        for (const [key, value] of Object.entries(images)) {
            if (typeof value === 'string' && value.startsWith('data:')) {
                // Extract base64 data
                const matches = value.match(/^data:image\/(\w+);base64,(.+)$/);
                if (matches) {
                    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
                    const data = matches[2];
                    const filename = `${siteId}-${key}.${ext}`;
                    const filepath = path.join(assetsDir, filename);
                    
                    // Save image file
                    await fs.writeFile(filepath, Buffer.from(data, 'base64'));
                    console.log(`✅ Saved image: ${filename}`);
                }
            } else if (Array.isArray(value)) {
                // Handle arrays (like blog images)
                for (let i = 0; i < value.length; i++) {
                    if (typeof value[i] === 'string' && value[i].startsWith('data:')) {
                        const matches = value[i].match(/^data:image\/(\w+);base64,(.+)$/);
                        if (matches) {
                            const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
                            const data = matches[2];
                            const filename = `${siteId}-${key}-${i + 1}.${ext}`;
                            const filepath = path.join(assetsDir, filename);
                            
                            await fs.writeFile(filepath, Buffer.from(data, 'base64'));
                            console.log(`✅ Saved image: ${filename}`);
                        }
                    }
                }
            }
        }
    }

    /**
     * Save blog articles as markdown files
     */
    async saveBlogArticles(articles, blogDir) {
        if (!articles || !Array.isArray(articles)) {
            console.log('No blog articles to save');
            return;
        }
        
        for (let i = 0; i < articles.length; i++) {
            const article = articles[i];
            if (article && (article.title || article.name)) {
                const title = article.title || article.name;
                const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                const filename = `${slug}.md`;
                const filepath = path.join(blogDir, filename);
                
                // Create markdown content
                const markdown = `---
title: ${title}
date: ${article.date || new Date().toISOString()}
category: ${article.category || 'General'}
image: ${article.image || ''}
---

# ${title}

${article.content || article.description || ''}

${article.tags ? `\nTags: ${article.tags.join(', ')}` : ''}
`;
                
                await fs.writeFile(filepath, markdown);
                console.log(`✅ Saved blog article: ${filename}`);
            }
        }
    }

    /**
     * Save configuration as reusable template
     */
    async saveAsTemplate(config, templateName) {
        await fs.ensureDir(this.templatesDir);
        
        const templatePath = path.join(this.templatesDir, `${templateName}.json`);
        
        // Remove site-specific data
        const templateConfig = JSON.parse(JSON.stringify(config));
        delete templateConfig.meta.siteId;
        delete templateConfig.meta.domain;
        delete templateConfig.contact.email;
        delete templateConfig.contact.phone;
        
        // Add template metadata
        templateConfig._template = {
            name: templateName,
            businessType: templateConfig.businessType || 'general',
            created: new Date().toISOString(),
            description: `Template for ${config.brand.name}`
        };
        
        await fs.writeFile(templatePath, JSON.stringify(templateConfig, null, 2));
        
        return templatePath;
    }

    /**
     * Load template
     */
    async loadTemplate(templateName) {
        const templatePath = path.join(this.templatesDir, `${templateName}.json`);
        
        if (!await fs.pathExists(templatePath)) {
            throw new Error(`Template '${templateName}' not found`);
        }
        
        const template = await fs.readJson(templatePath);
        delete template._template;
        
        return template;
    }

    /**
     * List available React templates (directories in templates/)
     */
    async listTemplates() {
        await fs.ensureDir(this.templatesDir);
        
        const items = await fs.readdir(this.templatesDir, { withFileTypes: true });
        const templates = [];
        
        for (const item of items) {
            if (item.isDirectory()) {
                const templateName = item.name;
                const templatePath = path.join(this.templatesDir, templateName);
                
                // Check if it's a valid React template (has package.json)
                const packageJsonPath = path.join(templatePath, 'package.json');
                if (await fs.pathExists(packageJsonPath)) {
                    try {
                        const packageJson = await fs.readJson(packageJsonPath);
                        templates.push({
                            name: templateName,
                            displayName: this.formatTemplateName(templateName),
                            description: packageJson.description || `Template de site ${templateName}`,
                            version: packageJson.version || '1.0.0',
                            path: templateName
                        });
                    } catch (error) {
                        // Skip invalid templates
                        console.warn(`Invalid template ${templateName}:`, error.message);
                    }
                }
            }
        }
        
        return templates;
    }

    /**
     * Format template name for display
     */
    formatTemplateName(templateName) {
        if (templateName === 'template-base') return 'Template Basic';
        return templateName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Utility: Validate email format
     */
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    /**
     * Utility: Validate color format
     */
    isValidColor(color) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
    }

    /**
     * Utility: Darken color
     */
    darkenColor(color, amount) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(255 * amount);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (0x1000000 + (R < 0 ? 0 : R) * 0x10000 + 
                     (G < 0 ? 0 : G) * 0x100 + 
                     (B < 0 ? 0 : B)).toString(16).slice(1);
    }

    /**
     * Utility: Lighten color
     */
    lightenColor(color, amount) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(255 * amount);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    /**
     * Utility: Capitalize first letter
     */
    capitalizeFirst(str) {
        if (!str || typeof str !== 'string') return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

module.exports = { ConfigGenerator };