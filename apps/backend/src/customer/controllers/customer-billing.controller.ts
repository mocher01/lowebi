import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../auth/entities/user.entity';
import { CustomerBillingService } from '../services/customer-billing.service';
import {
  SubscriptionPlanDto,
  UpgradeSubscriptionDto,
  CustomerSubscriptionResponseDto,
  UsageStatsDto,
  InvoiceDto,
  UpdatePaymentMethodDto,
} from '../dto/customer-billing.dto';

@ApiTags('Customer Billing & Subscriptions')
@Controller('customer/billing')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CustomerBillingController {
  constructor(
    private readonly customerBillingService: CustomerBillingService,
  ) {}

  @Get('plans')
  @ApiOperation({
    summary: 'Get available subscription plans',
    description:
      'Retrieve all available subscription plans with pricing and features',
  })
  @ApiResponse({
    status: 200,
    description: 'Plans retrieved successfully',
    type: [SubscriptionPlanDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getAvailablePlans(): Promise<SubscriptionPlanDto[]> {
    return this.customerBillingService.getAvailablePlans();
  }

  @Get('subscription')
  @ApiOperation({
    summary: 'Get current subscription',
    description: "Retrieve customer's current subscription details",
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription retrieved successfully',
    type: CustomerSubscriptionResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription not found',
  })
  async getCurrentSubscription(
    @CurrentUser() user: User,
  ): Promise<CustomerSubscriptionResponseDto> {
    return this.customerBillingService.getCurrentSubscription(user.id);
  }

  @Post('upgrade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upgrade subscription',
    description: 'Upgrade to a higher tier subscription plan',
  })
  @ApiBody({ type: UpgradeSubscriptionDto })
  @ApiResponse({
    status: 200,
    description: 'Subscription upgraded successfully',
    type: CustomerSubscriptionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid plan or payment method',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 402,
    description: 'Payment required or failed',
  })
  async upgradeSubscription(
    @CurrentUser() user: User,
    @Body() upgradeDto: UpgradeSubscriptionDto,
  ): Promise<CustomerSubscriptionResponseDto> {
    return this.customerBillingService.upgradeSubscription(user.id, upgradeDto);
  }

  @Post('downgrade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Downgrade subscription',
    description: 'Downgrade to a lower tier subscription plan',
  })
  @ApiBody({ type: UpgradeSubscriptionDto })
  @ApiResponse({
    status: 200,
    description: 'Subscription downgraded successfully',
    type: CustomerSubscriptionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid plan or downgrade not allowed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async downgradeSubscription(
    @CurrentUser() user: User,
    @Body() downgradeDto: UpgradeSubscriptionDto,
  ): Promise<CustomerSubscriptionResponseDto> {
    return this.customerBillingService.downgradeSubscription(
      user.id,
      downgradeDto,
    );
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel subscription',
    description: 'Cancel current subscription (effective at period end)',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription cancelled successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot cancel subscription',
  })
  async cancelSubscription(
    @CurrentUser() user: User,
  ): Promise<{ message: string; cancelledAt: Date }> {
    const result = await this.customerBillingService.cancelSubscription(
      user.id,
    );
    return {
      message:
        'Subscription cancelled successfully. Access will continue until period end.',
      cancelledAt: result.cancelledAt,
    };
  }

  @Get('usage')
  @ApiOperation({
    summary: 'Get usage statistics',
    description: 'Retrieve current billing period usage statistics',
  })
  @ApiResponse({
    status: 200,
    description: 'Usage statistics retrieved successfully',
    type: UsageStatsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getUsageStats(@CurrentUser() user: User): Promise<UsageStatsDto> {
    return this.customerBillingService.getUsageStats(user.id);
  }

  @Get('invoices')
  @ApiOperation({
    summary: 'Get billing history',
    description: "Retrieve customer's billing history and invoices",
  })
  @ApiResponse({
    status: 200,
    description: 'Invoices retrieved successfully',
    type: [InvoiceDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getInvoices(@CurrentUser() user: User): Promise<InvoiceDto[]> {
    return this.customerBillingService.getInvoices(user.id);
  }

  @Get('payment-methods')
  @ApiOperation({
    summary: 'Get payment methods',
    description: "Retrieve customer's saved payment methods",
  })
  @ApiResponse({
    status: 200,
    description: 'Payment methods retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getPaymentMethods(@CurrentUser() user: User): Promise<any[]> {
    return this.customerBillingService.getPaymentMethods(user.id);
  }

  @Put('payment-method')
  @ApiOperation({
    summary: 'Update payment method',
    description: "Add or update customer's payment method",
  })
  @ApiBody({ type: UpdatePaymentMethodDto })
  @ApiResponse({
    status: 200,
    description: 'Payment method updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid payment method',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async updatePaymentMethod(
    @CurrentUser() user: User,
    @Body() updatePaymentDto: UpdatePaymentMethodDto,
  ): Promise<{ message: string }> {
    await this.customerBillingService.updatePaymentMethod(
      user.id,
      updatePaymentDto,
    );
    return { message: 'Payment method updated successfully' };
  }

  @Post('portal-session')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create billing portal session',
    description:
      'Create a Stripe billing portal session for advanced billing management',
  })
  @ApiResponse({
    status: 200,
    description: 'Portal session created successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 400,
    description: 'Portal session creation failed',
  })
  async createPortalSession(
    @CurrentUser() user: User,
  ): Promise<{ url: string }> {
    const portalUrl =
      await this.customerBillingService.createBillingPortalSession(user.id);
    return { url: portalUrl };
  }

  @Get('subscription/preview')
  @ApiOperation({
    summary: 'Preview subscription change',
    description: 'Preview the cost and prorations for a subscription change',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription preview retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async previewSubscriptionChange(
    @CurrentUser() user: User,
    @Body() changeDto: UpgradeSubscriptionDto,
  ): Promise<any> {
    return this.customerBillingService.previewSubscriptionChange(
      user.id,
      changeDto,
    );
  }
}
