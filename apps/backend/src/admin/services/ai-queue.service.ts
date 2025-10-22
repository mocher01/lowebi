import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AiRequest,
  RequestStatus,
  RequestType,
  RequestPriority,
} from '../entities/ai-request.entity';
import { WizardSessionService } from '../../customer/services/wizard-session.service';
import { FileStorageUtil } from '../../common/utils/file-storage.util';

export interface CreateAiRequestDto {
  customerId: string;
  siteId?: string;
  requestType: RequestType;
  businessType: string;
  terminology?: string;
  priority?: RequestPriority;
  requestData: any;
  wizardSessionId?: string;
  estimatedCost?: number;
}

export interface UpdateAiRequestDto {
  status?: RequestStatus;
  adminId?: string;
  generatedContent?: any;
  processingNotes?: string;
  adminComments?: string;
  actualCost?: number;
  errorMessage?: string;
}

export interface QueueFilters {
  status?: RequestStatus;
  requestType?: RequestType;
  adminId?: string;
  businessType?: string;
  priority?: RequestPriority;
  fromDate?: Date;
  toDate?: Date;
}

export interface SaveImageDraftDto {
  role: string;
  filename: string;
  dataUrl: string;
}

@Injectable()
export class AiQueueService {
  constructor(
    @InjectRepository(AiRequest)
    private aiRequestRepository: Repository<AiRequest>,
    @Inject(forwardRef(() => WizardSessionService))
    private wizardSessionService: WizardSessionService,
  ) {}

