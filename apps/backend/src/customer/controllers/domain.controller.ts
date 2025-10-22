import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { DomainManagementService } from '../../infrastructure/domain-management.service';
import {
  CheckAvailabilityDto,
  CreateDomainDto,
  DomainResponseDto,
} from '../dto/domain.dto';

@Controller('customer/domains')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class CustomerDomainController {
  constructor(private domainManagementService: DomainManagementService) {}

  /**
   * Check subdomain availability
   * POST /customer/domains/check-availability
   */
  @Post('check-availability')
  @HttpCode(HttpStatus.OK)
  async checkAvailability(
    @Body() dto: CheckAvailabilityDto,
    @Request() req,
  ): Promise<{ available: boolean; suggestions?: string[] }> {
    return this.domainManagementService.checkSubdomainAvailability(
      dto.subdomain,
      req.user.id,
    );
  }

  /**
   * Create domain (subdomain or custom)
   * POST /customer/domains/create
   */
  @Post('create')
  async createDomain(
    @Body() dto: CreateDomainDto,
    @Request() req,
  ): Promise<DomainResponseDto> {
    if (dto.domainType === 'subdomain') {
      // Create subdomain (instant activation)
      const siteDomain = await this.domainManagementService.createSubdomain(
        dto.sessionId,
        dto.domain,
        req.user.id,
      );

      return {
        domain: siteDomain.domain,
        status: siteDomain.status,
        url: siteDomain.getFullUrl(),
      };
    } else if (dto.domainType === 'custom') {
      // Create custom domain (pending verification)
      const result = await this.domainManagementService.createCustomDomain(
        dto.sessionId,
        dto.domain,
        req.user.id,
      );

      return {
        domain: result.domain.domain,
        status: result.domain.status,
        tempDomain: result.tempDomain.domain,
        verificationToken: result.verificationToken,
        verificationExpiry: result.domain.verificationExpiresAt?.toISOString(),
        url: result.tempDomain.getFullUrl(), // Return temp subdomain URL
      };
    } else {
      throw new Error('Invalid domain type');
    }
  }

  /**
   * Get domain details by ID
   * GET /customer/domains/:id
   */
  @Get(':id')
  async getDomain(@Param('id') id: string): Promise<any> {
    const domain = await this.domainManagementService.getDomainById(id);
    return domain.toDto();
  }

  /**
   * Get domains for a session
   * GET /customer/domains/session/:sessionId
   */
  @Get('session/:sessionId')
  async getSessionDomains(@Param('sessionId') sessionId: string): Promise<any> {
    const domains =
      await this.domainManagementService.getDomainsForSession(sessionId);
    return domains.map((d) => d.toDto());
  }

  /**
   * Delete domain
   * DELETE /customer/domains/:id
   */
  @Delete(':id')
  async deleteDomain(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.domainManagementService.deleteDomain(id);
    return { success: true };
  }
}
