const fs = require('fs');
const path = require('path');

const configFile = process.argv[2];
const outputDir = process.argv[3];

try {
    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    const htmlPath = path.join(outputDir, 'index.html');
    
    if (fs.existsSync(htmlPath)) {
        let html = fs.readFileSync(htmlPath, 'utf8');
        
        // 🔧 ROOT CAUSE FIX: Injection JSON sécurisée pour <script>
        // Utiliser JSON.stringify avec les bonnes options pour l'injection HTML
        const configJson = JSON.stringify(config, null, 0);
        
        // Log pour diagnostic
        console.log(`Config JSON length: ${configJson.length}`);
        console.log(`Character at position 202: "${configJson[202] || 'N/A'}"`);
        console.log(`Context around 202: "${configJson.substring(195, 210)}"`);
        
        // Vérifier que le JSON de base est valide
        try {
            JSON.parse(configJson);
            console.log('✓ Original JSON is valid');
        } catch (origError) {
            console.error('❌ Original JSON is invalid:', origError.message);
            throw origError;
        }
        
        // Remplacer directement - pas d'échappement manuel qui casse tout
        html = html.replace('{{SITE_CONFIG_JSON}}', configJson);
        
        // Vérifier que le placeholder a été remplacé
        if (html.includes('{{SITE_CONFIG_JSON}}')) {
            console.warn('⚠️  Warning: {{SITE_CONFIG_JSON}} placeholder not replaced');
        } else {
            console.log('✓ {{SITE_CONFIG_JSON}} placeholder successfully replaced');
        }
        
        // Remplacer les autres placeholders (escaper ceux-ci si nécessaire)
        const title = (config.seo && config.seo.title) || config.brand.name;
        const description = (config.seo && config.seo.description) || `Site web de ${config.brand.name}`;
        const canonical = `https://${config.meta.domain}`;
        const logoNavbar = config.brand?.logos?.navbar || 'logo-navbar.png';
        const faviconLight = config.brand?.favicons?.light || 'favicon-light.png';
        
        // Échapper seulement les attributs HTML, pas le JSON
        const escapeHtml = (str) => str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        
        html = html.replace(/{{SITE_TITLE}}/g, escapeHtml(title));
        html = html.replace(/{{SITE_DESCRIPTION}}/g, escapeHtml(description));
        html = html.replace(/{{SITE_CANONICAL}}/g, canonical);
        html = html.replace(/{{SITE_LOGO_NAVBAR}}/g, `/assets/${logoNavbar}`);
        html = html.replace(/{{SITE_FAVICON_LIGHT}}/g, faviconLight);
        
        // Ajouter timestamp pour vérifier le déploiement
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
        html = html.replace(/{{TIMESTAMP}}/g, timestamp);
        
        // Validation finale simple
        const scriptMatch = html.match(/window\.SITE_CONFIG\s*=\s*(\{.+?\});/s);
        if (scriptMatch) {
            console.log('✓ window.SITE_CONFIG found in HTML');
            console.log(`✓ JSON length in HTML: ${scriptMatch[1].length}`);
        } else {
            console.warn('⚠️  window.SITE_CONFIG not found in final HTML');
        }
        
        fs.writeFileSync(htmlPath, html);
        console.log('✓ HTML updated with direct JSON injection (no escaping)');
        console.log(`✓ Site: ${config.brand?.name || 'Unknown'}`);
        console.log(`✓ Navigation links: ${config.navigation?.links?.length || 0}`);
    }
} catch (error) {
    console.error('❌ Error injecting config into HTML:', error.message);
    console.error('Full error:', error);
    process.exit(1);
}
