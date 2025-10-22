#!/usr/bin/env node

/**
 * 🧪 Tests Automatisés de Régression
 * 
 * Vérifie automatiquement les problèmes récurrents:
 * 1. Logo cropping et affichage
 * 2. Images blog accessibles
 * 3. Formulaire de contact fonctionnel
 */

import fetch from 'node-fetch';
import fs from 'fs-extra';
import path from 'path';

class RegressionTester {
    constructor(baseUrl, siteName) {
        this.baseUrl = baseUrl;
        this.siteName = siteName;
        this.results = {
            logoTests: [],
            imageTests: [],
            contactFormTests: [],
            overallStatus: 'pending'
        };
    }

    async runAllTests() {
        console.log(`🧪 Démarrage des tests automatisés pour ${this.siteName}`);
        console.log(`🌐 URL de base: ${this.baseUrl}`);
        
        try {
            // Test 1: Vérification des logos
            await this.testLogos();
            
            // Test 2: Vérification des images blog
            await this.testBlogImages();
            
            // Test 3: Vérification du formulaire de contact
            await this.testContactForm();
            
            // Générer le rapport final
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Erreur lors des tests:', error);
            this.results.overallStatus = 'error';
        }
    }

    async testLogos() {
        console.log('\n📋 Test 1: Vérification des logos');
        
        try {
            // Récupérer la page d'accueil
            const response = await fetch(this.baseUrl);
            const html = await response.text();
            
            // Extraire la configuration du site
            const configMatch = html.match(/window\.SITE_CONFIG\s*=\s*({.*?});/s);
            if (!configMatch) {
                this.results.logoTests.push({
                    test: 'Configuration extraction',
                    status: 'failed',
                    message: 'Impossible d\'extraire la configuration du site'
                });
                return;
            }
            
            const siteConfig = JSON.parse(configMatch[1]);
            const logos = siteConfig.brand?.logos;
            
            if (!logos) {
                this.results.logoTests.push({
                    test: 'Logo configuration',
                    status: 'failed',
                    message: 'Configuration des logos manquante'
                });
                return;
            }
            
            // Test d'accessibilité des logos
            const logoTests = [
                { name: 'Navbar Logo', path: logos.navbar },
                { name: 'Footer Logo', path: logos.footer },
                { name: 'Default Logo', path: logos.default }
            ];
            
            for (const logoTest of logoTests) {
                const logoUrl = `${this.baseUrl}/assets/${logoTest.path}`;
                try {
                    const logoResponse = await fetch(logoUrl);
                    
                    this.results.logoTests.push({
                        test: logoTest.name,
                        status: logoResponse.ok ? 'passed' : 'failed',
                        message: logoResponse.ok ? 
                            `✅ ${logoTest.path} accessible (${logoResponse.status})` :
                            `❌ ${logoTest.path} inaccessible (${logoResponse.status})`,
                        url: logoUrl
                    });
                } catch (error) {
                    this.results.logoTests.push({
                        test: logoTest.name,
                        status: 'failed',
                        message: `❌ Erreur lors du test: ${error.message}`,
                        url: logoUrl
                    });
                }
            }
            
            // Vérifier la présence des logos dans le HTML
            const navbarLogoPresent = html.includes(logos.navbar);
            const footerLogoPresent = html.includes(logos.footer);
            
            this.results.logoTests.push({
                test: 'Logo dans HTML',
                status: (navbarLogoPresent && footerLogoPresent) ? 'passed' : 'failed',
                message: `Navbar: ${navbarLogoPresent}, Footer: ${footerLogoPresent}`
            });
            
        } catch (error) {
            this.results.logoTests.push({
                test: 'Test général logos',
                status: 'error',
                message: error.message
            });
        }
    }

