import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OAuth2Client } from 'google-auth-library';
import {
  OAuth2Credential,
  OAuth2Provider,
} from '../entities/oauth2-credential.entity';
import { EncryptionService } from '../../common/services/encryption.service';

@Injectable()
export class OAuth2Service {
  private googleClient: OAuth2Client;

  constructor(
    @InjectRepository(OAuth2Credential)
    private oauth2CredentialRepository: Repository<OAuth2Credential>,
    private encryptionService: EncryptionService,
    private configService: ConfigService,
  ) {
    // Initialize Google OAuth2 client
    const clientId = this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'GOOGLE_OAUTH_CLIENT_SECRET',
    );
    const redirectUri = this.configService.get<string>(
      'GOOGLE_OAUTH_REDIRECT_URI',
    );

    if (!clientId || !clientSecret || !redirectUri) {
      console.warn(
        '⚠️  Google OAuth2 credentials not configured. OAuth2 features will be disabled.',
      );
    } else {
      this.googleClient = new OAuth2Client(clientId, clientSecret, redirectUri);
    }
  }

  /**
   * Generate Google OAuth2 authorization URL
   */
  getGoogleAuthUrl(state?: string): string {
    if (!this.googleClient) {
      throw new BadRequestException('Google OAuth2 is not configured');
    }

    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/gmail.send',
    ];

    return this.googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: state,
    });
  }

  /**
   * Exchange authorization code for tokens and save credentials
   */
  async handleGoogleCallback(
    code: string,
    userId: string,
    wizardSessionId?: string,
  ): Promise<OAuth2Credential> {
    if (!this.googleClient) {
      throw new BadRequestException('Google OAuth2 is not configured');
    }

    try {
      // Exchange code for tokens
      const { tokens } = await this.googleClient.getToken(code);

      if (!tokens.access_token || !tokens.refresh_token) {
        throw new BadRequestException('Failed to obtain OAuth2 tokens');
      }

      // Get user email from token
      const ticket = await this.googleClient.verifyIdToken({
        idToken: tokens.id_token!,
        audience: this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID'),
      });
      const payload = ticket.getPayload();
      const email = payload?.email;

      if (!email) {
        throw new BadRequestException('Failed to get email from Google');
      }

      // Encrypt tokens
      const encryptedAccessToken = this.encryptionService.encrypt(
        tokens.access_token,
      );
      const encryptedRefreshToken = this.encryptionService.encrypt(
        tokens.refresh_token,
      );

      // Calculate expiry time
      const expiresAt = new Date();
      expiresAt.setSeconds(
        expiresAt.getSeconds() + (tokens.expiry_date || 3600),
      );

      // Create credential record
      const credential = this.oauth2CredentialRepository.create({
        userId,
        wizardSessionId,
        provider: OAuth2Provider.GOOGLE,
        email,
        encryptedAccessToken,
        encryptedRefreshToken,
        expiresAt,
        scopes: [
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/gmail.send',
        ],
        isActive: true,
      });

      return await this.oauth2CredentialRepository.save(credential);
    } catch (error) {
      console.error('OAuth2 callback error:', error);
      throw new BadRequestException('Failed to process OAuth2 callback');
    }
  }

  /**
   * Get active OAuth2 credential for user
   */
  async getCredential(
    credentialId: string,
    userId: string,
  ): Promise<OAuth2Credential | null> {
    return await this.oauth2CredentialRepository.findOne({
      where: {
        id: credentialId,
        userId,
        isActive: true,
      },
    });
  }

  /**
   * Get decrypted access token (for sending emails)
   */
  async getDecryptedAccessToken(
    credentialId: string,
    userId: string,
  ): Promise<string> {
    const credential = await this.getCredential(credentialId, userId);

    if (!credential) {
      throw new BadRequestException('OAuth2 credential not found');
    }

    // Check if token is expired
    if (new Date() >= credential.expiresAt) {
      // Refresh token
      await this.refreshAccessToken(credential);
      // Reload credential
      const refreshedCredential = await this.getCredential(
        credentialId,
        userId,
      );
      if (!refreshedCredential) {
        throw new BadRequestException('Failed to refresh token');
      }
      return this.encryptionService.decrypt(
        refreshedCredential.encryptedAccessToken,
      );
    }

    // Update last used timestamp
    credential.lastUsedAt = new Date();
    await this.oauth2CredentialRepository.save(credential);

    return this.encryptionService.decrypt(credential.encryptedAccessToken);
  }

  /**
   * Refresh expired access token using refresh token
   */
  private async refreshAccessToken(
    credential: OAuth2Credential,
  ): Promise<void> {
    if (!this.googleClient) {
      throw new BadRequestException('Google OAuth2 is not configured');
    }

    try {
      const refreshToken = this.encryptionService.decrypt(
        credential.encryptedRefreshToken,
      );

      this.googleClient.setCredentials({
        refresh_token: refreshToken,
      });

      const { credentials } = await this.googleClient.refreshAccessToken();

      if (!credentials.access_token) {
        throw new BadRequestException('Failed to refresh access token');
      }

      // Encrypt new access token
      credential.encryptedAccessToken = this.encryptionService.encrypt(
        credentials.access_token,
      );

      // Update expiry
      const expiresAt = new Date();
      expiresAt.setSeconds(
        expiresAt.getSeconds() + (credentials.expiry_date || 3600),
      );
      credential.expiresAt = expiresAt;

      await this.oauth2CredentialRepository.save(credential);
    } catch (error) {
      console.error('Token refresh error:', error);
      // Mark credential as inactive if refresh fails
      credential.isActive = false;
      await this.oauth2CredentialRepository.save(credential);
      throw new BadRequestException(
        'Failed to refresh access token. Please reconnect your account.',
      );
    }
  }

  /**
   * Revoke OAuth2 credential
   */
  async revokeCredential(credentialId: string, userId: string): Promise<void> {
    const credential = await this.getCredential(credentialId, userId);

    if (!credential) {
      throw new BadRequestException('OAuth2 credential not found');
    }

    // Try to revoke token with Google
    try {
      const accessToken = this.encryptionService.decrypt(
        credential.encryptedAccessToken,
      );
      if (this.googleClient) {
        await this.googleClient.revokeToken(accessToken);
      }
    } catch (error) {
      console.warn('Failed to revoke token with Google:', error);
      // Continue anyway to mark as revoked in our database
    }

    // Mark as revoked
    credential.isActive = false;
    credential.revokedAt = new Date();
    await this.oauth2CredentialRepository.save(credential);
  }

  /**
   * Link credential to deployed customer site
   */
  async linkToCustomerSite(
    credentialId: string,
    customerSiteId: string,
    userId: string,
  ): Promise<void> {
    const credential = await this.getCredential(credentialId, userId);

    if (!credential) {
      throw new BadRequestException('OAuth2 credential not found');
    }

    credential.customerSiteId = customerSiteId;
    await this.oauth2CredentialRepository.save(credential);
  }
}
