/**
 * Hook pour injecter dynamiquement les styles des sections
 * Convertit la configuration sections.* en variables CSS
 */

import { useEffect } from 'react';
import { loadSiteConfig } from '@/config/config-loader';

const useSectionStyles = () => {
  useEffect(() => {
    const config = loadSiteConfig();
    
    // 🎯 CORRECTION CRITIQUE: Injecter les variables CSS pour chaque section
    if (config.sections) {
      const root = document.documentElement;
      
      // Injecter les styles pour chaque section configurée
      Object.entries(config.sections).forEach(([sectionName, sectionConfig]) => {
        if (sectionConfig.background) {
          root.style.setProperty(`--section-${sectionName}-bg`, sectionConfig.background);
        }
        if (sectionConfig.textColor) {
          root.style.setProperty(`--section-${sectionName}-text`, sectionConfig.textColor);
        }
      });
      
      console.log('🎨 Section styles injected:', Object.keys(config.sections));
    }
  }, []);
};

export default useSectionStyles;
