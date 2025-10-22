import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TemplateCategory {
  BUSINESS = 'business',
  PORTFOLIO = 'portfolio',
  BLOG = 'blog',
  ECOMMERCE = 'ecommerce',
  LANDING = 'landing',
  NONPROFIT = 'nonprofit',
  EDUCATION = 'education',
  HEALTHCARE = 'healthcare',
  RESTAURANT = 'restaurant',
  CREATIVE = 'creative',
}

export enum TemplateStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DEPRECATED = 'deprecated',
}

@Entity('customer_templates')
export class CustomerTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'simple-enum',
    enum: TemplateCategory,
    default: TemplateCategory.BUSINESS,
  })
  category: TemplateCategory;

  @Column({
    type: 'simple-enum',
    enum: TemplateStatus,
    default: TemplateStatus.ACTIVE,
  })
  status: TemplateStatus;

  @Column({ name: 'preview_image_url', nullable: true })
  previewImageUrl?: string;

  @Column({ name: 'demo_url', nullable: true })
  demoUrl?: string;

  @Column({ type: 'json' })
  configuration: any; // Template configuration schema

  @Column({ type: 'json', nullable: true })
  defaultContent?: any; // Default content for the template

  @Column({ type: 'simple-array', nullable: true })
  features?: string[]; // Array of template features

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[]; // Array of searchable tags

  @Column({ name: 'is_premium', default: false })
  isPremium: boolean;

  @Column({ name: 'required_plan', nullable: true })
  requiredPlan?: string; // Plan required to use this template

  @Column({ name: 'usage_count', default: 0 })
  usageCount: number;

  @Column({
    name: 'rating',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0,
  })
  rating: number;

  @Column({ name: 'review_count', default: 0 })
  reviewCount: number;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string; // User ID who created the template

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper methods
  get isAvailable(): boolean {
    return this.status === TemplateStatus.ACTIVE;
  }

  get averageRating(): number {
    return this.reviewCount > 0 ? this.rating : 0;
  }

  constructor(partial: Partial<CustomerTemplate>) {
    Object.assign(this, partial);
  }
}
