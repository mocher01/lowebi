import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { WizardSession } from './wizard-session.entity';

export enum BlogPostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

@Entity('blog_posts')
@Index(['wizardSessionId'])
@Index(['status'])
@Index(['wizardSessionId', 'slug'], { unique: true })
export class BlogPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'wizard_session_id', type: 'uuid' })
  wizardSessionId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  excerpt: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string;

  @Column({
    type: 'enum',
    enum: BlogPostStatus,
    default: BlogPostStatus.DRAFT,
  })
  status: BlogPostStatus;

  @Column({
    name: 'published_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  publishedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => WizardSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wizard_session_id' })
  wizardSession: WizardSession;

  // Auto-generate slug from title if not provided
  @BeforeInsert()
  @BeforeUpdate()
  generateSlug() {
    if (!this.slug && this.title) {
      this.slug = this.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens
        .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
        .slice(0, 100); // Limit length
    }
  }

  // Set publishedAt when status changes to published
  @BeforeInsert()
  @BeforeUpdate()
  setPublishedAt() {
    if (this.status === BlogPostStatus.PUBLISHED && !this.publishedAt) {
      this.publishedAt = new Date();
    }
  }

  // Helper methods
  isPublished(): boolean {
    return this.status === BlogPostStatus.PUBLISHED;
  }

  isDraft(): boolean {
    return this.status === BlogPostStatus.DRAFT;
  }

  // Convert to DTO
  toDto() {
    return {
      id: this.id,
      title: this.title,
      slug: this.slug,
      excerpt: this.excerpt,
      content: this.content,
      image: this.image,
      status: this.status,
      publishedAt: this.publishedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isPublished: this.isPublished(),
      isDraft: this.isDraft(),
    };
  }
}
