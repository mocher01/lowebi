#!/usr/bin/env node

/**
 * 🎯 Guided Generation System v1.1.1.9.2.4
 * 
 * Interactive guide for creating new sites with step-by-step configuration
 * Prevents errors and ensures consistent setup
 */

const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');

class GuidedGenerator {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        this.siteData = {};
        this.businessTypes = {
            'translation': {
                name: 'Services de traduction',
                defaultColors: { primary: '#059669', secondary: '#10B981', accent: '#34D399' },
                suggestedServices: ['Traduction professionnelle', 'Interprétariat', 'Localisation'],
                ctaDefaults: {
                    title: 'Prêt à démarrer votre projet de traduction ?',
                    description: 'Contactez-nous pour discuter de vos besoins et recevoir un devis personnalisé.'
                }
            },
            'education': {
                name: 'Formation/Éducation',
                defaultColors: { primary: '#3B82F6', secondary: '#60A5FA', accent: '#93C5FD' },
                suggestedServices: ['Cours particuliers', 'Formations', 'Ateliers'],
                ctaDefaults: {
                    title: 'Prêt à commencer votre apprentissage ?',
                    description: 'Contactez-nous pour découvrir nos programmes et réserver votre cours d\'essai.'
                }
            },
            'creative': {
                name: 'Services créatifs',
                defaultColors: { primary: '#8B5CF6', secondary: '#A78BFA', accent: '#C4B5FD' },
                suggestedServices: ['Design graphique', 'Art', 'Photographie'],
                ctaDefaults: {
                    title: 'Prêt à donner vie à votre vision ?',
                    description: 'Collaborons pour créer quelque chose d\'extraordinaire ensemble.'
                }
            },
            'business': {
                name: 'Services d\'entreprise',
                defaultColors: { primary: '#1F2937', secondary: '#4B5563', accent: '#6B7280' },
                suggestedServices: ['Conseil', 'Développement', 'Marketing'],
                ctaDefaults: {
                    title: 'Prêt à développer votre entreprise ?',
                    description: 'Découvrez comment nous pouvons vous aider à atteindre vos objectifs.'
                }
            },
            'custom': {
                name: 'Configuration personnalisée',
                defaultColors: { primary: '#059669', secondary: '#10B981', accent: '#34D399' },
                suggestedServices: [],
                ctaDefaults: {
                    title: 'Prêt à démarrer votre projet ?',
                    description: 'Contactez-nous pour discuter de vos besoins.'
                }
            }
        };
    }

    /**
     * Ask a question and return the answer
     */
    async ask(question, defaultValue = '') {
        return new Promise((resolve) => {
            const prompt = defaultValue ? `${question} (${defaultValue}): ` : `${question}: `;
            this.rl.question(prompt, (answer) => {
                resolve(answer.trim() || defaultValue);
            });
        });
    }

    /**
     * Ask a yes/no question
     */
    async askYesNo(question, defaultValue = 'n') {
        const answer = await this.ask(`${question} (y/n)`, defaultValue);
        return ['y', 'yes', 'oui', 'o'].includes(answer.toLowerCase());
    }

    /**
     * Display a menu and get selection
     */
    async selectFromMenu(title, options, defaultIndex = 0) {
        console.log(`\\n${title}:`);
        options.forEach((option, index) => {
            const marker = index === defaultIndex ? '→' : ' ';
            console.log(`${marker} ${index + 1}. ${option}`);
        });
        
        const answer = await this.ask(`Sélectionnez une option (1-${options.length})`, `${defaultIndex + 1}`);
        const index = parseInt(answer) - 1;
        
        if (index >= 0 && index < options.length) {
            return index;
        }
        return defaultIndex;
    }

    /**
     * Main guided generation flow
     */
    async start() {
        console.log('🎯 Générateur de site guidé v1.1.1.9.2.4');
        console.log('=======================================\\n');
        
        // Step 1: Basic site information
        await this.collectBasicInfo();
        
        // Step 2: Business type and styling
        await this.selectBusinessType();
        
        // Step 3: Services configuration
        await this.configureServices();
        
        // Step 4: Contact and integration setup
        await this.setupIntegrations();
        
        // Step 5: Generate configuration files
        await this.generateConfig();
        
        // Step 6: Create initial site
        await this.generateSite();
        
        console.log('\\n✅ Site généré avec succès!');
        console.log(`📁 Configuration: configs/${this.siteData.siteId}/`);
        console.log(`🌐 Pour déployer: ./init.sh ${this.siteData.siteId} --docker`);
        
        this.rl.close();
    }

    /**
     * Collect basic site information
     */
    async collectBasicInfo() {
        console.log('📝 Informations de base\\n');
        
        this.siteData.brandName = await this.ask('Nom de votre marque/entreprise');
        
        // Generate site ID from brand name
        const suggestedId = this.siteData.brandName.toLowerCase()
            .replace(/[^a-z0-9\\s-]/g, '')
            .replace(/\\s+/g, '')
            .slice(0, 15);
        
        this.siteData.siteId = await this.ask('ID du site (pour les dossiers)', suggestedId);
        
        this.siteData.slogan = await this.ask('Slogan/description courte', 
            `Services professionnels de ${this.siteData.brandName}`);
        
        this.siteData.domain = await this.ask('Nom de domaine', 
            `${this.siteData.siteId}.example.com`);
    }

    /**
     * Select business type for appropriate defaults
     */
    async selectBusinessType() {
        console.log('\n🏢 Type d\'activité\n');
        
        const types = Object.keys(this.businessTypes);
        const typeNames = types.map(key => this.businessTypes[key].name);
        
        const selectedIndex = await this.selectFromMenu(
            'Quel type d\'activité décrit le mieux votre entreprise ?',
            typeNames
        );
        
        this.siteData.businessType = types[selectedIndex];
        this.siteData.typeConfig = this.businessTypes[this.siteData.businessType];
        
        console.log(`\\n✅ Type sélectionné: ${this.siteData.typeConfig.name}`);
    }

    /**
     * Configure services
     */
    async configureServices() {
        console.log('\\n🛠️ Configuration des services\\n');
        
        this.siteData.services = [];
        
        if (this.siteData.typeConfig.suggestedServices.length > 0) {
            console.log('Services suggérés pour votre activité:');
            this.siteData.typeConfig.suggestedServices.forEach((service, index) => {
                console.log(`  ${index + 1}. ${service}`);
            });
            
            if (await this.askYesNo('Utiliser ces services suggérés ?', 'y')) {
                this.siteData.services = this.siteData.typeConfig.suggestedServices.map((title, index) => ({
                    title,
                    slug: title.toLowerCase().replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                    description: `${title} professionnel adapté à vos besoins`,
                    icon: 'star',
                    features: ['Service personnalisé', 'Qualité garantie', 'Support client']
                }));
            }
        }
        
        // Allow custom services
        if (await this.askYesNo('Ajouter des services personnalisés ?')) {
            let addMore = true;
            while (addMore) {
                const title = await this.ask('Nom du service');
                if (title) {
                    const slug = title.toLowerCase().replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                    const description = await this.ask('Description du service', 
                        `${title} professionnel adapté à vos besoins`);
                    
                    this.siteData.services.push({
                        title,
                        slug,
                        description,
                        icon: 'star',
                        features: ['Service personnalisé', 'Qualité garantie', 'Support client']
                    });
                }
                
                addMore = await this.askYesNo('Ajouter un autre service ?');
            }
        }
        
        console.log(`\\n✅ ${this.siteData.services.length} service(s) configuré(s)`);
    }

    /**
     * Setup integrations and contact info
     */
    async setupIntegrations() {
        console.log('\\n📧 Intégrations et contact\\n');
        
        this.siteData.contact = {};
        this.siteData.contact.email = await this.ask('Email de contact');
        this.siteData.contact.phone = await this.ask('Téléphone (optionnel)', '');
        
        // N8N integration
        if (await this.askYesNo('Configurer N8N pour les formulaires de contact ?', 'y')) {
            this.siteData.n8nEnabled = true;
            console.log('✅ N8N sera configuré automatiquement lors du déploiement');
        } else {
            this.siteData.n8nEnabled = false;
        }
        
        // Blog configuration
        this.siteData.blogEnabled = await this.askYesNo('Activer le système de blog ?', 'y');
    }

    /**
     * Generate configuration files
     */
    async generateConfig() {
        console.log('\\n⚙️ Génération de la configuration...\\n');
        
        const configDir = path.join('configs', this.siteData.siteId);
        await fs.ensureDir(configDir);
        await fs.ensureDir(path.join(configDir, 'assets'));
        await fs.ensureDir(path.join(configDir, 'content', 'blog'));
        
        // Main site config
        const siteConfig = {
            meta: {
                siteId: this.siteData.siteId,
                domain: this.siteData.domain,
                language: 'fr',
                timezone: 'Europe/Paris'
            },
            brand: {
                name: this.siteData.brandName,
                slogan: this.siteData.slogan,
                colors: this.siteData.typeConfig.defaultColors,
                logos: {
                    navbar: `${this.siteData.siteId}-logo-clair.png`,
                    footer: `${this.siteData.siteId}-logo-sombre.png`,
                    default: `${this.siteData.siteId}-logo-clair.png`
                },
                favicons: {
                    light: `${this.siteData.siteId}-favicon-clair.png`,
                    dark: `${this.siteData.siteId}-favicon-sombre.png`,
                    default: `${this.siteData.siteId}-favicon.ico`
                }
            },
            content: {
                hero: {
                    title: this.siteData.slogan,
                    subtitle: `${this.siteData.brandName} • Services professionnels`,
                    description: `Découvrez nos services ${this.siteData.businessType === 'custom' ? 'personnalisés' : this.siteData.typeConfig.name.toLowerCase()} adaptés à vos besoins.`,
                    image: `${this.siteData.siteId}-hero.png`,
                    cta: {
                        primary: 'Demander un devis',
                        secondary: 'Voir nos services'
                    }
                },
                services: this.siteData.services,
                cta: this.siteData.typeConfig.ctaDefaults,
                serviceDetail: {
                    ctaTitle: this.siteData.typeConfig.ctaDefaults.title,
                    ctaDescription: this.siteData.typeConfig.ctaDefaults.description
                }
            },
            contact: this.siteData.contact,
            features: {
                blog: this.siteData.blogEnabled,
                testimonials: true,
                faq: true,
                newsletter: false,
                darkMode: false
            },
            integrations: {
                n8n: {
                    enabled: this.siteData.n8nEnabled
                }
            }
        };
        
        await fs.writeFile(
            path.join(configDir, 'site-config.json'),
            JSON.stringify(siteConfig, null, 2)
        );
        
        // Create placeholder assets README
        await fs.writeFile(
            path.join(configDir, 'assets', 'README.md'),
            `# Assets pour ${this.siteData.brandName}\\n\\nAjoutez vos logos et images dans ce dossier:\\n\\n- ${this.siteData.siteId}-logo-clair.png (navbar)\\n- ${this.siteData.siteId}-logo-sombre.png (footer)\\n- ${this.siteData.siteId}-favicon-clair.png\\n- ${this.siteData.siteId}-hero.png\\n\\nPour les services, utilisez: ${this.siteData.siteId}-services-X.png`
        );
        
        console.log(`✅ Configuration générée dans configs/${this.siteData.siteId}/`);
    }

    /**
     * Generate the initial site
     */
    async generateSite() {
        console.log('\\n🏗️ Génération du site...\\n');
        
        if (await this.askYesNo('Générer le site maintenant ?', 'y')) {
            const { spawn } = require('child_process');
            
            return new Promise((resolve) => {
                const generate = spawn('./init.sh', [this.siteData.siteId, '--build'], {
                    stdio: 'inherit',
                    shell: true
                });
                
                generate.on('close', (code) => {
                    if (code === 0) {
                        console.log('\\n✅ Site généré avec succès');
                    } else {
                        console.log('\\n⚠️ Erreur lors de la génération - vous pouvez réessayer manuellement');
                    }
                    resolve();
                });
            });
        }
    }
}

// CLI usage
if (require.main === module) {
    const generator = new GuidedGenerator();
    generator.start().catch(console.error);
}

module.exports = { GuidedGenerator };