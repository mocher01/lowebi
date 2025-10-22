import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { CustomerSettings } from './entities/customer-settings.entity';
import {
  CustomerActivity,
  ActivityType,
} from './entities/customer-activity.entity';
import {
  UpdateCustomerProfileDto,
  CustomerProfileResponseDto,
  CustomerSettingsDto,
} from './dto/customer-profile.dto';
import { CustomerActivityService } from './services/customer-activity.service';
import { CustomerStatsService } from './services/customer-stats.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(CustomerSettings)
    private settingsRepository: Repository<CustomerSettings>,
    private activityService: CustomerActivityService,
    private statsService: CustomerStatsService,
  ) {}

  async getProfile(userId: string): Promise<CustomerProfileResponseDto> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to get profile for user ${userId}:`, error);
      throw error;
    }
  }

  async updateProfile(
    userId: string,
    updateDto: UpdateCustomerProfileDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<CustomerProfileResponseDto> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if email is being changed and if it's already taken
      if (updateDto.email && updateDto.email !== user.email) {
        const existingUser = await this.userRepository.findOne({
          where: { email: updateDto.email },
        });

        if (existingUser) {
          throw new BadRequestException('Email is already in use');
        }
      }

      // Update user fields
      Object.assign(user, updateDto);
      const updatedUser = await this.userRepository.save(user);

      // Log the activity
      await this.activityService.logActivity(
        userId,
        ActivityType.PROFILE_UPDATED,
        'Profile information updated',
        { updatedFields: Object.keys(updateDto) },
        ipAddress,
        userAgent,
      );

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        fullName: updatedUser.fullName,
        emailVerified: updatedUser.emailVerified,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to update profile for user ${userId}:`, error);
      throw error;
    }
  }

  async getSettings(userId: string): Promise<CustomerSettings> {
    try {
      let settings = await this.settingsRepository.findOne({
        where: { userId },
      });

      if (!settings) {
        // Create default settings if they don't exist
        settings = this.settingsRepository.create({
          userId,
          notifications: { email: true, sms: false, push: true },
          theme: { mode: 'system', primaryColor: '#3b82f6' },
          language: 'en',
          timezone: 'UTC',
          preferences: {},
        });

        settings = await this.settingsRepository.save(settings);
      }

      return settings;
    } catch (error) {
      this.logger.error(`Failed to get settings for user ${userId}:`, error);
      throw error;
    }
  }

  async updateSettings(
    userId: string,
    settingsDto: CustomerSettingsDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<CustomerSettings> {
    try {
      const settings = await this.getSettings(userId);

      // Update settings fields
      if (settingsDto.notifications) {
        settings.notifications = {
          ...settings.notifications,
          ...settingsDto.notifications,
        };
      }

      if (settingsDto.theme) {
        settings.theme = { ...settings.theme, ...settingsDto.theme };
      }

      if (settingsDto.language) {
        settings.language = settingsDto.language;
      }

      if (settingsDto.timezone) {
        settings.timezone = settingsDto.timezone;
      }

      const updatedSettings = await this.settingsRepository.save(settings);

      // Log the activity
      await this.activityService.logActivity(
        userId,
        ActivityType.SETTINGS_UPDATED,
        'Account settings updated',
        { updatedFields: Object.keys(settingsDto) },
        ipAddress,
        userAgent,
      );

      return updatedSettings;
    } catch (error) {
      this.logger.error(`Failed to update settings for user ${userId}:`, error);
      throw error;
    }
  }

  async getDashboardStats(userId: string) {
    try {
      return await this.statsService.getDashboardStats(userId);
    } catch (error) {
      this.logger.error(
        `Failed to get dashboard stats for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async getUsageMetrics(userId: string) {
    try {
      return await this.statsService.getUsageMetrics(userId);
    } catch (error) {
      this.logger.error(
        `Failed to get usage metrics for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async getActivity(
    userId: string,
    page: number = 1,
    limit: number = 20,
    type?: ActivityType,
  ) {
    try {
      return await this.activityService.getCustomerActivities(
        userId,
        page,
        limit,
        type,
      );
    } catch (error) {
      this.logger.error(`Failed to get activity for user ${userId}:`, error);
      throw error;
    }
  }

  async deleteAccount(userId: string, password: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verify password before deletion
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new BadRequestException('Invalid password');
      }

      // Log the activity before deletion
      await this.activityService.logActivity(
        userId,
        ActivityType.PROFILE_UPDATED,
        'Account deleted by user',
        { action: 'account_deletion' },
      );

      // Soft delete or hard delete based on your requirements
      // For now, we'll deactivate the account
      user.isActive = false;
      await this.userRepository.save(user);

      this.logger.log(`Account deactivated for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete account for user ${userId}:`, error);
      throw error;
    }
  }

  async getAccountSummary(userId: string): Promise<{
    profile: CustomerProfileResponseDto;
    settings: CustomerSettings;
    stats: any;
    recentActivity: any;
  }> {
    try {
      const [profile, settings, stats, recentActivity] = await Promise.all([
        this.getProfile(userId),
        this.getSettings(userId),
        this.getDashboardStats(userId),
        this.getActivity(userId, 1, 5), // Get last 5 activities
      ]);

      return {
        profile,
        settings,
        stats,
        recentActivity,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get account summary for user ${userId}:`,
        error,
      );
      throw error;
    }
  }
}
