import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

/**
 * N8NIntegrationService
 *
 * Handles N8N workflow creation for contact forms:
 * - oauth2: User's own Gmail via OAuth2
 * - locodai-default: Locod.ai's SMTP credential (bUu8Wj3fYXqnn2nZ)
 * - no-form: No contact form, no workflow needed
 *
 * Related: Issue #137 - Step 7: Review & Site Generation
 */
@Injectable()
export class N8NIntegrationService {
  private readonly logger = new Logger(N8NIntegrationService.name);
  private readonly n8nBaseUrl = 'https://automation.locod-ai.com';
  private readonly locodaiSmtpCredentialId = 'bUu8Wj3fYXqnn2nZ';

  /**
   * Create N8N workflow based on scenario
   */
  async createWorkflow(
    siteId: string,
    scenario: 'oauth2' | 'locodai-default' | 'no-form',
    config: any,
  ): Promise<string | null> {
    if (scenario === 'no-form') {
      this.logger.log(`No contact form for ${siteId}, skipping N8N workflow`);
      return null;
    }

    try {
      const webhookUrl = await this.createWorkflowForScenario(
        siteId,
        scenario,
        config,
      );
      this.logger.log(`N8N workflow created for ${siteId}: ${webhookUrl}`);
      return webhookUrl;
    } catch (error) {
      this.logger.error(`Failed to create N8N workflow for ${siteId}:`, error);
      throw new Error(`N8N workflow creation failed: ${error.message}`);
    }
  }

  /**
   * Create workflow based on scenario
   */
  private async createWorkflowForScenario(
    siteId: string,
    scenario: 'oauth2' | 'locodai-default',
    config: any,
  ): Promise<string> {
    if (scenario === 'oauth2') {
      return this.createOAuth2Workflow(siteId, config);
    } else {
      return this.createLocodaiDefaultWorkflow(siteId, config);
    }
  }

  /**
   * Create OAuth2 workflow (user's own Gmail)
   */
  private async createOAuth2Workflow(
    siteId: string,
    config: any,
  ): Promise<string> {
    const workflowName = `${siteId}-contact-form-oauth2`;
    const recipientEmail = config.oauth2Email || config.recipientEmail;

    const workflow = {
      name: workflowName,
      active: true,
      nodes: [
        // Webhook trigger
        {
          parameters: {
            path: `${siteId}-contact`,
            responseMode: 'onReceived',
            responseCode: 200,
          },
          name: 'Webhook',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 1,
          position: [250, 300],
        },
        // Gmail OAuth2 send
        {
          parameters: {
            resource: 'message',
            operation: 'send',
            message: {
              to: recipientEmail,
              subject: `=Contact from ${config.businessName} - {{$json["name"]}}`,
              message: `=Name: {{$json["name"]}}\nEmail: {{$json["email"]}}\nMessage: {{$json["message"]}}`,
            },
          },
          name: 'Gmail',
          type: 'n8n-nodes-base.gmail',
          typeVersion: 1,
          position: [450, 300],
          credentials: {
            gmailOAuth2: {
              id: config.oauth2CredentialId, // Should be stored in wizardData
              name: 'Gmail OAuth2',
            },
          },
        },
      ],
      connections: {
        Webhook: {
          main: [[{ node: 'Gmail', type: 'main', index: 0 }]],
        },
      },
    };

    // In production, this would call N8N API to create workflow
    // For now, return mock webhook URL
    const webhookUrl = `${this.n8nBaseUrl}/webhook/${siteId}-contact`;
    this.logger.log(`OAuth2 workflow created: ${webhookUrl}`);

    return webhookUrl;
  }

  /**
   * Create Locod.ai default SMTP workflow
   */
  private async createLocodaiDefaultWorkflow(
    siteId: string,
    config: any,
  ): Promise<string> {
    const workflowName = `${siteId}-contact-form-smtp`;
    const recipientEmail = config.recipientEmail;

    const workflow = {
      name: workflowName,
      active: true,
      nodes: [
        // Webhook trigger
        {
          parameters: {
            path: `${siteId}-contact`,
            responseMode: 'onReceived',
            responseCode: 200,
          },
          name: 'Webhook',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 1,
          position: [250, 300],
        },
        // SMTP send using Locod.ai credential
        {
          parameters: {
            fromEmail: 'noreply@locod-ai.com',
            toEmail: recipientEmail,
            subject: `=Contact from ${config.businessName} - {{$json["name"]}}`,
            text: `=Name: {{$json["name"]}}\nEmail: {{$json["email"]}}\nMessage: {{$json["message"]}}`,
          },
          name: 'Email Send',
          type: 'n8n-nodes-base.emailSend',
          typeVersion: 1,
          position: [450, 300],
          credentials: {
            smtp: {
              id: this.locodaiSmtpCredentialId,
              name: 'Locod.ai SMTP',
            },
          },
        },
      ],
      connections: {
        Webhook: {
          main: [[{ node: 'Email Send', type: 'main', index: 0 }]],
        },
      },
    };

    // In production, this would call N8N API to create workflow
    // For now, return mock webhook URL
    const webhookUrl = `${this.n8nBaseUrl}/webhook/${siteId}-contact`;
    this.logger.log(`SMTP workflow created: ${webhookUrl}`);

    return webhookUrl;
  }

  /**
   * Delete N8N workflow
   */
  async deleteWorkflow(siteId: string): Promise<void> {
    try {
      // In production, this would call N8N API to delete workflow
      this.logger.log(`N8N workflow deleted for ${siteId}`);
    } catch (error) {
      this.logger.warn(
        `Failed to delete N8N workflow for ${siteId}:`,
        error.message,
      );
    }
  }

  /**
   * Test webhook connectivity
   */
  async testWebhook(webhookUrl: string): Promise<boolean> {
    try {
      const response = await axios.post(
        webhookUrl,
        {
          name: 'Test User',
          email: 'test@example.com',
          message: 'Test message from Logen',
        },
        { timeout: 5000 },
      );

      return response.status === 200;
    } catch (error) {
      this.logger.error(`Webhook test failed: ${error.message}`);
      return false;
    }
  }
}
