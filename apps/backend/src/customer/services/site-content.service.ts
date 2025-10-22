import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WizardSession } from '../entities/wizard-session.entity';
import { BlogPost, BlogPostStatus } from '../entities/blog-post.entity';
import {
  CreateBlogPostDto,
  UpdateBlogPostDto,
  BlogPostResponseDto,
  UpdatePageContentDto,
} from '../dto/blog-post.dto';
import { SiteGenerationOrchestratorService } from './site-generation-orchestrator.service';
import { WizardDataMapperService } from './wizard-data-mapper.service';
import * as fs from 'fs/promises';

@Injectable()
export class SiteContentService {
  constructor(
    @InjectRepository(WizardSession)
    private wizardSessionRepository: Repository<WizardSession>,
    @InjectRepository(BlogPost)
    private blogPostRepository: Repository<BlogPost>,
    @Inject(forwardRef(() => SiteGenerationOrchestratorService))
    private siteGenerationOrchestrator: SiteGenerationOrchestratorService,
    private wizardDataMapper: WizardDataMapperService,
  ) {}

  /**
   * Get all editable page content from wizard session
   */
  async getPageContent(sessionId: string, userId: string): Promise<any> {
    const session = await this.wizardSessionRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Site not found');
    }

    // Extract editable sections from wizardData
    const wizardData = session.wizardData || {};