  /**
   * Create a new AI request
   */
  async createRequest(createDto: CreateAiRequestDto): Promise<AiRequest> {
    const request = this.aiRequestRepository.create({
      ...createDto,
      status: RequestStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.aiRequestRepository.save(request);
  }

  /**
   * Get all AI requests with filtering and pagination
   */
  async getQueue(
    filters: QueueFilters = {},
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    requests: AiRequest[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.aiRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.customer', 'customer')
      .leftJoinAndSelect('request.site', 'site')
      .leftJoinAndSelect('request.wizardSession', 'wizardSession');

    // Apply filters
    if (filters.status) {
      queryBuilder.andWhere('request.status = :status', {
        status: filters.status,
      });
    }
    if (filters.requestType) {
      queryBuilder.andWhere('request.requestType = :requestType', {
        requestType: filters.requestType,
      });
    }
    if (filters.adminId) {
      queryBuilder.andWhere('request.adminId = :adminId', {
        adminId: filters.adminId,
      });
    }
    if (filters.businessType) {
      queryBuilder.andWhere('request.businessType = :businessType', {
        businessType: filters.businessType,
      });
    }
    if (filters.priority) {
      queryBuilder.andWhere('request.priority = :priority', {
        priority: filters.priority,
      });
    }
    if (filters.fromDate) {
      queryBuilder.andWhere('request.createdAt >= :fromDate', {
        fromDate: filters.fromDate,
      });
    }
    if (filters.toDate) {
      queryBuilder.andWhere('request.createdAt <= :toDate', {
        toDate: filters.toDate,
      });
    }

    // Pagination
    const offset = (page - 1) * limit;
    queryBuilder.orderBy('request.createdAt', 'DESC').skip(offset).take(limit);

    const [requests, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      requests,
      total,
      page,
      totalPages,
    };
  }

  /**
   * Get a specific AI request by ID
   */
  async getRequest(id: number): Promise<AiRequest> {
    const request = await this.aiRequestRepository.findOne({
      where: { id },
      relations: ['customer', 'site', 'wizardSession'],
    });

    if (!request) {
      throw new NotFoundException(`AI request with ID ${id} not found`);
    }

    return request;
  }

  /**
   * Assign request to admin
   */
  async assignRequest(id: number, adminId: string): Promise<AiRequest> {
    const request = await this.getRequest(id);

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException(`Request ${id} is not in pending status`);
    }

    request.adminId = adminId;
    request.status = RequestStatus.ASSIGNED;
    request.assignedAt = new Date();
    request.updatedAt = new Date();

    return this.aiRequestRepository.save(request);
  }

  /**
   * Start processing request
   */
  async startProcessing(id: number, adminId: string): Promise<AiRequest> {
    const request = await this.getRequest(id);

    if (
      request.status !== RequestStatus.ASSIGNED ||
      request.adminId !== adminId
    ) {
      throw new BadRequestException(
        `Request ${id} is not assigned to admin ${adminId}`,
      );
    }

    request.status = RequestStatus.PROCESSING;
    request.startedAt = new Date();
    request.updatedAt = new Date();

    return this.aiRequestRepository.save(request);
  }

  /**
   * Complete request with generated content
   */
  async completeRequest(
    id: number,
    adminId: string,
    generatedContent: any,
    processingNotes?: string,
    actualCost?: number,
  ): Promise<AiRequest> {
    const request = await this.getRequest(id);

    if (
      request.status !== RequestStatus.PROCESSING ||
      request.adminId !== adminId
    ) {
      throw new BadRequestException(
        `Request ${id} is not being processed by admin ${adminId}`,
      );
    }

    const completedAt = new Date();
    const processingDuration = request.startedAt
      ? Math.floor((completedAt.getTime() - request.startedAt.getTime()) / 1000)
      : null;

    request.status = RequestStatus.COMPLETED;
    request.generatedContent = generatedContent;
    request.processingNotes = processingNotes;
    request.actualCost = actualCost;
    request.processingDuration = processingDuration ?? undefined;
    request.completedAt = completedAt;
    request.updatedAt = new Date();

    // Save the request first
    const savedRequest = await this.aiRequestRepository.save(request);

    // Apply content to wizard session if wizardSessionId exists
    if (request.wizardSessionId && generatedContent) {
      try {
        console.log(
          `🔧 AI Queue: Applying content to wizard session ${request.wizardSessionId}`,
        );

        await this.wizardSessionService.applyAiContent(
          request.wizardSessionId,
          request.requestType,
          generatedContent,
        );

        console.log(
          `✅ Successfully applied AI content from request ${id} to wizard session ${request.wizardSessionId}`,
        );
      } catch (error) {
        // Log error but don't fail the completion - content can be applied later
        console.error(
          `❌ Failed to apply AI content to wizard session ${request.wizardSessionId}:`,
          error.message,
        );
        console.log(
          'Note: Content application failed but request is marked as completed',
        );
      }
    }

    return savedRequest;
  }

  /**
   * Get AI requests by wizard session ID
   */
  async getRequestsBySession(wizardSessionId: string): Promise<AiRequest[]> {
    return this.aiRequestRepository.find({
      where: { wizardSessionId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Reject request
   */
  async rejectRequest(
    id: number,
    adminId: string,
    reason: string,
  ): Promise<AiRequest> {
    const request = await this.getRequest(id);

    if (request.adminId !== adminId) {
      throw new BadRequestException(
        `Request ${id} is not assigned to admin ${adminId}`,
      );
    }

    request.status = RequestStatus.REJECTED;
    request.errorMessage = reason;
    request.completedAt = new Date();
    request.updatedAt = new Date();

    return this.aiRequestRepository.save(request);
  }

  /**
   * Update request
   */
  async updateRequest(
    id: number,
    updateDto: UpdateAiRequestDto,
  ): Promise<AiRequest> {
    const request = await this.getRequest(id);

    Object.assign(request, updateDto);
    request.updatedAt = new Date();

    return this.aiRequestRepository.save(request);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    total: number;
    pending: number;
    assigned: number;
    processing: number;
    completed: number;
    rejected: number;
    averageProcessingTime: number;
    totalRevenue: number;
  }> {
    const [total, pending, assigned, processing, completed, rejected] =
      await Promise.all([
        this.aiRequestRepository.count(),
        this.aiRequestRepository.count({
          where: { status: RequestStatus.PENDING },
        }),
        this.aiRequestRepository.count({
          where: { status: RequestStatus.ASSIGNED },
        }),
        this.aiRequestRepository.count({
          where: { status: RequestStatus.PROCESSING },
        }),
        this.aiRequestRepository.count({
          where: { status: RequestStatus.COMPLETED },
        }),
        this.aiRequestRepository.count({
          where: { status: RequestStatus.REJECTED },
        }),
      ]);

    // Calculate average processing time for completed requests
    const avgResult = await this.aiRequestRepository
      .createQueryBuilder('request')
      .select('AVG(request.processingDuration)', 'avg')
      .where('request.status = :status', { status: RequestStatus.COMPLETED })
      .andWhere('request.processingDuration IS NOT NULL')
      .getRawOne();

    // Calculate total revenue
    const revenueResult = await this.aiRequestRepository
      .createQueryBuilder('request')
      .select('SUM(request.actualCost)', 'total')
      .where('request.status = :status', { status: RequestStatus.COMPLETED })
      .andWhere('request.actualCost IS NOT NULL')
      .getRawOne();

    return {
      total,
      pending,
      assigned,
      processing,
      completed,
      rejected,
      averageProcessingTime: Math.round(avgResult?.avg || 0),
      totalRevenue: parseFloat(revenueResult?.total || '0'),
    };
  }

  /**
   * Get requests by admin
   */
  async getRequestsByAdmin(adminId: string): Promise<AiRequest[]> {
    return this.aiRequestRepository.find({
      where: { adminId: adminId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get requests by site ID
   */
  async getRequestsBySite(siteId: string): Promise<AiRequest[]> {
    return this.aiRequestRepository.find({
      where: { siteId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get overdue requests (pending > 24 hours)
   */
  async getOverdueRequests(): Promise<AiRequest[]> {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    return this.aiRequestRepository.find({
      where: {
        status: RequestStatus.PENDING,
        createdAt: twentyFourHoursAgo,
      },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Generate V1-style comprehensive AI prompt for request
   */
  async generatePrompt(id: number): Promise<{ prompt: string }> {
    const request = await this.getRequest(id);
    const data = request.requestData || {};

    const businessType = request.businessType || 'Business';
    const terminology = request.terminology || 'services';
    const siteName = data.siteName || 'votre entreprise';
    const slogan = data.slogan || '';

    // ✅ Bug #4 Fix: Extract business description from wizardData (correct location)
    const description =
      data.wizardData?.businessDescription ||
      data.businessDescription ||
      data.description ||
      '';
    const city = data.city || 'France';

    // Debug: Log the description extraction
    console.log(
      `🔍 Request ${id}: description="${description}" (${description.length} chars)`,
    );

    // Check if it's an image generation request
    // V1 FIX: Check for RequestType.IMAGES directly
    if (request.requestType === RequestType.IMAGES) {
      return { prompt: this.generateImagePrompts(request) };
    }

    // Generate V1-style comprehensive content prompt
    const prompt = `Génère TOUT le contenu textuel pour un site de ${businessType}.
Informations du site:
- Nom: ${siteName}
- Business: ${businessType}
- Slogan: ${slogan}
- Terminologie: ${terminology} (services/activités/cours/interventions/spécialités)
- Description: ${description}
- Localisation: ${city}

Instructions:
- Génère du contenu professionnel, authentique et adapté au business
- Utilise la terminologie spécifique (${terminology})
- Reste cohérent dans le ton et le style
- Format JSON strict, directement applicable

FORMAT JSON REQUIS:
{
  "hero": {
    "title": "Titre accrocheur (max 60 caractères)",
    "subtitle": "Sous-titre descriptif", 
    "description": "Description engageante (2-3 phrases)"
  },
  "services": [
    {
      "title": "Nom du service 1",
      "description": "Description détaillée du service",
      "features": ["Caractéristique 1", "Caractéristique 2", "Caractéristique 3"]
    },
    {
      "title": "Nom du service 2", 
      "description": "Description détaillée du service",
      "features": ["Caractéristique 1", "Caractéristique 2", "Caractéristique 3"]
    },
    {
      "title": "Nom du service 3",
      "description": "Description détaillée du service", 
      "features": ["Caractéristique 1", "Caractéristique 2", "Caractéristique 3"]
    },
    {
      "title": "Nom du service 4",
      "description": "Description détaillée du service",
      "features": ["Caractéristique 1", "Caractéristique 2", "Caractéristique 3"]
    },
    {
      "title": "Nom du service 5",
      "description": "Description détaillée du service",
      "features": ["Caractéristique 1", "Caractéristique 2", "Caractéristique 3"]
    }
  ],
  "about": {
    "title": "À propos de ${siteName}",
    "subtitle": "Sous-titre engageant",
    "description": "Présentation de l'entreprise (3-4 phrases)",
    "values": [
      {"title": "Valeur 1", "description": "Description de la valeur 1"},
      {"title": "Valeur 2", "description": "Description de la valeur 2"},
      {"title": "Valeur 3", "description": "Description de la valeur 3"},
      {"title": "Valeur 4", "description": "Description de la valeur 4"}
    ]
  },
  "testimonials": [
    {
      "text": "Témoignage authentique et spécifique (2-3 phrases)",
      "name": "Prénom Nom",
      "position": "Poste, Entreprise",
      "rating": 5
    },
    {
      "text": "Témoignage authentique et spécifique (2-3 phrases)",
      "name": "Prénom Nom", 
      "position": "Poste, Entreprise",
      "rating": 5
    },
    {
      "text": "Témoignage authentique et spécifique (2-3 phrases)",
      "name": "Prénom Nom",
      "position": "Poste, Entreprise", 
      "rating": 5
    }
  ],
  "faq": [
    {"question": "Question fréquente spécifique 1?", "answer": "Réponse détaillée et professionnelle"},
    {"question": "Question fréquente spécifique 2?", "answer": "Réponse détaillée et professionnelle"},
    {"question": "Question fréquente spécifique 3?", "answer": "Réponse détaillée et professionnelle"},
    {"question": "Question fréquente spécifique 4?", "answer": "Réponse détaillée et professionnelle"},
    {"question": "Question fréquente spécifique 5?", "answer": "Réponse détaillée et professionnelle"},
    {"question": "Question fréquente spécifique 6?", "answer": "Réponse détaillée et professionnelle"}
  ],
  "servicesPage": {
    "subtitle": "Sous-titre pour la page des ${terminology}",
    "ctaTitle": "Titre call-to-action engageant",
    "ctaDescription": "Description motivante pour l'action"
  },
  "seo": {
    "title": "Titre SEO optimisé (max 60 caractères)",
    "description": "Meta description optimisée (150-160 caractères)",
    "keywords": ["mot-clé 1", "mot-clé 2", "mot-clé 3", "mot-clé 4", "mot-clé 5"]
  },
  "terminology": "${terminology}",
  "blog": {
    "articles": [
      {
        "title": "Titre article 1 pertinent pour ${businessType}",
        "excerpt": "Résumé accrocheur de l'article (2-3 phrases)",
        "content": "Introduction de l'article (3-4 paragraphes)",
        "category": "Catégorie appropriée",
        "tags": ["tag1", "tag2", "tag3"]
      },
      {
        "title": "Titre article 2 pertinent pour ${businessType}",
        "excerpt": "Résumé accrocheur de l'article (2-3 phrases)",
        "content": "Introduction de l'article (3-4 paragraphes)",
        "category": "Catégorie appropriée",
        "tags": ["tag1", "tag2", "tag3"]
      },
      {
        "title": "Titre article 3 pertinent pour ${businessType}",
        "excerpt": "Résumé accrocheur de l'article (2-3 phrases)",
        "content": "Introduction de l'article (3-4 paragraphes)",
        "category": "Catégorie appropriée",
        "tags": ["tag1", "tag2", "tag3"]
      }
    ]
  }
}

IMPORTANT: Génère uniquement le JSON, sans texte avant ni après.`;

    return { prompt };
  }

  /**
   * Generate V1-style image-specific prompts with dynamic content
   */
  private generateImagePrompts(request: AiRequest): string {
    const data = request.requestData || {};
    const siteName = data.siteName || data.wizardData?.siteName || 'Business';
    const businessType =
      request.businessType ||
      data.businessType ||
      data.wizardData?.businessType ||
      'Business';
    const description =
      data.wizardData?.businessDescription ||
      data.businessDescription ||
      data.description ||
      'Professional business';

    // Extract actual business details from the request
    const city = data.city || data.wizardData?.city || 'France';
    const slogan = data.slogan || data.wizardData?.slogan || '';
    const services = data.wizardData?.services || data.services || [];
    const blogArticles =
      data.wizardData?.blog?.articles || data.blog?.articles || [];

    // Use actual colors from user input or defaults
    const primaryColor =
      data.colors?.primary || data.wizardData?.colors?.primary || '#4F46E5';
    const secondaryColor =
      data.colors?.secondary || data.wizardData?.colors?.secondary || '#7C3AED';

    // V1 Image prompts with dynamic content
    let prompts = `🎨 PROMPTS DE GÉNÉRATION D'IMAGES V1\n`;
    prompts += `Site: ${siteName}\n`;
    prompts += `Type d'entreprise: ${businessType}\n`;
    prompts += `Description: ${description}\n`;
    prompts += `Couleurs: ${primaryColor}, ${secondaryColor}\n`;
    if (slogan) prompts += `Slogan: ${slogan}\n`;
    if (services.length > 0)
      prompts += `Services: ${services.map((s) => s.name || s.title || s).join(', ')}\n`;
    prompts += `\n=== IMAGES À GÉNÉRER ===\n\n`;

    // V1 Default image set (when imagesNeeded is missing) - TOUTES les images
    const imagesNeeded = data.imagesNeeded || {
      logo: true,
      logoFooter: true,
      hero: true,
      faviconLight: true,
      faviconDark: true,
      services:
        services.length > 0
          ? services.map((s) => s.name || s.title || s)
          : true,
      blogArticles: blogArticles.length > 0 ? blogArticles : true,
    };

    let imageCount = 0;

    if (imagesNeeded.logo || imagesNeeded.logo === undefined) {
      imageCount++;
      prompts += `${imageCount}. LOGO NAVIGATION (Clair)\n`;
      prompts += `Prompt DALL-E: "Créez un logo professionnel horizontal pour '${siteName}', spécialisé en ${businessType}. ${description}. Incluez une icône ET le texte '${siteName}' clairement visible. Couleurs: ${primaryColor} et ${secondaryColor}. L'icône doit représenter le concept de l'entreprise. Disposition: icône à gauche, texte '${siteName}' à droite. Format horizontal large (ratio 3:1). Design propre, moderne et professionnel adapté pour l'en-tête du site web sur fond blanc."\n`;
      prompts += `Nom du fichier: ${siteName}-logo-clair.png\n\n`;
    }

    if (imagesNeeded.logoFooter || imagesNeeded.logoFooter === undefined) {
      imageCount++;
      prompts += `${imageCount}. LOGO FOOTER (Sombre)\n`;
      prompts += `Prompt DALL-E: "Créez un logo professionnel horizontal pour '${siteName}', spécialisé en ${businessType}. Version sombre pour arrière-plans foncés. Incluez une icône ET le texte '${siteName}' en couleurs blanches/claires. L'icône doit représenter le concept de l'entreprise. Disposition: icône à gauche, texte à droite. Format horizontal large. Design professionnel adapté pour le pied de page du site web sur fond sombre."\n`;
      prompts += `Nom du fichier: ${siteName}-logo-sombre.png\n\n`;
    }

    if (imagesNeeded.hero || imagesNeeded.hero === undefined) {
      imageCount++;
      prompts += `${imageCount}. IMAGE HERO BANNIÈRE\n`;
      prompts += `Prompt DALL-E: "Créez une image bannière hero pour ${siteName}, représentant ${businessType}. Contexte métier: ${description}. Style: professionnel, haute qualité, atmosphère accueillante qui reflète la nature de l'entreprise. Palette de couleurs incluant ${primaryColor} et ${secondaryColor}. Dimensions: 1792x1024. Pas de texte superposé, illustration photoréaliste ou de haute qualité."\n`;
      prompts += `Nom du fichier: ${siteName}-hero.png\n\n`;
    }

    // Images pour les services
    if (imagesNeeded.services) {
      const servicesList = Array.isArray(imagesNeeded.services)
        ? imagesNeeded.services
        : services;
      servicesList.forEach((service, index) => {
        const serviceName =
          typeof service === 'string'
            ? service
            : service.name || service.title || `Service ${index + 1}`;
        const serviceDesc =
          typeof service === 'object' ? service.description : '';
        imageCount++;
        prompts += `${imageCount}. IMAGE SERVICE - ${serviceName.toUpperCase()}\n`;
        prompts += `Prompt DALL-E: "Créez une image professionnelle pour le service '${serviceName}' de ${siteName} (${businessType}). ${serviceDesc ? `Description: ${serviceDesc}. ` : ''}Style: moderne, professionnel, représentant clairement ce service. Couleurs: ${primaryColor} et ${secondaryColor}. Format carré 500x500. Haute qualité, pas de texte superposé."\n`;
        prompts += `Nom du fichier: ${siteName}-service-${serviceName.toLowerCase().replace(/\s+/g, '-')}.png\n\n`;
      });
    }

    // Images pour les articles de blog (une image par article)
    if (imagesNeeded.blogArticles) {
      const articlesList = Array.isArray(imagesNeeded.blogArticles)
        ? imagesNeeded.blogArticles
        : blogArticles;
      articlesList.forEach((article, index) => {
        const articleTitle =
          typeof article === 'string'
            ? article
            : article.title || `Article ${index + 1}`;
        const articleSummary =
          typeof article === 'object'
            ? article.summary || article.description || ''
            : '';
        imageCount++;
        prompts += `${imageCount}. IMAGE ARTICLE BLOG - ${articleTitle.toUpperCase()}\n`;
        prompts += `Prompt DALL-E: "Créez une image d'illustration pour l'article de blog '${articleTitle}' de ${siteName} (${businessType}). ${articleSummary ? `Sujet: ${articleSummary}. ` : ''}Style: moderne, professionnel, illustrant le sujet de l'article. Couleurs: ${primaryColor} et ${secondaryColor}. Format: 1200x600. Haute qualité, pas de texte superposé. L'image doit être pertinente au sujet de l'article."\n`;
        prompts += `Nom du fichier: ${siteName}-blog-${index + 1}-${articleTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .substring(0, 50)}.png\n\n`;
      });
    }

    if (imagesNeeded.faviconLight || imagesNeeded.faviconLight === undefined) {
      imageCount++;
      prompts += `${imageCount}. FAVICON CLAIR\n`;
      prompts += `Prompt DALL-E: "Créez une icône favicon simple pour ${siteName}, entreprise ${businessType}. 32x32 pixels, design minimaliste, icône ou lettre unique représentant l'entreprise, couleur ${primaryColor}, claire sur fond blanc."\n`;
      prompts += `Nom du fichier: ${siteName}-favicon-clair.png\n\n`;
    }

    if (imagesNeeded.faviconDark || imagesNeeded.faviconDark === undefined) {
      imageCount++;
      prompts += `${imageCount}. FAVICON SOMBRE\n`;
      prompts += `Prompt DALL-E: "Créez une icône favicon simple pour ${siteName}, entreprise ${businessType}. 32x32 pixels, design minimaliste, icône ou lettre unique représentant l'entreprise, couleur blanche/claire, claire sur fond sombre."\n`;
      prompts += `Nom du fichier: ${siteName}-favicon-sombre.png\n\n`;
    }

    prompts += `\n=== INSTRUCTIONS V1 ===\n`;
    prompts += `1. Utilisez ces prompts dans DALL-E 3 ou Midjourney\n`;
    prompts += `2. Générez chaque image séparément\n`;
    prompts += `3. Respectez les dimensions et formats indiqués\n`;
    prompts += `4. Uploadez les images avec les noms de fichier corrects\n`;
    prompts += `5. Vérifiez la cohérence visuelle entre toutes les images\n`;

    return prompts;
  }

  /**
   * Save a single image draft for a request
   * V2.3: Uses session storage when wizardSessionId is present
   */
  async saveImageDraft(
    requestId: number,
    saveDto: SaveImageDraftDto,
  ): Promise<{ ok: boolean; image: any; imagesDraft: any }> {
    const request = await this.getRequest(requestId);

    let savedImage;

    // V2.3: Use session storage if wizardSessionId is present
    if (request.wizardSessionId) {
      console.log(
        `💾 [V2.3] Using session storage for wizardSessionId: ${request.wizardSessionId}`,
      );

      savedImage = await FileStorageUtil.saveSessionDataUrl(
        saveDto.dataUrl,
        request.wizardSessionId,
        saveDto.filename,
      );

      // Also update wizard session images directly
      try {
        await this.wizardSessionService.saveSessionImage(
          request.wizardSessionId,
          request.customerId,
          saveDto.role,
          saveDto.filename,
          saveDto.dataUrl,
        );
        console.log(
          `✅ [V2.3] Updated wizard session images for ${saveDto.role}`,
        );
      } catch (error) {
        console.warn(
          `⚠️ [V2.3] Failed to update wizard session images:`,
          error.message,
        );
        // Continue anyway - imagesDraft fallback will work
      }
    } else {
      // Legacy: Use request-specific storage
      console.log(
        `💾 [LEGACY] Using request storage for requestId: ${requestId}`,
      );
      savedImage = await FileStorageUtil.saveDataUrl(
        saveDto.dataUrl,
        requestId,
        saveDto.filename,
      );
    }

    // Update imagesDraft JSON field (still keep for backwards compatibility)
    const currentDraft = (request.imagesDraft as any) || {};
    currentDraft[saveDto.role] = {
      url: savedImage.publicUrl,
      filename: savedImage.filename,
      updatedAt: new Date().toISOString(),
    };

    // Increment images version for cache invalidation
    const updatedRequest = await this.aiRequestRepository.update(
      { id: requestId },
      {
        imagesDraft: currentDraft,
        imagesVersion: () => 'images_version + 1',
        updatedAt: new Date(),
      },
    );

    // Fetch updated request to get new version number
    const refreshedRequest = await this.getRequest(requestId);

    return {
      ok: true,
      image: currentDraft[saveDto.role],
      imagesDraft: refreshedRequest.imagesDraft,
    };
  }

  /**
   * Get all image drafts for a request
   */
  async getImageDrafts(
    requestId: number,
  ): Promise<{ ok: boolean; imagesDraft: any }> {
    const request = await this.getRequest(requestId);

    return {
      ok: true,
      imagesDraft: request.imagesDraft || {},
    };
  }

  /**
   * Delete a specific image draft by role
   */
  async deleteImageDraft(
    requestId: number,
    role: string,
  ): Promise<{ ok: boolean }> {
    const request = await this.getRequest(requestId);
    const currentDraft = (request.imagesDraft as any) || {};

    // Delete the image entry
    if (currentDraft[role]) {
      delete currentDraft[role];

      // Update database
      await this.aiRequestRepository.update(
        { id: requestId },
        {
          imagesDraft: currentDraft,
          imagesVersion: () => 'images_version + 1',
          updatedAt: new Date(),
        },
      );
    }

    return { ok: true };
  }

  /**
   * Copy draft images to final on completion (optional)
   */
  async finalizeDraftImages(requestId: number): Promise<void> {
    const request = await this.getRequest(requestId);

    if (request.imagesDraft && Object.keys(request.imagesDraft).length > 0) {
      // Add imagesFinal field to store finalized images (if needed later)
      // For now, we keep drafts even after completion for persistence
      console.log(
        `✅ Request ${requestId} completed with ${Object.keys(request.imagesDraft).length} draft images preserved`,
      );
    }
  }

  /**
   * Clean up draft images when request is deleted
   */
  async cleanupRequestDrafts(requestId: number): Promise<void> {
    try {
      await FileStorageUtil.cleanupRequestImages(requestId);
      console.log(
        `✅ Cleaned up draft images for deleted request ${requestId}`,
      );
    } catch (error) {
      console.error(
        `❌ Failed to cleanup images for request ${requestId}:`,
        error,
      );
    }
  }
}
