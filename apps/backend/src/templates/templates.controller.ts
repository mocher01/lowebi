import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/templates')
export class TemplatesController {
  @Get()
  @Public()
  async getTemplates() {
    // Return template data compatible with V1 format
    const templates = [
      {
        name: 'template-base',
        displayName: 'Modèle de Base',
        description:
          "Template polyvalent et moderne, parfait pour tous types d'activités professionnelles",
        version: '1.0.0',
        businessTypes: ['Services', 'Commerce', 'Conseil', 'Formation'],
        features: [
          'Design responsive',
          'SEO optimisé',
          'Formulaires de contact',
          'Blog intégré',
        ],
      },
    ];

    return {
      success: true,
      templates,
    };
  }
}
