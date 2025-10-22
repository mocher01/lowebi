/**
 * 🧪 Configuration Generator Tests v1.1.1.9.2.4.2.4
 * 
 * Tests configuration generation and template management
 */

const { ConfigGenerator } = require('../v1-api/config-generator');
const fs = require('fs-extra');
const path = require('path');

describe('Configuration Generator v1.1.1.9.2.4.2.4', () => {
    let configGenerator;
    const testTemplatesDir = path.join(__dirname, 'test-templates');
    const testConfigsDir = path.join(__dirname, 'test-configs');

    beforeAll(async () => {
        configGenerator = new ConfigGenerator();
        configGenerator.templatesDir = testTemplatesDir;
        configGenerator.configsDir = testConfigsDir;
        
        // Clean up test directories
        await fs.remove(testTemplatesDir);
        await fs.remove(testConfigsDir);
    });

    afterAll(async () => {
        // Clean up test directories
        await fs.remove(testTemplatesDir);
        await fs.remove(testConfigsDir);
    });

    describe('✅ Configuration Generation', () => {
        test('Should generate basic configuration from wizard data', () => {
            const wizardData = {
                siteName: 'Test Site',
                businessType: 'translation',
                domain: 'testsite.com',
                slogan: 'Professional Translation Services',
                colors: {
                    primary: '#059669',
                    secondary: '#10B981',
                    accent: '#34D399'
                },
                contact: {
                    email: 'contact@testsite.com',
                    phone: '+1234567890'
                },
                n8nEnabled: true
            };

            const config = configGenerator.generateConfig(wizardData);

            expect(config.meta.siteId).toBe('test-site');
            expect(config.meta.domain).toBe('testsite.com');
            expect(config.brand.name).toBe('Test Site');
            expect(config.brand.slogan).toBe('Professional Translation Services');
            expect(config.brand.colors.primary).toBe('#059669');
            expect(config.contact.email).toBe('contact@testsite.com');
            expect(config.integrations.n8n.enabled).toBe(true);
        });

        test('Should apply business type defaults', () => {
            const wizardData = {
                siteName: 'Education Site',
                businessType: 'education'
            };

            const config = configGenerator.generateConfig(wizardData);

            expect(config.brand.colors.primary).toBe('#3B82F6');
            expect(config.features.blog).toBe(true);
            expect(config.content.services).toHaveLength(3);
            expect(config.content.services[0].title).toBe('Online Courses');
        });

        test('Should generate valid site ID from name', () => {
            expect(configGenerator.generateSiteId('My Great Site!')).toBe('my-great-site');
            expect(configGenerator.generateSiteId('Café & Restaurant')).toBe('caf-restaurant');
            expect(configGenerator.generateSiteId('123 Numbers & Symbols @#$')).toBe('123-numbers-symbols');
        });

        test('Should validate configuration correctly', () => {
            const validConfig = {
                meta: { siteId: 'test-site' },
                brand: { 
                    name: 'Test Site',
                    colors: { primary: '#059669' }
                },
                contact: { email: 'test@example.com' }
            };

            const validation = configGenerator.validateConfig(validConfig);
            expect(validation.valid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });

        test('Should detect validation errors', () => {
            const invalidConfig = {
                meta: {},
                brand: { colors: { primary: 'invalid-color' } },
                contact: { email: 'invalid-email' }
            };

            const validation = configGenerator.validateConfig(invalidConfig);
            expect(validation.valid).toBe(false);
            expect(validation.errors.length).toBeGreaterThan(0);
            expect(validation.errors).toContain('Site ID is required');
            expect(validation.errors).toContain('Brand name is required');
            expect(validation.errors).toContain('Invalid email format');
            expect(validation.errors).toContain('Invalid primary color format');
        });
    });

    describe('✅ Configuration File Management', () => {
        test('Should save configuration to file', async () => {
            const config = {
                meta: { siteId: 'test-save' },
                brand: { 
                    name: 'Test Save Site',
                    colors: { primary: '#059669' }
                },
                contact: { email: 'test@example.com' }
            };

            const result = await configGenerator.saveConfig(config);

            expect(result.success).toBe(true);
            expect(result.siteId).toBe('test-save');
            expect(result.configPath).toContain('test-save');

            // Verify file was created
            const configPath = path.join(testConfigsDir, 'test-save', 'site-config.json');
            expect(await fs.pathExists(configPath)).toBe(true);

            // Verify content
            const savedConfig = await fs.readJson(configPath);
            expect(savedConfig.meta.siteId).toBe('test-save');
            expect(savedConfig.brand.name).toBe('Test Save Site');
        });

        test('Should create directory structure', async () => {
            const config = {
                meta: { siteId: 'test-dirs' },
                brand: { 
                    name: 'Test Directories',
                    colors: { primary: '#059669' }
                },
                contact: { email: 'test@example.com' }
            };

            await configGenerator.saveConfig(config);

            // Verify directories were created
            const siteDir = path.join(testConfigsDir, 'test-dirs');
            const assetsDir = path.join(siteDir, 'assets');

            expect(await fs.pathExists(siteDir)).toBe(true);
            expect(await fs.pathExists(assetsDir)).toBe(true);
        });

        test('Should reject invalid configuration', async () => {
            const invalidConfig = {
                meta: {},
                brand: {},
                contact: {}
            };

            await expect(configGenerator.saveConfig(invalidConfig))
                .rejects.toThrow('Configuration validation failed');
        });
    });

    describe('✅ Template Management', () => {
        test('Should save configuration as template', async () => {
            const config = {
                meta: { 
                    siteId: 'test-template',
                    domain: 'testtemplate.com'
                },
                brand: { 
                    name: 'Test Template Site',
                    colors: { primary: '#059669' }
                },
                contact: { 
                    email: 'test@testtemplate.com',
                    phone: '+1234567890'
                }
            };

            const templatePath = await configGenerator.saveAsTemplate(config, 'test-template');

            expect(await fs.pathExists(templatePath)).toBe(true);

            // Verify template content
            const template = await fs.readJson(templatePath);
            expect(template._template.name).toBe('test-template');
            expect(template.meta.siteId).toBeUndefined(); // Should be removed
            expect(template.meta.domain).toBeUndefined(); // Should be removed
            expect(template.contact.email).toBeUndefined(); // Should be removed
            expect(template.contact.phone).toBeUndefined(); // Should be removed
            expect(template.brand.name).toBe('Test Template Site'); // Should be kept
        });

        test('Should load template', async () => {
            // First save a template
            const config = {
                meta: { siteId: 'load-test' },
                brand: { 
                    name: 'Load Test Template',
                    colors: { primary: '#FF5733' }
                },
                contact: { email: 'test@example.com' }
            };

            await configGenerator.saveAsTemplate(config, 'load-test-template');

            // Then load it
            const loadedTemplate = await configGenerator.loadTemplate('load-test-template');

            expect(loadedTemplate.brand.name).toBe('Load Test Template');
            expect(loadedTemplate.brand.colors.primary).toBe('#FF5733');
            expect(loadedTemplate._template).toBeUndefined(); // Should be removed when loading
        });

        test('Should list available templates', async () => {
            // Save multiple templates
            const template1 = {
                meta: { siteId: 'list-test-1' },
                brand: { name: 'Template 1', colors: { primary: '#111111' } },
                contact: { email: 'test@example.com' }
            };

            const template2 = {
                meta: { siteId: 'list-test-2' },
                brand: { name: 'Template 2', colors: { primary: '#222222' } },
                contact: { email: 'test@example.com' }
            };

            await configGenerator.saveAsTemplate(template1, 'list-template-1');
            await configGenerator.saveAsTemplate(template2, 'list-template-2');

            const templates = await configGenerator.listTemplates();

            expect(templates.length).toBeGreaterThanOrEqual(2);
            
            const template1Info = templates.find(t => t.name === 'list-template-1');
            const template2Info = templates.find(t => t.name === 'list-template-2');

            expect(template1Info).toBeDefined();
            expect(template2Info).toBeDefined();
            expect(template1Info.description).toContain('Template 1');
            expect(template2Info.description).toContain('Template 2');
        });

        test('Should throw error for non-existent template', async () => {
            await expect(configGenerator.loadTemplate('non-existent-template'))
                .rejects.toThrow("Template 'non-existent-template' not found");
        });
    });

    describe('✅ Utility Functions', () => {
        test('Should validate email addresses', () => {
            expect(configGenerator.isValidEmail('test@example.com')).toBe(true);
            expect(configGenerator.isValidEmail('user.name@domain.co.uk')).toBe(true);
            expect(configGenerator.isValidEmail('invalid-email')).toBe(false);
            expect(configGenerator.isValidEmail('test@')).toBe(false);
            expect(configGenerator.isValidEmail('@example.com')).toBe(false);
        });

        test('Should validate color formats', () => {
            expect(configGenerator.isValidColor('#FF0000')).toBe(true);
            expect(configGenerator.isValidColor('#fff')).toBe(true);
            expect(configGenerator.isValidColor('#123ABC')).toBe(true);
            expect(configGenerator.isValidColor('red')).toBe(false);
            expect(configGenerator.isValidColor('#GG0000')).toBe(false);
            expect(configGenerator.isValidColor('#FF')).toBe(false);
        });

        test('Should darken colors', () => {
            const darkened = configGenerator.darkenColor('#FFFFFF', 0.1);
            expect(darkened).toMatch(/^#[0-9A-Fa-f]{6}$/);
            expect(darkened).not.toBe('#FFFFFF');
        });

        test('Should lighten colors', () => {
            const lightened = configGenerator.lightenColor('#000000', 0.1);
            expect(lightened).toMatch(/^#[0-9A-Fa-f]{6}$/);
            expect(lightened).not.toBe('#000000');
        });
    });

    describe('✅ Integration with Portal API', () => {
        test('Should save config with template option', async () => {
            const config = {
                meta: { siteId: 'integration-test' },
                brand: { 
                    name: 'Integration Test',
                    colors: { primary: '#059669' }
                },
                contact: { email: 'test@example.com' }
            };

            const options = {
                saveAsTemplate: true,
                templateName: 'integration-template'
            };

            const result = await configGenerator.saveConfig(config, options);

            expect(result.success).toBe(true);
            expect(result.template).toBe('integration-template');

            // Verify both config and template were saved
            const configPath = path.join(testConfigsDir, 'integration-test', 'site-config.json');
            const templatePath = path.join(testTemplatesDir, 'integration-template.json');

            expect(await fs.pathExists(configPath)).toBe(true);
            expect(await fs.pathExists(templatePath)).toBe(true);
        });
    });
});

describe('🚀 End-to-End Configuration Workflow', () => {
    let configGenerator;
    const e2eTemplatesDir = path.join(__dirname, 'e2e-templates');
    const e2eConfigsDir = path.join(__dirname, 'e2e-configs');

    beforeAll(async () => {
        configGenerator = new ConfigGenerator();
        configGenerator.templatesDir = e2eTemplatesDir;
        configGenerator.configsDir = e2eConfigsDir;
        
        await fs.remove(e2eTemplatesDir);
        await fs.remove(e2eConfigsDir);
    });

    afterAll(async () => {
        await fs.remove(e2eTemplatesDir);
        await fs.remove(e2eConfigsDir);
    });

    test('Complete wizard to config to template workflow', async () => {
        // 1. Simulate wizard data
        const wizardData = {
            siteName: 'E2E Translation Agency',
            businessType: 'translation',
            domain: 'e2e-translation.com',
            slogan: 'Your Global Communication Partner',
            colors: {
                primary: '#059669',
                secondary: '#10B981',
                accent: '#34D399'
            },
            services: [
                { title: 'Document Translation', description: 'Professional document translation' },
                { title: 'Website Localization', description: 'Complete website localization' }
            ],
            contact: {
                email: 'contact@e2e-translation.com',
                phone: '+33123456789'
            },
            n8nEnabled: true,
            features: {
                newsletter: true
            }
        };

        // 2. Generate configuration
        const config = configGenerator.generateConfig(wizardData);
        expect(config.meta.siteId).toBe('e2e-translation-agency');
        expect(config.brand.name).toBe('E2E Translation Agency');

        // 3. Validate configuration
        const validation = configGenerator.validateConfig(config);
        expect(validation.valid).toBe(true);

        // 4. Save configuration and template
        const result = await configGenerator.saveConfig(config, {
            saveAsTemplate: true,
            templateName: 'e2e-translation-template'
        });

        expect(result.success).toBe(true);
        expect(result.siteId).toBe('e2e-translation-agency');
        expect(result.template).toBe('e2e-translation-template');

        // 5. Verify files exist
        const configPath = path.join(e2eConfigsDir, 'e2e-translation-agency', 'site-config.json');
        const templatePath = path.join(e2eTemplatesDir, 'e2e-translation-template.json');

        expect(await fs.pathExists(configPath)).toBe(true);
        expect(await fs.pathExists(templatePath)).toBe(true);

        // 6. Load and verify saved config
        const savedConfig = await fs.readJson(configPath);
        expect(savedConfig.brand.name).toBe('E2E Translation Agency');
        expect(savedConfig.contact.email).toBe('contact@e2e-translation.com');

        // 7. Load and verify template
        const loadedTemplate = await configGenerator.loadTemplate('e2e-translation-template');
        expect(loadedTemplate.brand.name).toBe('E2E Translation Agency');
        expect(loadedTemplate.contact.email).toBeUndefined(); // Should be removed in template

        // 8. List templates and verify our template is there
        const templates = await configGenerator.listTemplates();
        const ourTemplate = templates.find(t => t.name === 'e2e-translation-template');
        expect(ourTemplate).toBeDefined();
        expect(ourTemplate.businessType).toBe('translation');

        console.log('✅ Complete configuration workflow test passed');
    });
});