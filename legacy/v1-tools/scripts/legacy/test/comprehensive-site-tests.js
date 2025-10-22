#!/usr/bin/env node

/**
 * 🧪 TESTS COMPLETS ET ROBUSTES DU SITE
 * 
 * Tests automatisés exhaustifs à lancer après chaque déploiement
 * Couvre: Infrastructure, Assets, Fonctionnalités, Performance, SEO
 */

import fetch from 'node-fetch';
import fs from 'fs-extra';
import path from 'path';
import { spawn } from 'child_process';

class ComprehensiveSiteTester {
    constructor(baseUrl, siteName) {
        this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.siteName = siteName;
        this.results = {
            infrastructure: [],
            assets: [],
            navigation: [],
            functionality: [],
            performance: [],
            seo: [],
            accessibility: [],
            errors: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                warnings: 0,
                errors: 0
            }
        };
        this.siteConfig = null;
    }

    async runAllTests() {
        console.log(`\n🚀 TESTS COMPLETS POUR ${this.siteName.toUpperCase()}`);
        console.log(`🌐 URL: ${this.baseUrl}`);
        console.log('=' .repeat(60));

        try {
            // Phase 1: Tests d'infrastructure critique
            await this.testInfrastructure();
            
            // Phase 2: Tests des assets (logos, images, fichiers)
            await this.testAssets();
            
            // Phase 3: Tests de navigation et pages
            await this.testNavigation();
            
            // Phase 4: Tests de fonctionnalités
            await this.testFunctionality();
            
            // Phase 5: Tests de performance
            await this.testPerformance();
            
            // Phase 6: Tests SEO
            await this.testSEO();
            
            // Phase 7: Tests d'accessibilité
            await this.testAccessibility();
            
            // Génération du rapport final
            this.generateComprehensiveReport();
            
        } catch (error) {
            this.addError('FATAL', 'Test execution failed', error.message);
            console.error('💥 Erreur critique lors des tests:', error);
        }
    }

    async testInfrastructure() {
        console.log('\n🏗️ PHASE 1: TESTS D\'INFRASTRUCTURE');
        console.log('-'.repeat(40));

        // Test 1.1: Site accessible
        await this.testSiteAccessibility();
        
        // Test 1.2: Configuration du site
        await this.testSiteConfiguration();
        
        // Test 1.3: Docker container status
        await this.testDockerStatus();
        
        // Test 1.4: Nginx configuration
        await this.testNginxConfiguration();
    }

    async testSiteAccessibility() {
        try {
            const startTime = Date.now();
            const response = await fetch(this.baseUrl, { timeout: 10000 });
            const loadTime = Date.now() - startTime;
            
            this.addResult('infrastructure', 'Site Accessibility', 
                response.ok ? 'PASS' : 'FAIL',
                response.ok ? 
                    `✅ Site accessible en ${loadTime}ms (Status: ${response.status})` :
                    `❌ Site inaccessible (Status: ${response.status})`
            );

            if (response.ok) {
                const html = await response.text();
                
                // Vérifications supplémentaires
                this.addResult('infrastructure', 'HTML Validity',
                    html.includes('<!DOCTYPE html') ? 'PASS' : 'FAIL',
                    html.includes('<!DOCTYPE html') ? '✅ DOCTYPE HTML5 présent' : '❌ DOCTYPE manquant'
                );

                this.addResult('infrastructure', 'Content Length',
                    html.length > 1000 ? 'PASS' : 'WARN',
                    `📄 Contenu HTML: ${html.length} caractères`
                );

                return html;
            }
        } catch (error) {
            this.addResult('infrastructure', 'Site Accessibility', 'ERROR', 
                `💥 Erreur de connexion: ${error.message}`);
        }
        return null;
    }

    async testSiteConfiguration() {
        try {
            const response = await fetch(this.baseUrl);
            const html = await response.text();
            
            // Extraire la configuration
            const configMatch = html.match(/window\.SITE_CONFIG\s*=\s*({.*?});/s);
            
            if (configMatch) {
                this.siteConfig = JSON.parse(configMatch[1]);
                
                this.addResult('infrastructure', 'Site Configuration',
                    'PASS', '✅ Configuration extraite avec succès');
                
                // Vérifications de la config
                const requiredFields = ['meta', 'brand', 'content', 'navigation'];
                const missingFields = requiredFields.filter(field => !this.siteConfig[field]);
                
                this.addResult('infrastructure', 'Config Completeness',
                    missingFields.length === 0 ? 'PASS' : 'FAIL',
                    missingFields.length === 0 ? 
                        '✅ Tous les champs requis présents' :
                        `❌ Champs manquants: ${missingFields.join(', ')}`
                );

                // Vérifier les couleurs
                const colors = this.siteConfig.brand?.colors;
                if (colors) {
                    const colorCount = Object.keys(colors).length;
                    this.addResult('infrastructure', 'Brand Colors',
                        colorCount >= 3 ? 'PASS' : 'WARN',
                        `🎨 ${colorCount} couleurs définies`
                    );
                }

            } else {
                this.addResult('infrastructure', 'Site Configuration',
                    'FAIL', '❌ Configuration non trouvée dans le HTML');
            }
        } catch (error) {
            this.addResult('infrastructure', 'Site Configuration',
                'ERROR', `💥 Erreur parsing config: ${error.message}`);
        }
    }

    async testDockerStatus() {
        // Ce test nécessiterait l'accès SSH au serveur
        // Pour l'instant, on vérifie indirectement via les headers HTTP
        try {
            const response = await fetch(this.baseUrl, { method: 'HEAD' });
            const server = response.headers.get('server');
            
            this.addResult('infrastructure', 'Docker/Nginx Status',
                server ? 'PASS' : 'WARN',
                server ? `✅ Serveur: ${server}` : '⚠️ Header serveur non détecté'
            );
        } catch (error) {
            this.addResult('infrastructure', 'Docker/Nginx Status',
                'ERROR', `💥 Erreur vérification serveur: ${error.message}`);
        }
    }

    async testNginxConfiguration() {
        try {
            // Test des headers de sécurité et configuration
            const response = await fetch(this.baseUrl);
            const headers = response.headers;
            
            const securityHeaders = [
                'x-content-type-options',
                'x-frame-options',
                'x-xss-protection'
            ];
            
            let securityScore = 0;
            securityHeaders.forEach(header => {
                if (headers.get(header)) securityScore++;
            });
            
            this.addResult('infrastructure', 'Security Headers',
                securityScore > 0 ? 'PASS' : 'WARN',
                `🔒 ${securityScore}/${securityHeaders.length} headers de sécurité présents`
            );

            // Test gzip/compression
            const acceptEncoding = headers.get('content-encoding');
            this.addResult('infrastructure', 'Compression',
                acceptEncoding ? 'PASS' : 'WARN',
                acceptEncoding ? `✅ Compression: ${acceptEncoding}` : '⚠️ Compression non détectée'
            );

        } catch (error) {
            this.addResult('infrastructure', 'Nginx Configuration',
                'ERROR', `💥 Erreur test nginx: ${error.message}`);
        }
    }

    async testAssets() {
        console.log('\n🎨 PHASE 2: TESTS DES ASSETS');
        console.log('-'.repeat(40));

        if (!this.siteConfig) {
            this.addResult('assets', 'Assets Test', 'SKIP', 
                '⏭️ Tests assets ignorés (pas de configuration)');
            return;
        }

        // Test 2.1: Logos
        await this.testLogos();
        
        // Test 2.2: Favicons
        await this.testFavicons();
        
        // Test 2.3: Images hero et services
        await this.testContentImages();
        
        // Test 2.4: Images blog
        await this.testBlogImages();
        
        // Test 2.5: Assets statiques
        await this.testStaticAssets();
    }

    async testLogos() {
        const logos = this.siteConfig?.brand?.logos;
        if (!logos) {
            this.addResult('assets', 'Logos', 'FAIL', '❌ Configuration logos manquante');
            return;
        }

        const logoTests = [
            { name: 'Navbar Logo', key: 'navbar' },
            { name: 'Footer Logo', key: 'footer' },
            { name: 'Default Logo', key: 'default' }
        ];

        for (const logo of logoTests) {
            const logoPath = logos[logo.key];
            if (logoPath) {
                await this.testAssetAccessibility(`Logo ${logo.name}`, logoPath, 'image');
            } else {
                this.addResult('assets', `Logo ${logo.name}`, 'FAIL', 
                    `❌ Chemin logo ${logo.key} manquant`);
            }
        }
    }

    async testFavicons() {
        const favicons = this.siteConfig?.brand?.favicons;
        if (!favicons) {
            this.addResult('assets', 'Favicons', 'WARN', '⚠️ Configuration favicons manquante');
            return;
        }

        const faviconTests = [
            { name: 'Light Favicon', key: 'light' },
            { name: 'Dark Favicon', key: 'dark' },
            { name: 'Default Favicon', key: 'default' }
        ];

        for (const favicon of faviconTests) {
            const faviconPath = favicons[favicon.key];
            if (faviconPath) {
                await this.testAssetAccessibility(`Favicon ${favicon.name}`, faviconPath, 'image');
            }
        }
    }

    async testContentImages() {
        // Test image hero
        const heroImage = this.siteConfig?.content?.hero?.image;
        if (heroImage) {
            await this.testAssetAccessibility('Hero Image', heroImage, 'image');
        }

        // Test images des services
        const services = this.siteConfig?.content?.services || [];
        for (let i = 0; i < Math.min(services.length, 5); i++) {
            const service = services[i];
            if (service.image) {
                await this.testAssetAccessibility(`Service Image ${i+1}`, service.image, 'image');
            }
        }
    }

    async testBlogImages() {
        try {
            const blogIndexUrl = `${this.baseUrl}/content/blog-index.json`;
            const response = await fetch(blogIndexUrl);
            
            if (response.ok) {
                const blogIndex = await response.json();
                const articles = blogIndex.articles || [];
                
                this.addResult('assets', 'Blog Index', 'PASS', 
                    `✅ ${articles.length} articles dans l'index`);

                // Test quelques images d'articles
                for (let i = 0; i < Math.min(articles.length, 3); i++) {
                    const article = articles[i];
                    if (article.image) {
                        await this.testAssetAccessibility(`Blog Image: ${article.title}`, 
                            article.image, 'image');
                    }
                }
            } else {
                this.addResult('assets', 'Blog Index', 'FAIL', 
                    `❌ Index blog inaccessible (${response.status})`);
            }
        } catch (error) {
            this.addResult('assets', 'Blog Images', 'ERROR', 
                `💥 Erreur test blog: ${error.message}`);
        }
    }

    async testStaticAssets() {
        const staticAssets = [
            { name: 'Robots.txt', path: '/robots.txt' },
            { name: 'Manifest', path: '/manifest.json' }
        ];

        for (const asset of staticAssets) {
            try {
                const response = await fetch(`${this.baseUrl}${asset.path}`);
                this.addResult('assets', asset.name, 
                    response.ok ? 'PASS' : 'WARN',
                    response.ok ? `✅ ${asset.name} accessible` : `⚠️ ${asset.name} manquant`);
            } catch (error) {
                this.addResult('assets', asset.name, 'ERROR', 
                    `💥 Erreur ${asset.name}: ${error.message}`);
            }
        }
    }

    async testAssetAccessibility(name, assetPath, type = 'asset') {
        try {
            const fullUrl = `${this.baseUrl}/assets/${assetPath}`;
            const response = await fetch(fullUrl);
            
            if (response.ok) {
                const size = parseInt(response.headers.get('content-length')) || 0;
                const contentType = response.headers.get('content-type') || 'unknown';
                
                // Vérifications spécifiques selon le type
                let status = 'PASS';
                let message = `✅ ${name} accessible`;
                
                if (type === 'image') {
                    if (size < 100) {
                        status = 'WARN';
                        message = `⚠️ ${name} très petit (${size} bytes)`;
                    } else if (!contentType.startsWith('image/')) {
                        status = 'WARN';
                        message = `⚠️ ${name} type MIME suspect: ${contentType}`;
                    } else {
                        message = `✅ ${name} accessible (${this.formatBytes(size)}, ${contentType})`;
                    }
                }
                
                this.addResult('assets', name, status, message);
            } else {
                this.addResult('assets', name, 'FAIL', 
                    `❌ ${name} inaccessible (${response.status})`);
            }
        } catch (error) {
            this.addResult('assets', name, 'ERROR', 
                `💥 Erreur ${name}: ${error.message}`);
        }
    }

    async testNavigation() {
        console.log('\n🧭 PHASE 3: TESTS DE NAVIGATION');
        console.log('-'.repeat(40));

        if (!this.siteConfig) {
            this.addResult('navigation', 'Navigation Test', 'SKIP', 
                '⏭️ Tests navigation ignorés (pas de configuration)');
            return;
        }

        // Test 3.1: Pages principales
        await this.testMainPages();
        
        // Test 3.2: Navigation links
        await this.testNavigationLinks();
        
        // Test 3.3: Blog pages
        await this.testBlogPages();
    }

    async testMainPages() {
        const mainPages = [
            { name: 'Home', path: '/' },
            { name: 'About', path: '/about' },
            { name: 'Services', path: '/services' },
            { name: 'Contact', path: '/contact' },
            { name: 'Blog', path: '/blog' }
        ];

        for (const page of mainPages) {
            await this.testPageAccessibility(page.name, page.path);
        }
    }

    async testNavigationLinks() {
        const navLinks = this.siteConfig?.navigation?.links || [];
        
        this.addResult('navigation', 'Navigation Config', 
            navLinks.length > 0 ? 'PASS' : 'FAIL',
            navLinks.length > 0 ? 
                `✅ ${navLinks.length} liens de navigation configurés` :
                '❌ Aucun lien de navigation configuré'
        );

        for (const link of navLinks) {
            if (link.path) {
                await this.testPageAccessibility(`Nav: ${link.name}`, link.path);
            }
        }
    }

    async testBlogPages() {
        try {
            const blogIndexUrl = `${this.baseUrl}/content/blog-index.json`;
            const response = await fetch(blogIndexUrl);
            
            if (response.ok) {
                const blogIndex = await response.json();
                const articles = blogIndex.articles || [];
                
                // Test quelques articles
                for (let i = 0; i < Math.min(articles.length, 3); i++) {
                    const article = articles[i];
                    await this.testPageAccessibility(`Blog: ${article.title}`, 
                        `/blog/${article.slug}`);
                }
            }
        } catch (error) {
            this.addResult('navigation', 'Blog Pages', 'ERROR', 
                `💥 Erreur test pages blog: ${error.message}`);
        }
    }

    async testPageAccessibility(name, path) {
        try {
            const fullUrl = `${this.baseUrl}${path}`;
            const startTime = Date.now();
            const response = await fetch(fullUrl);
            const loadTime = Date.now() - startTime;
            
            if (response.ok) {
                const html = await response.text();
                
                // Vérifications basiques de contenu
                const hasTitle = html.includes('<title>') && !html.includes('<title></title>');
                const hasContent = html.length > 1000;
                
                let status = 'PASS';
                let details = [];
                
                if (!hasTitle) {
                    status = 'WARN';
                    details.push('titre manquant');
                }
                if (!hasContent) {
                    status = 'WARN';
                    details.push('contenu insuffisant');
                }
                
                const message = status === 'PASS' ? 
                    `✅ ${name} accessible en ${loadTime}ms` :
                    `⚠️ ${name} accessible mais ${details.join(', ')}`;
                    
                this.addResult('navigation', name, status, message);
            } else {
                this.addResult('navigation', name, 'FAIL', 
                    `❌ ${name} inaccessible (${response.status})`);
            }
        } catch (error) {
            this.addResult('navigation', name, 'ERROR', 
                `💥 Erreur ${name}: ${error.message}`);
        }
    }

    async testFunctionality() {
        console.log('\n⚙️ PHASE 4: TESTS DE FONCTIONNALITÉS');
        console.log('-'.repeat(40));

        // Test 4.1: Formulaire de contact
        await this.testContactForm();
        
        // Test 4.2: Recherche blog (si activée)
        await this.testBlogSearch();
        
        // Test 4.3: Responsive design
        await this.testResponsiveDesign();
    }

    async testContactForm() {
        try {
            const contactResponse = await fetch(`${this.baseUrl}/contact`);
            const html = await contactResponse.text();
            
            // Vérifier la présence du formulaire
            const hasForm = html.includes('<form') || html.includes('contact-form');
            const hasN8nConfig = this.siteConfig?.integrations?.n8n?.enabled;
            const webhookUrl = this.siteConfig?.integrations?.n8n?.workflows?.contactForm?.webhookUrl;
            
            this.addResult('functionality', 'Contact Form HTML', 
                hasForm ? 'PASS' : 'FAIL',
                hasForm ? '✅ Formulaire présent dans HTML' : '❌ Formulaire non détecté');

            this.addResult('functionality', 'N8N Integration', 
                hasN8nConfig ? 'PASS' : 'FAIL',
                hasN8nConfig ? '✅ N8N activé' : '❌ N8N non configuré');

            if (webhookUrl) {
                this.addResult('functionality', 'Webhook URL', 'PASS', 
                    `✅ Webhook configuré: ${webhookUrl.substring(0, 50)}...`);
                
                // Test simple du webhook (HEAD request)
                try {
                    const webhookResponse = await fetch(webhookUrl, { 
                        method: 'HEAD',
                        timeout: 5000 
                    });
                    
                    this.addResult('functionality', 'Webhook Accessibility', 
                        webhookResponse.status < 500 ? 'PASS' : 'WARN',
                        `🔗 Webhook répond ${webhookResponse.status}`);
                } catch (webhookError) {
                    this.addResult('functionality', 'Webhook Accessibility', 'WARN', 
                        `⚠️ Webhook non testable: ${webhookError.message}`);
                }
            } else {
                this.addResult('functionality', 'Webhook URL', 'FAIL', 
                    '❌ URL webhook manquante');
            }
        } catch (error) {
            this.addResult('functionality', 'Contact Form', 'ERROR', 
                `💥 Erreur test formulaire: ${error.message}`);
        }
    }

    async testBlogSearch() {
        const blogSearchEnabled = this.siteConfig?.features?.blogSearch;
        
        if (blogSearchEnabled) {
            this.addResult('functionality', 'Blog Search Feature', 'PASS', 
                '✅ Recherche blog activée');
            
            // Test page blog pour vérifier la présence du champ de recherche
            try {
                const blogResponse = await fetch(`${this.baseUrl}/blog`);
                const html = await blogResponse.text();
                
                const hasSearchInput = html.includes('type="search"') || 
                                     html.includes('search') && html.includes('input');
                
                this.addResult('functionality', 'Blog Search UI', 
                    hasSearchInput ? 'PASS' : 'WARN',
                    hasSearchInput ? '✅ Interface de recherche détectée' : 
                                   '⚠️ Interface de recherche non trouvée');
            } catch (error) {
                this.addResult('functionality', 'Blog Search UI', 'ERROR', 
                    `💥 Erreur test recherche: ${error.message}`);
            }
        } else {
            this.addResult('functionality', 'Blog Search Feature', 'SKIP', 
                '⏭️ Recherche blog désactivée');
        }
    }

    async testResponsiveDesign() {
        try {
            const response = await fetch(this.baseUrl);
            const html = await response.text();
            
            // Vérifier la présence de meta viewport
            const hasViewport = html.includes('name="viewport"');
            
            // Vérifier la présence de classes responsive (Tailwind)
            const hasResponsiveClasses = html.includes('md:') || html.includes('lg:') || 
                                       html.includes('sm:');
            
            this.addResult('functionality', 'Viewport Meta', 
                hasViewport ? 'PASS' : 'FAIL',
                hasViewport ? '✅ Meta viewport configuré' : '❌ Meta viewport manquant');

            this.addResult('functionality', 'Responsive Classes', 
                hasResponsiveClasses ? 'PASS' : 'WARN',
                hasResponsiveClasses ? '✅ Classes responsive détectées' : 
                                     '⚠️ Classes responsive non détectées');
        } catch (error) {
            this.addResult('functionality', 'Responsive Design', 'ERROR', 
                `💥 Erreur test responsive: ${error.message}`);
        }
    }

    async testPerformance() {
        console.log('\n🚄 PHASE 5: TESTS DE PERFORMANCE');
        console.log('-'.repeat(40));

        // Test 5.1: Temps de chargement pages principales
        await this.testPageLoadTimes();
        
        // Test 5.2: Taille des assets
        await this.testAssetSizes();
        
        // Test 5.3: Cache headers
        await this.testCacheHeaders();
    }

    async testPageLoadTimes() {
        const pagesToTest = [
            { name: 'Home', path: '/' },
            { name: 'About', path: '/about' },
            { name: 'Services', path: '/services' },
            { name: 'Contact', path: '/contact' }
        ];

        for (const page of pagesToTest) {
            try {
                const startTime = Date.now();
                const response = await fetch(`${this.baseUrl}${page.path}`);
                const loadTime = Date.now() - startTime;
                
                let status = 'PASS';
                if (loadTime > 3000) status = 'FAIL';
                else if (loadTime > 1500) status = 'WARN';
                
                this.addResult('performance', `Load Time: ${page.name}`, status,
                    `⏱️ ${loadTime}ms (${status === 'PASS' ? 'Excellent' : 
                                     status === 'WARN' ? 'Acceptable' : 'Lent'})`);
            } catch (error) {
                this.addResult('performance', `Load Time: ${page.name}`, 'ERROR',
                    `💥 Erreur mesure temps: ${error.message}`);
            }
        }
    }

    async testAssetSizes() {
        // Test quelques assets critiques
        if (!this.siteConfig) return;
        
        const assetsToTest = [];
        
        // Ajouter les logos
        const logos = this.siteConfig.brand?.logos;
        if (logos?.navbar) assetsToTest.push({ name: 'Navbar Logo', path: logos.navbar });
        if (logos?.footer) assetsToTest.push({ name: 'Footer Logo', path: logos.footer });
        
        // Ajouter l'image hero
        const heroImage = this.siteConfig.content?.hero?.image;
        if (heroImage) assetsToTest.push({ name: 'Hero Image', path: heroImage });

        for (const asset of assetsToTest) {
            try {
                const response = await fetch(`${this.baseUrl}/assets/${asset.path}`, 
                    { method: 'HEAD' });
                
                if (response.ok) {
                    const size = parseInt(response.headers.get('content-length')) || 0;
                    
                    let status = 'PASS';
                    if (size > 500000) status = 'WARN'; // > 500KB
                    if (size > 1000000) status = 'FAIL'; // > 1MB
                    
                    this.addResult('performance', `Size: ${asset.name}`, status,
                        `📦 ${this.formatBytes(size)} (${status === 'PASS' ? 'Optimal' : 
                                                   status === 'WARN' ? 'Large' : 'Très large'})`);
                }
            } catch (error) {
                this.addResult('performance', `Size: ${asset.name}`, 'ERROR',
                    `💥 Erreur taille asset: ${error.message}`);
            }
        }
    }

    async testCacheHeaders() {
        try {
            const response = await fetch(this.baseUrl);
            const cacheControl = response.headers.get('cache-control');
            const lastModified = response.headers.get('last-modified');
            const etag = response.headers.get('etag');
            
            this.addResult('performance', 'Cache Control', 
                cacheControl ? 'PASS' : 'WARN',
                cacheControl ? `✅ Cache-Control: ${cacheControl}` : 
                             '⚠️ Cache-Control manquant');

            const hasCacheHeaders = lastModified || etag;
            this.addResult('performance', 'Cache Headers', 
                hasCacheHeaders ? 'PASS' : 'WARN',
                hasCacheHeaders ? '✅ Headers de cache présents' : 
                                '⚠️ Headers de cache manquants');
        } catch (error) {
            this.addResult('performance', 'Cache Headers', 'ERROR',
                `💥 Erreur test cache: ${error.message}`);
        }
    }

    async testSEO() {
        console.log('\n🔍 PHASE 6: TESTS SEO');
        console.log('-'.repeat(40));

        try {
            const response = await fetch(this.baseUrl);
            const html = await response.text();
            
            // Test 6.1: Meta tags essentiels
            await this.testMetaTags(html);
            
            // Test 6.2: Structure HTML
            await this.testHTMLStructure(html);
            
            // Test 6.3: Contenu
            await this.testSEOContent(html);
            
        } catch (error) {
            this.addResult('seo', 'SEO Tests', 'ERROR',
                `💥 Erreur tests SEO: ${error.message}`);
        }
    }

    async testMetaTags(html) {
        const metaTests = [
            { name: 'Title Tag', regex: /<title>(.+?)<\/title>/, required: true },
            { name: 'Meta Description', regex: /<meta[^>]*name="description"[^>]*content="([^"]+)"/, required: true },
            { name: 'Meta Keywords', regex: /<meta[^>]*name="keywords"/, required: false },
            { name: 'Open Graph Title', regex: /<meta[^>]*property="og:title"/, required: false },
            { name: 'Open Graph Description', regex: /<meta[^>]*property="og:description"/, required: false }
        ];

        for (const test of metaTests) {
            const match = html.match(test.regex);
            const found = !!match;
            
            let status = found ? 'PASS' : (test.required ? 'FAIL' : 'WARN');
            let message = found ? 
                `✅ ${test.name} présent` + (match[1] ? `: "${match[1].substring(0, 50)}..."` : '') :
                `${test.required ? '❌' : '⚠️'} ${test.name} manquant`;
            
            this.addResult('seo', test.name, status, message);
        }
    }

    async testHTMLStructure(html) {
        // Test structure heading
        const headings = {
            h1: (html.match(/<h1/g) || []).length,
            h2: (html.match(/<h2/g) || []).length,
            h3: (html.match(/<h3/g) || []).length
        };

        this.addResult('seo', 'H1 Tags', 
            headings.h1 === 1 ? 'PASS' : (headings.h1 === 0 ? 'FAIL' : 'WARN'),
            `🏷️ ${headings.h1} H1 tag(s) ${headings.h1 === 1 ? '(optimal)' : 
                                        headings.h1 === 0 ? '(manquant)' : '(trop nombreux)'}`);

        this.addResult('seo', 'Heading Structure', 
            headings.h2 > 0 ? 'PASS' : 'WARN',
            `📑 Structure: H1(${headings.h1}) H2(${headings.h2}) H3(${headings.h3})`);

        // Test images alt
        const images = (html.match(/<img/g) || []).length;
        const imagesWithAlt = (html.match(/<img[^>]*alt=/g) || []).length;
        
        this.addResult('seo', 'Image Alt Tags', 
            images === 0 ? 'SKIP' : (imagesWithAlt === images ? 'PASS' : 'WARN'),
            images === 0 ? '⏭️ Aucune image trouvée' : 
                         `🖼️ ${imagesWithAlt}/${images} images avec alt`);
    }

    async testSEOContent(html) {
        // Test contenu textuel
        const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const wordCount = textContent.split(' ').length;
        
        this.addResult('seo', 'Content Length', 
            wordCount > 300 ? 'PASS' : (wordCount > 100 ? 'WARN' : 'FAIL'),
            `📝 ${wordCount} mots ${wordCount > 300 ? '(suffisant)' : 
                                wordCount > 100 ? '(limite)' : '(insuffisant)'}`);

        // Test liens internes
        const internalLinks = (html.match(/href="\/[^"]*"/g) || []).length;
        this.addResult('seo', 'Internal Links', 
            internalLinks > 5 ? 'PASS' : 'WARN',
            `🔗 ${internalLinks} liens internes`);
    }

    async testAccessibility() {
        console.log('\n♿ PHASE 7: TESTS D\'ACCESSIBILITÉ');
        console.log('-'.repeat(40));

        try {
            const response = await fetch(this.baseUrl);
            const html = await response.text();
            
            // Test 7.1: Contraste et couleurs
            await this.testColorContrast();
            
            // Test 7.2: Navigation clavier
            await this.testKeyboardNavigation(html);
            
            // Test 7.3: ARIA et sémantique
            await this.testARIA(html);
            
        } catch (error) {
            this.addResult('accessibility', 'Accessibility Tests', 'ERROR',
                `💥 Erreur tests accessibilité: ${error.message}`);
        }
    }

    async testColorContrast() {
        if (!this.siteConfig?.brand?.colors) {
            this.addResult('accessibility', 'Color Contrast', 'SKIP',
                '⏭️ Configuration couleurs non disponible');
            return;
        }

        const colors = this.siteConfig.brand.colors;
        const hasMultipleColors = Object.keys(colors).length >= 3;
        
        this.addResult('accessibility', 'Color Configuration', 
            hasMultipleColors ? 'PASS' : 'WARN',
            hasMultipleColors ? '✅ Palette de couleurs configurée' : 
                              '⚠️ Palette de couleurs limitée');
    }

    async testKeyboardNavigation(html) {
        // Test présence d'éléments focusables
        const focusableElements = [
            (html.match(/<a[^>]*href/g) || []).length,
            (html.match(/<button/g) || []).length,
            (html.match(/<input/g) || []).length,
            (html.match(/<textarea/g) || []).length
        ].reduce((a, b) => a + b, 0);

        this.addResult('accessibility', 'Focusable Elements', 
            focusableElements > 0 ? 'PASS' : 'WARN',
            `⌨️ ${focusableElements} éléments focalisables détectés`);

        // Test skip links
        const hasSkipLinks = html.includes('skip') && html.includes('main');
        this.addResult('accessibility', 'Skip Links', 
            hasSkipLinks ? 'PASS' : 'WARN',
            hasSkipLinks ? '✅ Liens de saut détectés' : '⚠️ Liens de saut non détectés');
    }

    async testARIA(html) {
        // Test ARIA labels et rôles
        const ariaElements = (html.match(/aria-/g) || []).length;
        const roleElements = (html.match(/role="/g) || []).length;
        
        this.addResult('accessibility', 'ARIA Attributes', 
            ariaElements > 0 ? 'PASS' : 'WARN',
            `🏷️ ${ariaElements} attributs ARIA, ${roleElements} rôles`);

        // Test éléments sémantiques HTML5
        const semanticElements = [
            'header', 'nav', 'main', 'section', 'article', 'aside', 'footer'
        ].filter(tag => html.includes(`<${tag}`)).length;

        this.addResult('accessibility', 'Semantic HTML', 
            semanticElements >= 4 ? 'PASS' : 'WARN',
            `📋 ${semanticElements}/7 éléments sémantiques utilisés`);
    }

    // Méthodes utilitaires
    addResult(category, test, status, message) {
        const result = { test, status, message, timestamp: new Date().toISOString() };
        this.results[category].push(result);
        
        // Mettre à jour le résumé
        this.results.summary.total++;
        switch (status) {
            case 'PASS': this.results.summary.passed++; break;
            case 'FAIL': this.results.summary.failed++; break;
            case 'WARN': this.results.summary.warnings++; break;
            case 'ERROR': this.results.summary.errors++; break;
        }

        // Affichage console avec couleurs
        const statusIcon = {
            'PASS': '✅',
            'FAIL': '❌', 
            'WARN': '⚠️',
            'ERROR': '💥',
            'SKIP': '⏭️'
        }[status] || '❓';

        console.log(`${statusIcon} ${test}: ${message}`);
    }

    addError(level, context, message) {
        this.results.errors.push({
            level, context, message, timestamp: new Date().toISOString()
        });
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    generateComprehensiveReport() {
        console.log('\n📊 RAPPORT COMPLET DES TESTS');
        console.log('=' .repeat(60));
        
        const { summary } = this.results;
        const totalTests = summary.total;
        const successRate = totalTests > 0 ? Math.round((summary.passed / totalTests) * 100) : 0;
        
        // Résumé général
        console.log(`\n🎯 RÉSUMÉ GÉNÉRAL`);
        console.log(`Tests exécutés: ${totalTests}`);
        console.log(`✅ Réussis: ${summary.passed} (${successRate}%)`);
        console.log(`❌ Échoués: ${summary.failed}`);
        console.log(`⚠️ Avertissements: ${summary.warnings}`);
        console.log(`💥 Erreurs: ${summary.errors}`);
        
        // Détail par catégorie
        const categories = [
            { name: '🏗️ Infrastructure', key: 'infrastructure' },
            { name: '🎨 Assets', key: 'assets' },
            { name: '🧭 Navigation', key: 'navigation' },
            { name: '⚙️ Fonctionnalités', key: 'functionality' },
            { name: '🚄 Performance', key: 'performance' },
            { name: '🔍 SEO', key: 'seo' },
            { name: '♿ Accessibilité', key: 'accessibility' }
        ];

        for (const category of categories) {
            const results = this.results[category.key];
            if (results.length > 0) {
                const categoryPassed = results.filter(r => r.status === 'PASS').length;
                const categoryTotal = results.length;
                const categoryRate = Math.round((categoryPassed / categoryTotal) * 100);
                
                console.log(`\n${category.name} (${categoryRate}% - ${categoryPassed}/${categoryTotal})`);
                console.log('-'.repeat(category.name.length + 20));
                
                // Afficher seulement les échecs et avertissements pour économiser l'espace
                const issues = results.filter(r => ['FAIL', 'ERROR', 'WARN'].includes(r.status));
                if (issues.length > 0) {
                    issues.forEach(result => {
                        const icon = {
                            'FAIL': '❌',
                            'ERROR': '💥',
                            'WARN': '⚠️'
                        }[result.status];
                        console.log(`  ${icon} ${result.test}: ${result.message}`);
                    });
                } else {
                    console.log('  🎉 Tous les tests réussis dans cette catégorie');
                }
            }
        }

        // Recommandations
        this.generateRecommendations();
        
        // Statut final
        console.log('\n' + '='.repeat(60));
        if (summary.failed === 0 && summary.errors === 0) {
            if (summary.warnings === 0) {
                console.log('🎉 TOUS LES TESTS RÉUSSIS - Site entièrement fonctionnel');
            } else {
                console.log('🟡 SITE FONCTIONNEL avec avertissements - Améliorations recommandées');
            }
        } else {
            console.log('🔴 PROBLÈMES DÉTECTÉS - Corrections requises avant validation');
        }
        
        // Sauvegarde du rapport
        this.saveComprehensiveReport();
    }

    generateRecommendations() {
        console.log('\n💡 RECOMMANDATIONS');
        console.log('-'.repeat(20));
        
        const { summary } = this.results;
        
        if (summary.failed > 0) {
            console.log('🔴 ACTIONS CRITIQUES:');
            
            // Analyser les échecs par catégorie
            const failedByCategory = {};
            Object.keys(this.results).forEach(category => {
                if (Array.isArray(this.results[category])) {
                    const failed = this.results[category].filter(r => r.status === 'FAIL');
                    if (failed.length > 0) {
                        failedByCategory[category] = failed.length;
                    }
                }
            });
            
            Object.entries(failedByCategory).forEach(([category, count]) => {
                console.log(`  • Corriger ${count} problème(s) dans ${category}`);
            });
        }
        
        if (summary.warnings > 0) {
            console.log('\n🟡 AMÉLIORATIONS SUGGÉRÉES:');
            console.log('  • Optimiser les performances');
            console.log('  • Améliorer l\'accessibilité');
            console.log('  • Renforcer le SEO');
        }
        
        if (summary.passed === summary.total) {
            console.log('\n🎯 OPTIMISATIONS AVANCÉES:');
            console.log('  • Mettre en place le monitoring');
            console.log('  • Configurer la compression avancée');
            console.log('  • Optimiser le cache navigateur');
        }
    }

    async saveComprehensiveReport() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(process.cwd(), 'test-results', 
            `comprehensive-test-${this.siteName}-${timestamp}.json`);
        
        await fs.ensureDir(path.dirname(reportPath));
        
        const report = {
            siteName: this.siteName,
            baseUrl: this.baseUrl,
            timestamp: new Date().toISOString(),
            results: this.results,
            summary: this.results.summary,
            siteConfig: this.siteConfig ? 'Present' : 'Missing'
        };
        
        await fs.writeJSON(reportPath, report, { spaces: 2 });
        console.log(`\n💾 Rapport complet sauvegardé: ${reportPath}`);
        
        // Créer aussi un résumé lisible
        const summaryPath = reportPath.replace('.json', '-summary.txt');
        const summaryContent = this.generateTextSummary();
        await fs.writeFile(summaryPath, summaryContent);
        console.log(`📝 Résumé textuel: ${summaryPath}`);
    }

    generateTextSummary() {
        const { summary } = this.results;
        const successRate = summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 0;
        
        return `
RAPPORT DE TESTS AUTOMATISÉS - ${this.siteName.toUpperCase()}
URL: ${this.baseUrl}
Date: ${new Date().toLocaleString()}

RÉSULTATS GLOBAUX:
==================
Tests exécutés: ${summary.total}
Taux de réussite: ${successRate}%
✅ Réussis: ${summary.passed}
❌ Échoués: ${summary.failed}
⚠️ Avertissements: ${summary.warnings}
💥 Erreurs: ${summary.errors}

STATUT FINAL:
${summary.failed === 0 && summary.errors === 0 ? 
  (summary.warnings === 0 ? '🎉 SITE ENTIÈREMENT FONCTIONNEL' : '🟡 SITE FONCTIONNEL AVEC AVERTISSEMENTS') :
  '🔴 PROBLÈMES DÉTECTÉS - CORRECTIONS REQUISES'}

ACTIONS RECOMMANDÉES:
${summary.failed > 0 ? '1. Corriger les problèmes critiques identifiés' : ''}
${summary.warnings > 0 ? '2. Traiter les avertissements pour optimiser' : ''}
${summary.passed === summary.total ? '3. Site prêt pour la production' : ''}
`;
    }
}

// CLI Usage
if (import.meta.url === `file://${process.argv[1]}`) {
    async function main() {
        const [,, baseUrl, siteName] = process.argv;
        
        if (!baseUrl || !siteName) {
            console.error('Usage: node comprehensive-site-tests.js <baseUrl> <siteName>');
            console.error('Exemple: node comprehensive-site-tests.js http://162.55.213.90:3001 translatepros');
            process.exit(1);
        }
        
        const tester = new ComprehensiveSiteTester(baseUrl, siteName);
        await tester.runAllTests();
        
        // Exit code basé sur les résultats
        const { summary } = tester.results;
        if (summary.errors > 0) {
            process.exit(2); // Erreurs critiques
        } else if (summary.failed > 0) {
            process.exit(1); // Tests échoués
        } else {
            process.exit(0); // Succès (avec ou sans avertissements)
        }
    }
    
    main().catch(error => {
        console.error('💥 Erreur fatale lors des tests:', error);
        process.exit(2);
    });
}

export { ComprehensiveSiteTester };