    async testBlogImages() {
        console.log('\n📋 Test 2: Vérification des images blog');
        
        try {
            // Récupérer l'index du blog
            const blogIndexUrl = `${this.baseUrl}/content/blog-index.json`;
            const response = await fetch(blogIndexUrl);
            
            if (!response.ok) {
                this.results.imageTests.push({
                    test: 'Blog index',
                    status: 'failed',
                    message: `Index blog inaccessible: ${response.status}`
                });
                return;
            }
            
            const blogIndex = await response.json();
            const articles = blogIndex.articles || [];
            
            this.results.imageTests.push({
                test: 'Blog index',
                status: 'passed',
                message: `✅ ${articles.length} articles trouvés`
            });
            
            // Test d'accessibilité des images des articles
            for (const article of articles.slice(0, 3)) { // Limiter à 3 pour éviter trop de requêtes
                if (article.image) {
                    const imageUrl = `${this.baseUrl}/assets/${article.image}`;
                    try {
                        const imageResponse = await fetch(imageUrl);
                        
                        this.results.imageTests.push({
                            test: `Image: ${article.title}`,
                            status: imageResponse.ok ? 'passed' : 'failed',
                            message: imageResponse.ok ? 
                                `✅ ${article.image} accessible` :
                                `❌ ${article.image} inaccessible (${imageResponse.status})`,
                            url: imageUrl
                        });
                    } catch (error) {
                        this.results.imageTests.push({
                            test: `Image: ${article.title}`,
                            status: 'failed',
                            message: `❌ Erreur: ${error.message}`,
                            url: imageUrl
                        });
                    }
                }
            }
            
        } catch (error) {
            this.results.imageTests.push({
                test: 'Test général images blog',
                status: 'error',
                message: error.message
            });
        }
    }

    async testContactForm() {
        console.log('\n📋 Test 3: Vérification du formulaire de contact');
        
        try {
            // Récupérer la page de contact
            const contactUrl = `${this.baseUrl}/contact`;
            const response = await fetch(contactUrl);
            const html = await response.text();
            
            // Vérifier la présence du formulaire
            const hasContactForm = html.includes('contact-form') || html.includes('form');
            const hasWebhookConfig = html.includes('webhook') || html.includes('n8n');
            
            this.results.contactFormTests.push({
                test: 'Page contact accessible',
                status: response.ok ? 'passed' : 'failed',
                message: response.ok ? '✅ Page contact accessible' : `❌ Page contact inaccessible (${response.status})`
            });
            
            this.results.contactFormTests.push({
                test: 'Présence formulaire',
                status: hasContactForm ? 'passed' : 'failed',
                message: hasContactForm ? '✅ Formulaire détecté dans HTML' : '❌ Formulaire non détecté'
            });
            
            // Extraire la configuration N8N du site
            const configMatch = html.match(/window\.SITE_CONFIG\s*=\s*({.*?});/s);
            if (configMatch) {
                const siteConfig = JSON.parse(configMatch[1]);
                const n8nConfig = siteConfig.integrations?.n8n;
                
                if (n8nConfig?.enabled) {
                    const webhookUrl = n8nConfig.workflows?.contactForm?.webhookUrl;
                    
                    this.results.contactFormTests.push({
                        test: 'Configuration N8N',
                        status: webhookUrl ? 'passed' : 'failed',
                        message: webhookUrl ? `✅ Webhook configuré: ${webhookUrl}` : '❌ Webhook manquant'
                    });
                    
                    // Test ping du webhook (simple HEAD request)
                    if (webhookUrl) {
                        try {
                            const webhookResponse = await fetch(webhookUrl, { method: 'HEAD' });
                            this.results.contactFormTests.push({
                                test: 'Webhook accessibility',
                                status: webhookResponse.ok ? 'passed' : 'warning',
                                message: webhookResponse.ok ? 
                                    '✅ Webhook accessible' : 
                                    `⚠️ Webhook répond ${webhookResponse.status} (normal pour HEAD)`
                            });
                        } catch (error) {
                            this.results.contactFormTests.push({
                                test: 'Webhook accessibility',
                                status: 'warning',
                                message: `⚠️ Test webhook impossible: ${error.message}`
                            });
                        }
                    }
                } else {
                    this.results.contactFormTests.push({
                        test: 'Configuration N8N',
                        status: 'failed',
                        message: '❌ N8N non activé dans la configuration'
                    });
                }
            }
            
        } catch (error) {
            this.results.contactFormTests.push({
                test: 'Test général contact form',
                status: 'error',
                message: error.message
            });
        }
    }

