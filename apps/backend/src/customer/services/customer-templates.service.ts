import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import {
  CustomerTemplate,
  TemplateCategory,
  TemplateStatus,
} from '../entities/customer-template.entity';
import {
  CustomerSubscription,
  SubscriptionPlan,
} from '../entities/customer-subscription.entity';

@Injectable()
export class CustomerTemplatesService {
  constructor(
    @InjectRepository(CustomerTemplate)
    private readonly templateRepository: Repository<CustomerTemplate>,
    @InjectRepository(CustomerSubscription)
    private readonly subscriptionRepository: Repository<CustomerSubscription>,
  ) {}

  async listTemplates(
    customerId: string,
    options: {
      category?: TemplateCategory;
      search?: string;
      page: number;
      limit: number;
    },
  ): Promise<{
    templates: CustomerTemplate[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { category, search, page, limit } = options;
    const offset = (page - 1) * limit;

    // Get customer subscription to filter templates
    const subscription = await this.subscriptionRepository.findOne({
      where: { customerId },
    });

    let whereConditions: any = {
      status: TemplateStatus.ACTIVE,
    };

    if (category) {
      whereConditions.category = category;
    }

    if (search) {
      whereConditions = [
        { ...whereConditions, name: Like(`%${search}%`) },
        { ...whereConditions, title: Like(`%${search}%`) },
        { ...whereConditions, description: Like(`%${search}%`) },
      ];
    }

    // Filter premium templates based on subscription
    if (!this.canAccessPremiumTemplates(subscription?.plan)) {
      whereConditions.isPremium = false;
    }

    const [templates, total] = await this.templateRepository.findAndCount({
      where: whereConditions,
      order: { usageCount: 'DESC', rating: 'DESC' },
      skip: offset,
      take: limit,
    });

    return {
      templates,
      total,
      page,
      limit,
    };
  }

  async getCategories(): Promise<
    { category: TemplateCategory; name: string; count: number }[]
  > {
    const categories = Object.values(TemplateCategory);
    const categoryData: {
      category: TemplateCategory;
      name: string;
      count: number;
    }[] = [];

    for (const category of categories) {
      const count = await this.templateRepository.count({
        where: { category, status: TemplateStatus.ACTIVE },
      });

      categoryData.push({
        category,
        name: this.getCategoryDisplayName(category),
        count,
      });
    }

    return categoryData.filter((cat) => cat.count > 0);
  }

  async getFeaturedTemplates(customerId: string): Promise<CustomerTemplate[]> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { customerId },
    });

    const whereConditions: any = {
      status: TemplateStatus.ACTIVE,
    };

    // Filter premium templates based on subscription
    if (!this.canAccessPremiumTemplates(subscription?.plan)) {
      whereConditions.isPremium = false;
    }

    // Get top-rated templates as featured
    return this.templateRepository.find({
      where: whereConditions,
      order: { rating: 'DESC', usageCount: 'DESC' },
      take: 8,
    });
  }

  async getPopularTemplates(
    customerId: string,
    limit: number,
  ): Promise<CustomerTemplate[]> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { customerId },
    });

    const whereConditions: any = {
      status: TemplateStatus.ACTIVE,
    };

    // Filter premium templates based on subscription
    if (!this.canAccessPremiumTemplates(subscription?.plan)) {
      whereConditions.isPremium = false;
    }

    return this.templateRepository.find({
      where: whereConditions,
      order: { usageCount: 'DESC' },
      take: limit,
    });
  }

  async getTemplate(
    customerId: string,
    templateId: string,
  ): Promise<CustomerTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id: templateId, status: TemplateStatus.ACTIVE },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Check if customer can access this template
    const subscription = await this.subscriptionRepository.findOne({
      where: { customerId },
    });

    if (
      template.isPremium &&
      !this.canAccessPremiumTemplates(subscription?.plan)
    ) {
      throw new ForbiddenException(
        'Premium template requires higher subscription plan',
      );
    }

    if (
      template.requiredPlan &&
      !this.hasRequiredPlan(subscription?.plan, template.requiredPlan)
    ) {
      throw new ForbiddenException(
        `Template requires ${template.requiredPlan} plan or higher`,
      );
    }

    return template;
  }

  async getTemplatePreview(
    customerId: string,
    templateId: string,
  ): Promise<{
    template: CustomerTemplate;
    previewUrl: string;
    configuration: any;
    demoContent: any;
  }> {
    const template = await this.getTemplate(customerId, templateId);

    const previewUrl =
      template.demoUrl || `https://preview.logen.com/template/${template.name}`;

    // Generate demo content based on template
    const demoContent = this.generateDemoContent(template);

    return {
      template,
      previewUrl,
      configuration: template.configuration,
      demoContent,
    };
  }

  async getTemplatesByIndustry(
    customerId: string,
    industry: string,
    limit: number,
  ): Promise<CustomerTemplate[]> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { customerId },
    });

    const whereConditions: any = {
      status: TemplateStatus.ACTIVE,
    };

    // Filter premium templates based on subscription
    if (!this.canAccessPremiumTemplates(subscription?.plan)) {
      whereConditions.isPremium = false;
    }

    // Map industry to template categories
    const industryCategories = this.mapIndustryToCategories(industry);

    return this.templateRepository.find({
      where: {
        ...whereConditions,
        category:
          industryCategories.length > 0
            ? industryCategories[0]
            : TemplateCategory.BUSINESS,
      },
      order: { rating: 'DESC', usageCount: 'DESC' },
      take: limit,
    });
  }

  private canAccessPremiumTemplates(plan?: SubscriptionPlan): boolean {
    if (!plan) return false;
    return [
      SubscriptionPlan.PROFESSIONAL,
      SubscriptionPlan.ENTERPRISE,
    ].includes(plan);
  }

  private hasRequiredPlan(
    currentPlan?: SubscriptionPlan,
    requiredPlan?: string,
  ): boolean {
    if (!requiredPlan) return true;
    if (!currentPlan) return false;

    const planHierarchy = [
      SubscriptionPlan.FREE,
      SubscriptionPlan.STARTER,
      SubscriptionPlan.PROFESSIONAL,
      SubscriptionPlan.ENTERPRISE,
    ];

    const currentPlanIndex = planHierarchy.indexOf(currentPlan);
    const requiredPlanIndex = planHierarchy.indexOf(
      requiredPlan as SubscriptionPlan,
    );

    return currentPlanIndex >= requiredPlanIndex;
  }

  private getCategoryDisplayName(category: TemplateCategory): string {
    const displayNames = {
      [TemplateCategory.BUSINESS]: 'Business',
      [TemplateCategory.PORTFOLIO]: 'Portfolio',
      [TemplateCategory.BLOG]: 'Blog',
      [TemplateCategory.ECOMMERCE]: 'E-commerce',
      [TemplateCategory.LANDING]: 'Landing Page',
      [TemplateCategory.NONPROFIT]: 'Non-profit',
      [TemplateCategory.EDUCATION]: 'Education',
      [TemplateCategory.HEALTHCARE]: 'Healthcare',
      [TemplateCategory.RESTAURANT]: 'Restaurant',
      [TemplateCategory.CREATIVE]: 'Creative',
    };

    return displayNames[category] || category;
  }

  private mapIndustryToCategories(industry: string): TemplateCategory[] {
    const industryMapping = {
      technology: [TemplateCategory.BUSINESS, TemplateCategory.PORTFOLIO],
      healthcare: [TemplateCategory.HEALTHCARE, TemplateCategory.BUSINESS],
      education: [TemplateCategory.EDUCATION, TemplateCategory.BUSINESS],
      restaurant: [TemplateCategory.RESTAURANT, TemplateCategory.BUSINESS],
      nonprofit: [TemplateCategory.NONPROFIT, TemplateCategory.BUSINESS],
      creative: [TemplateCategory.CREATIVE, TemplateCategory.PORTFOLIO],
      retail: [TemplateCategory.ECOMMERCE, TemplateCategory.BUSINESS],
      consulting: [TemplateCategory.BUSINESS, TemplateCategory.PORTFOLIO],
    };

    return (
      industryMapping[industry.toLowerCase()] || [TemplateCategory.BUSINESS]
    );
  }

  private generateDemoContent(template: CustomerTemplate): any {
    // Generate demo content based on template category
    const baseContent = {
      hero: {
        title: 'Welcome to Your Amazing Website',
        subtitle: 'Built with our professional template',
        description:
          'This is a demo of what your website could look like using this template.',
        ctaText: 'Get Started',
      },
      about: {
        title: 'About Us',
        content:
          'We are a professional company dedicated to providing excellent services to our clients.',
      },
      services: [
        {
          id: 1,
          title: 'Service One',
          description:
            'Professional service description that highlights the benefits.',
          icon: 'service-icon-1',
        },
        {
          id: 2,
          title: 'Service Two',
          description:
            'Another professional service with detailed description.',
          icon: 'service-icon-2',
        },
      ],
      contact: {
        title: 'Contact Us',
        email: 'info@yourcompany.com',
        phone: '+1 (555) 123-4567',
        address: '123 Business Street, City, State 12345',
      },
    };

    // Customize content based on template category
    switch (template.category) {
      case TemplateCategory.RESTAURANT:
        return {
          ...baseContent,
          hero: {
            ...baseContent.hero,
            title: 'Welcome to Our Restaurant',
            subtitle: 'Authentic cuisine, exceptional experience',
          },
          services: [
            {
              id: 1,
              title: 'Fine Dining',
              description: 'Exquisite cuisine prepared by our expert chefs.',
              icon: 'dining-icon',
            },
            {
              id: 2,
              title: 'Catering',
              description:
                'Professional catering services for your special events.',
              icon: 'catering-icon',
            },
          ],
        };

      case TemplateCategory.HEALTHCARE:
        return {
          ...baseContent,
          hero: {
            ...baseContent.hero,
            title: 'Your Health, Our Priority',
            subtitle: 'Professional healthcare services you can trust',
          },
          services: [
            {
              id: 1,
              title: 'General Practice',
              description: 'Comprehensive primary care services.',
              icon: 'medical-icon',
            },
            {
              id: 2,
              title: 'Specialized Care',
              description: 'Expert specialists for your specific needs.',
              icon: 'specialist-icon',
            },
          ],
        };

      case TemplateCategory.PORTFOLIO:
        return {
          ...baseContent,
          hero: {
            ...baseContent.hero,
            title: 'Creative Portfolio',
            subtitle: 'Showcasing exceptional work and creativity',
          },
          portfolio: [
            {
              id: 1,
              title: 'Project One',
              description: 'Creative project showcase.',
              image: 'project1.jpg',
            },
            {
              id: 2,
              title: 'Project Two',
              description: 'Another amazing project.',
              image: 'project2.jpg',
            },
          ],
        };

      default:
        return baseContent;
    }
  }
}
