/**
 * 🎨 Utilitaires pour calculer des couleurs adaptatives
 * 
 * Fournit des fonctions pour générer automatiquement des couleurs 
 * de fond et de texte appropriées basées sur les couleurs de la marque
 */

/**
 * Convertit une couleur hex en HSL
 * @param {string} hex - Couleur au format #RRGGBB ou #RGB
 * @returns {object} Objet {h, s, l} avec les valeurs HSL
 */
function hexToHsl(hex) {
  // Nettoyer et normaliser le hex
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }

  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Convertit HSL en hex
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} Couleur au format #RRGGBB
 */
function hslToHex(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r, g, b;
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (c) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calcule automatiquement une couleur de navbar appropriée
 * @param {string} primaryColor - Couleur primaire de la marque (#RRGGBB)
 * @param {object} options - Options de personnalisation
 * @returns {object} Couleurs calculées pour la navbar
 */
export function calculateNavbarColors(primaryColor, options = {}) {
  const {
    contrast = 'medium', // 'low', 'medium', 'high'
    tone = 'warm'        // 'warm', 'cool', 'neutral'
  } = options;

  if (!primaryColor || !primaryColor.startsWith('#')) {
    primaryColor = '#3B82F6'; // Fallback blue
  }

  const primary = hexToHsl(primaryColor);
  
  // Ajustements selon le ton demandé
  let hueShift = 0;
  switch (tone) {
    case 'warm': hueShift = -10; break;
    case 'cool': hueShift = 15; break;
    case 'neutral': hueShift = 0; break;
    case 'professional': hueShift = 5; break; // Légèrement plus froid, professionnel
    default: hueShift = 0; break;
  }

  // Calcul de la couleur de fond navbar
  const backgroundHue = (primary.h + hueShift + 360) % 360;
  const backgroundSaturation = Math.max(3, primary.s * 0.08); // Très désaturé
  
  // Calcul de la luminosité selon le contraste
  let backgroundLightness;
  switch (contrast) {
    case 'low': backgroundLightness = 97; break;
    case 'medium': backgroundLightness = 95; break;
    case 'high': backgroundLightness = 93; break;
    default: backgroundLightness = 95;
  }

  const backgroundColor = hslToHex(backgroundHue, backgroundSaturation, backgroundLightness);

  // Couleur de texte - sombre pour contraster avec fond clair
  const textLightness = 15; // Très sombre
  const textSaturation = Math.min(15, primary.s * 0.3); // Légèrement saturé
  const textColor = hslToHex(backgroundHue, textSaturation, textLightness);

  // Couleur d'accent - version plus visible de la couleur primaire
  const accentColor = primaryColor;

  return {
    background: backgroundColor,
    textColor: textColor,
    accentColor: accentColor,
    // Informations de debug
    _debug: {
      originalPrimary: primaryColor,
      primaryHsl: primary,
      backgroundHsl: { h: backgroundHue, s: backgroundSaturation, l: backgroundLightness },
      textHsl: { h: backgroundHue, s: textSaturation, l: textLightness }
    }
  };
}

/**
 * Applique les couleurs calculées à la configuration
 * @param {object} config - Configuration du site
 * @returns {object} Configuration mise à jour avec couleurs navbar
 */
export function applyAutoNavbarColors(config) {
  if (!config.brand?.colors?.primary) {
    return config;
  }

  // 🔧 FIX: Respecter les couleurs hardcodées existantes
  const existingNavbar = config.navbar || {};
  
  // Si toutes les couleurs sont déjà définies, ne pas les remplacer
  if (existingNavbar.background && existingNavbar.textColor && existingNavbar.accentColor) {
    return config;
  }

  const navbarColors = calculateNavbarColors(
    config.brand.colors.primary,
    {
      contrast: existingNavbar.contrast || 'medium',
      tone: existingNavbar.tone || 'warm'
    }
  );

  return {
    ...config,
    navbar: {
      ...existingNavbar,
      // Utiliser les valeurs existantes ou les calculer si manquantes
      background: existingNavbar.background || navbarColors.background,
      textColor: existingNavbar.textColor || navbarColors.textColor,
      accentColor: existingNavbar.accentColor || navbarColors.accentColor,
      _autoGenerated: !existingNavbar.background && !existingNavbar.textColor && !existingNavbar.accentColor
    }
  };
}