    return {
      hero: wizardData.hero || {},
      about: wizardData.about || {},
      services: wizardData.services || [],
      contact: wizardData.contact || {},
      faq: wizardData.faq || [],
      testimonials: wizardData.testimonials || [],
    };
  }

  /**
   * Update a specific page section
   */
  async updatePageSection(
    sessionId: string,
    userId: string,
    section: string,
    updateDto: UpdatePageContentDto,
  ): Promise<any> {
    const session = await this.wizardSessionRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Site not found');
    }

    // Validate section name
    const validSections = [
      'hero',
      'about',
      'services',
      'contact',
      'faq',
      'testimonials',
    ];
    if (!validSections.includes(section)) {
      throw new BadRequestException(`Invalid section: ${section}`);
    }

    // Update the wizard data with new content
    const wizardData = { ...session.wizardData };

    // Build updated section data
    const sectionData: any = { ...(wizardData[section] || {}) };

    if (updateDto.title !== undefined) sectionData.title = updateDto.title;
    if (updateDto.subtitle !== undefined)
      sectionData.subtitle = updateDto.subtitle;
    if (updateDto.description !== undefined)
      sectionData.description = updateDto.description;
    if (updateDto.data !== undefined) {
      // Merge additional data
      Object.assign(sectionData, updateDto.data);
    }

    wizardData[section] = sectionData;

    // Save using query builder to avoid JSONB issues
    await this.wizardSessionRepository
      .createQueryBuilder()
      .update()
      .set({
        wizardData: wizardData,
        updatedAt: () => 'CURRENT_TIMESTAMP',
      })
      .where('id = :id', { id: sessionId })
      .execute();

    console.log(`✅ Updated ${section} section for site ${sessionId}`);

    return sectionData;
  }

  /**
   * Import blog articles from wizard data to blog_posts table
   */
  async importBlogArticlesFromWizard(
    sessionId: string,
    userId: string,
  ): Promise<number> {
    const session = await this.wizardSessionRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Site not found');
    }

    const wizardData = session.wizardData || {};
    const articles = wizardData.blog?.articles || [];

    if (articles.length === 0) {
      return 0;
    }

    // Check if we've already imported
    const existingCount = await this.blogPostRepository.count({
      where: { wizardSessionId: sessionId },
    });

    if (existingCount > 0) {
      // Already imported, skip
      return 0;
    }

    // Import each article
    let imported = 0;
    for (const article of articles) {
      try {
        const post = this.blogPostRepository.create({
          wizardSessionId: sessionId,
          title: article.title || 'Untitled',
          slug: article.slug,
          excerpt: article.excerpt || '',
          content: article.content || '',
          image: article.image, // Preserve image from wizardData
          status: BlogPostStatus.PUBLISHED, // Import as published
        });

        await this.blogPostRepository.save(post);
        imported++;
        console.log(`✅ Imported blog article: ${post.title}`);
      } catch (error) {
        console.error(`❌ Failed to import article: ${article.title}`, error);
      }
    }

    return imported;
  }

  /**
   * Get all blog posts for a site
   */
  async getBlogPosts(
    sessionId: string,
    userId: string,
    status?: BlogPostStatus,
  ): Promise<BlogPostResponseDto[]> {
    // Verify ownership
    const session = await this.wizardSessionRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Site not found');
    }

    // Auto-import blog articles from wizard data if not done yet
    await this.importBlogArticlesFromWizard(sessionId, userId);

    // Build query
    const query: any = { wizardSessionId: sessionId };
    if (status) {
      query.status = status;
    }

    const posts = await this.blogPostRepository.find({
      where: query,
      order: { createdAt: 'DESC' },
    });

    return posts.map((post) => post.toDto());
  }

  /**
   * Get a single blog post
   */
  async getBlogPost(
    postId: string,
    sessionId: string,
    userId: string,
  ): Promise<BlogPostResponseDto> {
    // Verify ownership
    const session = await this.wizardSessionRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Site not found');
    }

    const post = await this.blogPostRepository.findOne({
      where: { id: postId, wizardSessionId: sessionId },
    });

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    return post.toDto();
  }

  /**
   * Create a new blog post
   */
  async createBlogPost(
    sessionId: string,
    userId: string,
    createDto: CreateBlogPostDto,
  ): Promise<BlogPostResponseDto> {
    // Verify ownership
    const session = await this.wizardSessionRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Site not found');
    }

    // Check for duplicate slug if provided
    if (createDto.slug) {
      const existing = await this.blogPostRepository.findOne({
        where: { wizardSessionId: sessionId, slug: createDto.slug },
      });

      if (existing) {
        throw new ConflictException(
          `A blog post with slug "${createDto.slug}" already exists`,
        );
      }
    }

    // Create blog post
    const post = this.blogPostRepository.create({
      ...createDto,
      wizardSessionId: sessionId,
      status: createDto.status || BlogPostStatus.DRAFT,
    });

    const savedPost = await this.blogPostRepository.save(post);

    console.log(`✅ Created blog post: ${savedPost.title} (${savedPost.id})`);

    return savedPost.toDto();
  }

  /**
   * Update a blog post
   */
  async updateBlogPost(
    postId: string,
    sessionId: string,
    userId: string,
    updateDto: UpdateBlogPostDto,
  ): Promise<BlogPostResponseDto> {
    // Verify ownership
    const session = await this.wizardSessionRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Site not found');
    }

    const post = await this.blogPostRepository.findOne({
      where: { id: postId, wizardSessionId: sessionId },
    });

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    // Check for duplicate slug if changing
    if (updateDto.slug && updateDto.slug !== post.slug) {
      const existing = await this.blogPostRepository.findOne({
        where: { wizardSessionId: sessionId, slug: updateDto.slug },
      });

      if (existing) {
        throw new ConflictException(
          `A blog post with slug "${updateDto.slug}" already exists`,
        );
      }
    }

    // Update fields
    Object.assign(post, updateDto);

    const updatedPost = await this.blogPostRepository.save(post);

    console.log(
      `✅ Updated blog post: ${updatedPost.title} (${updatedPost.id})`,
    );

    return updatedPost.toDto();
  }

  /**
   * Delete a blog post
   */
  async deleteBlogPost(
    postId: string,
    sessionId: string,
    userId: string,
  ): Promise<void> {
    // Verify ownership
    const session = await this.wizardSessionRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Site not found');
    }

    const post = await this.blogPostRepository.findOne({
      where: { id: postId, wizardSessionId: sessionId },
    });

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    await this.blogPostRepository.remove(post);

    console.log(`✅ Deleted blog post: ${post.title} (${post.id})`);
  }

  /**
   * Publish site: Regenerate config.json from DB and restart container
   * This updates the EXISTING deployed site instead of creating a new one
   */
  async publishSite(
    sessionId: string,
    userId: string,
  ): Promise<{ success: boolean; message: string; deploymentId?: string }> {
    console.log(`📦 Publishing site ${sessionId}...`);

    // 1. Verify ownership and check if site is deployed
    // Use query builder to bypass cache and get fresh data
    const session = await this.wizardSessionRepository
      .createQueryBuilder('session')
      .where('session.id = :id', { id: sessionId })
      .andWhere('session.userId = :userId', { userId })
      .getOne();

    if (!session) {
      throw new NotFoundException('Site not found');
    }

    if (session.deploymentStatus !== 'deployed') {
      throw new BadRequestException(
        'Site is not deployed yet. Please complete the wizard first.',
      );
    }

    // 2. Get all blog posts from DB
    const blogPosts = await this.blogPostRepository.find({
      where: { wizardSessionId: sessionId },
      order: { createdAt: 'DESC' },
    });

    // 3. Merge blog posts into wizardData
    const wizardData = { ...session.wizardData };

    // Convert blog_posts table to wizardData.blog.articles format
    if (blogPosts.length > 0) {
      wizardData.blog = {
        ...wizardData.blog,
        articles: blogPosts.map((post) => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt || '',
          content: post.content,
          image: post.image, // Preserve image from blog_posts table
          date: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
          status: post.status,
          category: 'Article', // Default category
          tags: [],
        })),
      };
    }

    // Update wizard session with merged data
    session.wizardData = wizardData;
    await this.wizardSessionRepository.save(session);

    // 4. Generate fresh config.json from DB
    const siteConfig =
      await this.wizardDataMapper.transformToSiteConfig(session);

    // 5. Determine site ID and save config
    const siteName = session.siteName || `site-${sessionId}`;
    const siteId = this.wizardDataMapper.generateSiteId(siteName);
    const configDir = `/var/apps/logen/logen-site-configs/${siteId}`;

    try {
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(
        `${configDir}/site-config.json`,
        JSON.stringify(siteConfig, null, 2),
      );
      console.log(
        `✅ Updated site-config.json at ${configDir}/site-config.json`,
      );
    } catch (error) {
      throw new BadRequestException(
        `Failed to update site configuration: ${error.message}`,
      );
    }

    // 6. Trigger full site rebuild using the generator
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      console.log(`🔨 Rebuilding site ${siteId}...`);
      const scriptPath = '/var/apps/logen/apps/site-generator/bin/generate.sh';
      const command = `bash ${scriptPath} ${siteId} --build --docker`;

      const { stdout, stderr } = await execAsync(command, {
        cwd: '/var/apps/logen',
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        shell: '/bin/bash',
        timeout: 300000, // 5 minute timeout
      });

      console.log(`Generation output:\n${stdout}`);
      if (stderr) {
        console.warn(`Generation warnings:\n${stderr}`);
      }

      // Find, stop, remove, and recreate the container with the new image
      console.log(`🔍 Finding container for ${siteId}...`);
      const { stdout: containerName } = await execAsync(
        `docker ps --filter "name=${siteId}" --format "{{.Names}}" | head -1`,
      );

      if (containerName.trim()) {
        const oldContainer = containerName.trim();
        console.log(`🛑 Stopping old container: ${oldContainer}`);
        await execAsync(`docker stop ${oldContainer}`);

        console.log(`🗑️  Removing old container: ${oldContainer}`);
        await execAsync(`docker rm ${oldContainer}`);

        // Recreate container with new image
        console.log(`🚀 Creating new container with updated image...`);
        const imageName = `${siteId}-website`;
        await execAsync(
          `docker run -d --name ${oldContainer} --network logen-network -p 0:80 ${imageName}`,
        );

        console.log(`✅ Container recreated with new image: ${oldContainer}`);
      }

      console.log(`✅ Site ${siteId} published successfully!`);

      return {
        success: true,
        message: `Site published successfully! Your changes are now live.`,
        deploymentId: sessionId,
      };
    } catch (error) {
      console.error(`❌ Publish failed:`, error);
      throw new BadRequestException(`Failed to publish site: ${error.message}`);
    }
  }
}
