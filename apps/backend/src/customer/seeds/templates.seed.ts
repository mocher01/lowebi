import { Repository } from 'typeorm';
import {
  CustomerTemplate,
  TemplateCategory,
  TemplateStatus,
} from '../entities/customer-template.entity';

export async function seedTemplates(
  templateRepository: Repository<CustomerTemplate>,
): Promise<void> {
  const templates = [
    // Business Templates
    {
      name: 'modern-business',
      title: 'Modern Business',
      description:
        'A clean and professional template perfect for modern businesses',
      category: TemplateCategory.BUSINESS,
      status: TemplateStatus.ACTIVE,
      previewImageUrl:
        'https://templates.logen.com/previews/modern-business.jpg',
      demoUrl: 'https://demo.logen.com/modern-business',
      isPremium: false,
      features: [
        'Responsive Design',
        'Contact Forms',
        'Service Sections',
        'About Page',
      ],
      tags: ['business', 'corporate', 'professional', 'clean'],
      rating: 4.8,
      reviewCount: 125,
      usageCount: 450,
      configuration: {
        colors: {
          primary: '#2563eb',
          secondary: '#64748b',
          accent: '#f59e0b',
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter',
        },
        sections: ['hero', 'about', 'services', 'contact'],
      },
      defaultContent: {
        hero: {
          title: 'Welcome to [Business Name]',
          subtitle: 'Your trusted partner in business success',
        },
        about: {
          title: 'About Us',
          content: 'We are a professional company dedicated to excellence.',
        },
      },
    },
    {
      name: 'corporate-suite',
      title: 'Corporate Suite',
      description: 'Elegant corporate template with advanced features',
      category: TemplateCategory.BUSINESS,
      status: TemplateStatus.ACTIVE,
      previewImageUrl:
        'https://templates.logen.com/previews/corporate-suite.jpg',
      demoUrl: 'https://demo.logen.com/corporate-suite',
      isPremium: true,
      requiredPlan: 'professional',
      features: [
        'Advanced Layout',
        'Team Showcase',
        'Portfolio Gallery',
        'Testimonials',
      ],
      tags: ['corporate', 'elegant', 'premium', 'advanced'],
      rating: 4.9,
      reviewCount: 89,
      usageCount: 220,
      configuration: {
        colors: {
          primary: '#1e40af',
          secondary: '#374151',
          accent: '#dc2626',
        },
        fonts: {
          heading: 'Playfair Display',
          body: 'Source Sans Pro',
        },
        sections: [
          'hero',
          'about',
          'services',
          'team',
          'portfolio',
          'testimonials',
          'contact',
        ],
      },
    },

    // Portfolio Templates
    {
      name: 'creative-portfolio',
      title: 'Creative Portfolio',
      description:
        'Showcase your creative work with this stunning portfolio template',
      category: TemplateCategory.PORTFOLIO,
      status: TemplateStatus.ACTIVE,
      previewImageUrl:
        'https://templates.logen.com/previews/creative-portfolio.jpg',
      demoUrl: 'https://demo.logen.com/creative-portfolio',
      isPremium: false,
      features: [
        'Image Gallery',
        'Project Showcase',
        'About Section',
        'Contact Form',
      ],
      tags: ['portfolio', 'creative', 'gallery', 'showcase'],
      rating: 4.7,
      reviewCount: 156,
      usageCount: 380,
      configuration: {
        colors: {
          primary: '#7c3aed',
          secondary: '#6b7280',
          accent: '#f59e0b',
        },
        fonts: {
          heading: 'Montserrat',
          body: 'Open Sans',
        },
        sections: ['hero', 'portfolio', 'about', 'contact'],
      },
    },

    // Restaurant Templates
    {
      name: 'restaurant-deluxe',
      title: 'Restaurant Deluxe',
      description: 'Perfect template for restaurants and food businesses',
      category: TemplateCategory.RESTAURANT,
      status: TemplateStatus.ACTIVE,
      previewImageUrl:
        'https://templates.logen.com/previews/restaurant-deluxe.jpg',
      demoUrl: 'https://demo.logen.com/restaurant-deluxe',
      isPremium: false,
      features: [
        'Menu Display',
        'Reservation System',
        'Photo Gallery',
        'Location Map',
      ],
      tags: ['restaurant', 'food', 'menu', 'dining'],
      rating: 4.6,
      reviewCount: 98,
      usageCount: 275,
      configuration: {
        colors: {
          primary: '#dc2626',
          secondary: '#374151',
          accent: '#f59e0b',
        },
        fonts: {
          heading: 'Crimson Text',
          body: 'Lato',
        },
        sections: ['hero', 'menu', 'about', 'gallery', 'contact'],
      },
    },

    // Healthcare Templates
    {
      name: 'medical-care',
      title: 'Medical Care',
      description: 'Professional template for healthcare providers',
      category: TemplateCategory.HEALTHCARE,
      status: TemplateStatus.ACTIVE,
      previewImageUrl: 'https://templates.logen.com/previews/medical-care.jpg',
      demoUrl: 'https://demo.logen.com/medical-care',
      isPremium: true,
      requiredPlan: 'starter',
      features: [
        'Appointment Booking',
        'Service List',
        'Doctor Profiles',
        'Contact Info',
      ],
      tags: ['healthcare', 'medical', 'professional', 'care'],
      rating: 4.8,
      reviewCount: 67,
      usageCount: 145,
      configuration: {
        colors: {
          primary: '#059669',
          secondary: '#6b7280',
          accent: '#3b82f6',
        },
        fonts: {
          heading: 'Source Sans Pro',
          body: 'Source Sans Pro',
        },
        sections: ['hero', 'services', 'doctors', 'about', 'contact'],
      },
    },

    // E-commerce Templates
    {
      name: 'shop-modern',
      title: 'Modern Shop',
      description: 'Contemporary e-commerce template for online stores',
      category: TemplateCategory.ECOMMERCE,
      status: TemplateStatus.ACTIVE,
      previewImageUrl: 'https://templates.logen.com/previews/shop-modern.jpg',
      demoUrl: 'https://demo.logen.com/shop-modern',
      isPremium: true,
      requiredPlan: 'professional',
      features: [
        'Product Catalog',
        'Shopping Cart',
        'Payment Integration',
        'User Accounts',
      ],
      tags: ['ecommerce', 'shop', 'retail', 'modern'],
      rating: 4.9,
      reviewCount: 134,
      usageCount: 190,
      configuration: {
        colors: {
          primary: '#1f2937',
          secondary: '#6b7280',
          accent: '#ef4444',
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter',
        },
        sections: ['hero', 'products', 'categories', 'about', 'contact'],
      },
    },

    // Landing Page Templates
    {
      name: 'startup-landing',
      title: 'Startup Landing',
      description: 'High-converting landing page for startups and new products',
      category: TemplateCategory.LANDING,
      status: TemplateStatus.ACTIVE,
      previewImageUrl:
        'https://templates.logen.com/previews/startup-landing.jpg',
      demoUrl: 'https://demo.logen.com/startup-landing',
      isPremium: false,
      features: [
        'Hero Section',
        'Feature Highlights',
        'Testimonials',
        'CTA Buttons',
      ],
      tags: ['landing', 'startup', 'conversion', 'marketing'],
      rating: 4.7,
      reviewCount: 203,
      usageCount: 520,
      configuration: {
        colors: {
          primary: '#6366f1',
          secondary: '#64748b',
          accent: '#10b981',
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter',
        },
        sections: ['hero', 'features', 'testimonials', 'cta'],
      },
    },

    // Blog Templates
    {
      name: 'blog-writer',
      title: 'Blog Writer',
      description:
        'Clean and readable template for bloggers and content creators',
      category: TemplateCategory.BLOG,
      status: TemplateStatus.ACTIVE,
      previewImageUrl: 'https://templates.logen.com/previews/blog-writer.jpg',
      demoUrl: 'https://demo.logen.com/blog-writer',
      isPremium: false,
      features: [
        'Article Layout',
        'Category Pages',
        'Author Bio',
        'Social Sharing',
      ],
      tags: ['blog', 'writing', 'content', 'articles'],
      rating: 4.5,
      reviewCount: 87,
      usageCount: 165,
      configuration: {
        colors: {
          primary: '#374151',
          secondary: '#6b7280',
          accent: '#f59e0b',
        },
        fonts: {
          heading: 'Merriweather',
          body: 'Source Sans Pro',
        },
        sections: ['header', 'articles', 'sidebar', 'footer'],
      },
    },

    // Education Templates
    {
      name: 'education-hub',
      title: 'Education Hub',
      description:
        'Perfect template for schools, courses, and educational institutions',
      category: TemplateCategory.EDUCATION,
      status: TemplateStatus.ACTIVE,
      previewImageUrl: 'https://templates.logen.com/previews/education-hub.jpg',
      demoUrl: 'https://demo.logen.com/education-hub',
      isPremium: true,
      requiredPlan: 'starter',
      features: [
        'Course Catalog',
        'Faculty Profiles',
        'Event Calendar',
        'Enrollment Forms',
      ],
      tags: ['education', 'school', 'courses', 'learning'],
      rating: 4.6,
      reviewCount: 45,
      usageCount: 78,
      configuration: {
        colors: {
          primary: '#1d4ed8',
          secondary: '#64748b',
          accent: '#f59e0b',
        },
        fonts: {
          heading: 'Source Sans Pro',
          body: 'Source Sans Pro',
        },
        sections: ['hero', 'courses', 'faculty', 'events', 'contact'],
      },
    },
  ];

  for (const templateData of templates) {
    const existingTemplate = await templateRepository.findOne({
      where: { name: templateData.name },
    });

    if (!existingTemplate) {
      const template = templateRepository.create(templateData);
      await templateRepository.save(template);
      console.log(`Seeded template: ${templateData.title}`);
    }
  }

  console.log('Template seeding completed!');
}