    generateReport() {
        console.log('\n📊 RAPPORT DE TESTS AUTOMATISÉS');
        console.log('=====================================');
        
        const allTests = [
            ...this.results.logoTests,
            ...this.results.imageTests,
            ...this.results.contactFormTests
        ];
        
        const passed = allTests.filter(t => t.status === 'passed').length;
        const failed = allTests.filter(t => t.status === 'failed').length;
        const warnings = allTests.filter(t => t.status === 'warning').length;
        const errors = allTests.filter(t => t.status === 'error').length;
        
        console.log(`📈 Résultats: ${passed} ✅ | ${failed} ❌ | ${warnings} ⚠️ | ${errors} 💥`);
        
        // Détail par catégorie
        this.printTestCategory('🎨 TESTS LOGOS', this.results.logoTests);
        this.printTestCategory('🖼️ TESTS IMAGES BLOG', this.results.imageTests);
        this.printTestCategory('📧 TESTS FORMULAIRE CONTACT', this.results.contactFormTests);
        
        // Statut global
        if (failed > 0 || errors > 0) {
            this.results.overallStatus = 'failed';
            console.log('\n❌ TESTS ÉCHOUÉS - Des régressions sont présentes');
        } else if (warnings > 0) {
            this.results.overallStatus = 'warning';
            console.log('\n⚠️ TESTS AVEC AVERTISSEMENTS - Vérification manuelle recommandée');
        } else {
            this.results.overallStatus = 'passed';
            console.log('\n✅ TOUS LES TESTS RÉUSSIS - Aucune régression détectée');
        }
        
        // Sauvegarder le rapport
        this.saveReport();
    }

    printTestCategory(title, tests) {
        console.log(`\n${title}`);
        console.log('-'.repeat(title.length));
        
        for (const test of tests) {
            const status = {
                'passed': '✅',
                'failed': '❌',
                'warning': '⚠️',
                'error': '💥'
            }[test.status] || '❓';
            
            console.log(`${status} ${test.test}: ${test.message}`);
            if (test.url) {
                console.log(`   URL: ${test.url}`);
            }
        }
    }

    async saveReport() {
        const reportPath = path.join(process.cwd(), 'test-results', `regression-test-${this.siteName}-${Date.now()}.json`);
        await fs.ensureDir(path.dirname(reportPath));
        
        const report = {
            siteName: this.siteName,
            baseUrl: this.baseUrl,
            timestamp: new Date().toISOString(),
            results: this.results
        };
        
        await fs.writeJSON(reportPath, report, { spaces: 2 });
        console.log(`\n💾 Rapport sauvegardé: ${reportPath}`);
    }
}

// CLI Usage
if (import.meta.url === `file://${process.argv[1]}`) {
    async function main() {
        const [,, baseUrl, siteName] = process.argv;
        
        if (!baseUrl || !siteName) {
            console.error('Usage: node automated-regression-tests.js <baseUrl> <siteName>');
            console.error('Exemple: node automated-regression-tests.js http://162.55.213.90:3001 translatepros');
            process.exit(1);
        }
        
        const tester = new RegressionTester(baseUrl, siteName);
        await tester.runAllTests();
        
        // Exit avec code d'erreur si tests échoués
        if (tester.results.overallStatus === 'failed') {
            process.exit(1);
        }
    }
    
    main().catch(console.error);
}

export { RegressionTester };