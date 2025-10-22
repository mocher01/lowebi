/**
 * N8N Workflow Generator - Automatic workflow creation for sites
 * Version: 1.1.1.9.3 - Full N8N Automation
 * 
 * Automatically creates contact form workflows for new sites based on template
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Load environment variables
dotenv.config();

class N8nWorkflowGenerator {
  constructor() {
    // 🔧 v1.1.1.9.2.3.3.1 - Use environment variables instead of hardcoded values
    this.baseUrl = process.env.N8N_INSTANCE_URL || 'https://automation.locod-ai.com';
    this.apiKey = process.env.N8N_API_KEY;
    this.adminEmail = process.env.N8N_ADMIN_EMAIL;
    this.adminPassword = process.env.N8N_ADMIN_PASSWORD; // For JWT auth
    this.templateWorkflowId = 'OXM4y6SbbJPIChIp'; // QA_FormulaireMail template
    
    // SMTP Configuration for email sending
    this.smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      fromName: process.env.SMTP_FROM_NAME || 'Website Generator'
    };
    
    // Validate required environment variables
    this.validateCredentials();
  }
  
  /**
   * Validate that all required credentials are present
   */
  validateCredentials() {
    const required = [
      'N8N_API_KEY',
      'SERVER_IP'  // Required for IP whitelist security
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}\nPlease check your .env file.`);
    }
    
    console.log('✅ N8N API credentials validated from environment variables');
    console.log('🛡️  Security: IP whitelist only - no authentication tokens needed');
  }

  /**
   * Check existing credentials in N8N
   */
  async listN8nCredentials() {
    try {
      console.log('🔍 Listing existing N8N credentials...');
      
      const response = await fetch(`${this.baseUrl}/api/v1/credentials`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`📋 Found ${data.data?.length || 0} credentials in N8N:`);
      
      data.data?.forEach(cred => {
        console.log(`   • ${cred.name} (${cred.type}) - ID: ${cred.id}`);
        
        // Check if it's the Gmail account we're looking for
        if (cred.type === 'smtp' || cred.type === 'gmail') {
          console.log(`     🔍 Email credential found: ${cred.name}`);
        }
      });
      
      return {
        success: true,
        credentials: data.data || [],
        message: 'Credentials listed successfully'
      };
    } catch (error) {
      console.error('❌ Erreur listing credentials:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Échec listing credentials'
      };
    }
  }

  /**
   * 🔧 v1.1.1.9.2.3.3.1 - Find or create SMTP credential automatically
   * @param {string} emailAddress - Email address to find/create credential for
   * @param {string} appPassword - Gmail app password (required if creating new)
   * @param {string} customName - Custom name for the credential
   */
  async findOrCreateSMTPCredential(emailAddress = 'locodai.sas@gmail.com', appPassword = null, customName = null) {
    try {
      console.log(`🔍 Finding or creating SMTP credential for: ${emailAddress}`);
      
      // 🎯 STEP 1: Check for existing credentials by examining workflows
      const existingCredential = await this.findExistingCredentialInWorkflows(emailAddress);
      
      if (existingCredential.found) {
        console.log(`✅ Using existing credential: ${existingCredential.credential.name} (${existingCredential.credential.id})`);
        return {
          success: true,
          credential: existingCredential.credential,
          created: false,
          message: `Using existing credential: ${existingCredential.credential.name}`
        };
      }
      
      // 🎯 STEP 2: Create new credential if not found
      if (!appPassword) {
        console.log('⚠️  No existing credential found and no app password provided');
        return {
          success: false,
          error: 'App password required to create new SMTP credential',
          message: 'Need Gmail app password to create new credential'
        };
      }
      
      console.log(`🔧 Creating new SMTP credential for ${emailAddress}...`);
      const newCredential = await this.createSMTPCredential(emailAddress, appPassword, customName);
      
      if (newCredential.success) {
        console.log(`✅ Created new credential: ${newCredential.credential.name} (${newCredential.credential.id})`);
        return {
          success: true,
          credential: newCredential.credential,
          created: true,
          message: `Created new credential: ${newCredential.credential.name}`
        };
      } else {
        return newCredential;
      }
      
    } catch (error) {
      console.error('❌ Error finding/creating SMTP credential:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to find or create SMTP credential'
      };
    }
  }

  /**
   * Find existing credential by examining workflow configurations
   * @param {string} emailAddress - Email to search for
   */
  async findExistingCredentialInWorkflows(emailAddress) {
    try {
      // 🎯 Known credentials from previous analysis
      const knownCredentials = {
        'locodai.sas@gmail.com': {
          id: 'bUu8Wj3fYXqnn2nZ',
          name: 'Locodai Gmail'
        },
        // Could be extended with other known mappings
      };
      
      if (knownCredentials[emailAddress]) {
        return {
          found: true,
          credential: knownCredentials[emailAddress],
          message: `Found known credential for ${emailAddress}`
        };
      }
      
      // If not in known list, search through existing workflows
      const workflowsResponse = await fetch(`${this.baseUrl}/api/v1/workflows`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (!workflowsResponse.ok) {
        throw new Error(`Failed to get workflows: ${workflowsResponse.status}`);
      }
      
      const workflows = await workflowsResponse.json();
      
      // Look through email workflows for matching credentials
      const emailWorkflows = workflows.data.filter(w => 
        w.name.toLowerCase().includes('mail') || 
        w.name.toLowerCase().includes('email')
      );
      
      for (const workflow of emailWorkflows) {
        const detailResponse = await fetch(`${this.baseUrl}/api/v1/workflows/${workflow.id}`, {
          method: 'GET',
          headers: {
            'X-N8N-API-KEY': this.apiKey,
            'Content-Type': 'application/json'
          }
        });
        
        if (detailResponse.ok) {
          const workflowDetail = await detailResponse.json();
          const emailNodes = workflowDetail.nodes.filter(node => 
            node.type.includes('email') || node.type.includes('mail')
          );
          
          // Check if any email node uses this email address (would need credential data access)
          // For now, return Gmail credentials if available
          for (const node of emailNodes) {
            if (node.credentials && node.credentials.smtp) {
              const credential = node.credentials.smtp;
              if (credential.name.toLowerCase().includes('gmail') && emailAddress.includes('@gmail.com')) {
                return {
                  found: true,
                  credential: credential,
                  message: `Found Gmail credential that might match ${emailAddress}`
                };
              }
            }
          }
        }
      }
      
      return {
        found: false,
        message: `No existing credential found for ${emailAddress}`
      };
      
    } catch (error) {
      console.error('❌ Error searching existing credentials:', error.message);
      return {
        found: false,
        error: error.message,
        message: 'Error while searching for existing credentials'
      };
    }
  }

  /**
   * Get session cookie for REST API authentication
   */
  async getSessionCookie() {
    try {
      if (!this.adminPassword) {
        throw new Error('N8N_ADMIN_PASSWORD not set in environment variables');
      }
      
      console.log('🔐 Getting session cookie for REST API authentication...');
      
      const loginResponse = await fetch(`${this.baseUrl}/rest/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emailOrLdapLoginId: this.adminEmail,
          password: this.adminPassword
        })
      });
      
      if (!loginResponse.ok) {
        const errorData = await loginResponse.json().catch(() => ({}));
        throw new Error(`Login failed: ${loginResponse.status} - ${errorData.message || loginResponse.statusText}`);
      }
      
      // Extract session cookie from response headers
      const cookies = loginResponse.headers.get('set-cookie');
      if (!cookies) {
        throw new Error('No session cookie received from login');
      }

      // Find the n8n auth cookie and clean it
      const cookieArray = cookies.split(',');
      let sessionCookie = cookieArray.find(cookie => 
        cookie.trim().includes('n8n-auth')
      );
      
      if (!sessionCookie) {
        sessionCookie = cookieArray[0];
      }
      
      // Clean up the cookie (remove extra attributes)
      sessionCookie = sessionCookie.split(';')[0].trim();
      
      console.log('✅ Session cookie obtained successfully');
      return sessionCookie;
      
    } catch (error) {
      console.error('❌ Error getting session cookie:', error.message);
      throw error;
    }
  }

  /**
   * NO LONGER NEEDED - IP whitelist security model doesn't use credentials
   * This method is kept for backward compatibility but does nothing
   */
  async createWebhookCredential(siteName, webhookToken) {
    console.log('🛡️  SECURITY UPDATE: No webhook credentials needed - using IP whitelist only');
    return {
      success: true,
      credential: null,
      message: 'No credentials needed with IP whitelist security model'
    };
  }


  /**
   * Create new SMTP credential in N8N
   * @param {string} emailAddress - Email address
   * @param {string} appPassword - Gmail app password
   * @param {string} customName - Custom credential name
   */
  async createSMTPCredential(emailAddress, appPassword, customName = null) {
    try {
      const credentialName = customName || `${emailAddress.split('@')[0]} SMTP - Auto Generated`;
      
      const credential = {
        name: credentialName,
        type: 'smtp',
        data: {
          user: emailAddress,
          password: appPassword,
          host: 'smtp.gmail.com',  // Default to Gmail, could be configurable
          port: 587,
          secure: false,
          disableStartTls: false
        }
      };
      
      console.log(`📤 Creating SMTP credential: ${credentialName}`);
      
      const response = await fetch(`${this.baseUrl}/api/v1/credentials`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credential)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }
      
      const created = await response.json();
      
      return {
        success: true,
        credential: {
          id: created.id,
          name: created.name,
          type: created.type
        },
        message: `SMTP credential created successfully: ${created.name}`
      };
      
    } catch (error) {
      console.error('❌ Error creating SMTP credential:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to create SMTP credential'
      };
    }
  }

  /**
   * Test N8N API connectivity
   */
  async testApiConnection() {
    try {
      console.log('🔄 Test de connexion à l\'API N8N...');
      
      const response = await fetch(`${this.baseUrl}/api/v1/workflows`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ API N8N connectée - ${data.data?.length || 0} workflows trouvés`);
      
      return {
        success: true,
        workflowCount: data.data?.length || 0,
        message: 'API N8N accessible'
      };
    } catch (error) {
      console.error('❌ Erreur connexion API N8N:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Échec connexion API N8N'
      };
    }
  }

  /**
   * Get template workflow details
   */
  async getTemplateWorkflow() {
    try {
      console.log(`🔄 Récupération du template workflow ${this.templateWorkflowId}...`);
      
      const response = await fetch(`${this.baseUrl}/api/v1/workflows/${this.templateWorkflowId}`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const workflow = await response.json();
      console.log(`✅ Template workflow récupéré: ${workflow.name}`);
      
      return {
        success: true,
        workflow: workflow,
        message: 'Template workflow récupéré'
      };
    } catch (error) {
      console.error('❌ Erreur récupération template:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Échec récupération template'
      };
    }
  }

  /**
   * Generate site abbreviation from site name
   * @param {string} siteName - The site name
   * @returns {string} Two-letter abbreviation
   */
  generateSiteAbbreviation(siteName) {
    // Extract first letters of words, fallback to first 2 chars
    const words = siteName.split(/[-_\s]+/).filter(word => word.length > 0);
    
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    } else if (siteName.length >= 2) {
      return siteName.substring(0, 2).toUpperCase();
    } else {
      return (siteName + 'X').substring(0, 2).toUpperCase();
    }
  }

  /**
   * Generate webhook UUID for unique endpoint
   * @returns {string} Unique webhook identifier
   */
  generateWebhookUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Find existing workflow by name
   * @param {string} workflowName - Name of the workflow to find
   */
  async findExistingWorkflow(workflowName) {
    try {
      console.log(`🔍 Checking if workflow '${workflowName}' already exists...`);
      
      const response = await fetch(`${this.baseUrl}/api/v1/workflows`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get workflows: ${response.status}`);
      }

      const workflows = await response.json();
      const existingWorkflow = workflows.data.find(w => 
        w.name === workflowName && 
        w.active === true && 
        w.isArchived !== true
      );
      
      if (existingWorkflow) {
        console.log(`✅ Found existing ACTIVE workflow: ${existingWorkflow.name} (${existingWorkflow.id})`);
        return {
          found: true,
          workflow: existingWorkflow,
          message: `Active workflow ${workflowName} already exists`
        };
      } else {
        // Check if there are inactive/archived workflows with the same name
        const inactiveWorkflow = workflows.data.find(w => w.name === workflowName);
        if (inactiveWorkflow) {
          console.log(`⚠️  Found INACTIVE/ARCHIVED workflow: ${workflowName} (${inactiveWorkflow.id}) - active: ${inactiveWorkflow.active}, archived: ${inactiveWorkflow.isArchived}`);
          console.log(`🔄 Will create new active workflow to replace inactive one`);
        } else {
          console.log(`➡️  No existing workflow found with name '${workflowName}'`);
        }
        return {
          found: false,
          message: `No workflow found with name '${workflowName}'`
        };
      }
      
    } catch (error) {
      console.error('❌ Error checking existing workflows:', error.message);
      return {
        found: false,
        error: error.message,
        message: 'Error while checking for existing workflows'
      };
    }
  }

  /**
   * Create new workflow from template
   * @param {string} siteName - Name of the site
   * @param {Object} siteConfig - Site configuration
   */
  async createWorkflowForSite(siteName, siteConfig) {
    try {
      const sitePrefix = this.generateSiteAbbreviation(siteName);
      const newWorkflowName = `${sitePrefix}_ContactForm`;
      
      // 🔍 Check if workflow already exists - REUSE existing workflow to avoid creating new ones each time
      const existingWorkflow = await this.findExistingWorkflow(newWorkflowName);
      if (existingWorkflow.found) {
        console.log(`✅ Found existing workflow: ${newWorkflowName} (ID: ${existingWorkflow.workflow.id})`);
        console.log(`🔗 Reusing existing workflow to avoid creating duplicates`);
        
        const webhookUrl = this.extractWebhookUrl(existingWorkflow.workflow);
        console.log(`🔗 Existing webhook URL: ${webhookUrl}`);
        
        return {
          success: true,
          workflow: existingWorkflow.workflow,
          webhookUrl: webhookUrl,
          workflowName: newWorkflowName,
          message: `Reusing existing workflow ${newWorkflowName}`
        };
      }
      
      // Generate unique webhook UUID for NEW workflow only
      const webhookId = this.generateWebhookUUID();
      
      console.log(`🚀 Creating NEW workflow for ${siteName} with IP whitelist security`);
      console.log(`🔗 Workflow: ${newWorkflowName}`);
      console.log(`🔗 Webhook UUID: ${webhookId}`);

      // Get template workflow
      const templateResult = await this.getTemplateWorkflow();
      if (!templateResult.success) {
        return templateResult;
      }

      const template = templateResult.workflow;
      
      console.log(`🔄 Création du workflow ${newWorkflowName} pour ${siteName}...`);
      console.log(`🛡️  NEW SECURITY: Using IP whitelist (${process.env.SERVER_IP || '162.55.213.90'}) only - no authentication needed`);

      // Clone and modify workflow (minimal fields to avoid read-only errors)
      const modifiedNodes = this.modifyWorkflowNodes(template.nodes, siteName, siteConfig, webhookId);
      const newWorkflow = {
        name: newWorkflowName,
        nodes: modifiedNodes,
        connections: template.connections,
        settings: template.settings || {}
      };

      // Create workflow via API
      const response = await fetch(`${this.baseUrl}/api/v1/workflows`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newWorkflow)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }

      const createdWorkflow = await response.json();
      const webhookUrl = this.extractWebhookUrl(createdWorkflow);

      console.log(`✅ Workflow ${newWorkflowName} créé avec succès`);
      console.log(`🔗 Webhook URL: ${webhookUrl}`);

      // Activer le workflow automatiquement
      const activationResult = await this.activateWorkflow(createdWorkflow.id);
      if (activationResult.success) {
        console.log(`✅ Workflow ${newWorkflowName} activé automatiquement`);
      } else {
        console.log(`⚠️  Échec activation automatique: ${activationResult.message}`);
      }

      return {
        success: true,
        workflow: createdWorkflow,
        webhookUrl,
        webhookId,
        workflowName: newWorkflowName,
        message: `Workflow ${newWorkflowName} créé avec succès`
      };

    } catch (error) {
      console.error('❌ Erreur création workflow:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Échec création workflow'
      };
    }
  }

  /**
   * Modify workflow nodes for the new site
   * @param {Array} nodes - Original workflow nodes
   * @param {string} siteName - Site name
   * @param {Object} siteConfig - Site configuration
   * @param {string} webhookId - Generated webhook UUID
   */
  modifyWorkflowNodes(nodes, siteName, siteConfig, webhookId) {
    // 🔧 v1.1.1.9.2.3.3.1 - Extract configurable emails with fallbacks
    const flowConfig = siteConfig.integrations?.n8n?.flows?.contactForm?.config || {};
    const recipientEmail = flowConfig.recipientEmail || this.adminEmail || 'locodai.sas@gmail.com';
    const senderEmail = flowConfig.senderEmail || this.smtpConfig.auth.user || 'locodai.sas@gmail.com';
    const replyToEmail = flowConfig.replyToEmail || recipientEmail;
    
    console.log(`📧 Email Configuration for ${siteName}:`);
    console.log(`   • Recipient (receives forms): ${recipientEmail}`);
    console.log(`   • Sender (SMTP FROM): ${senderEmail}`);
    console.log(`   • Reply-To: ${replyToEmail}`);
    
    return nodes.map(node => {
      const newNode = { ...node };

      // Modify webhook node
      if (node.type === 'n8n-nodes-base.webhook') {
        console.log(`🔍 Processing webhook node`);
        
        // Use the provided webhookId for this site
        newNode.webhookId = webhookId;
        console.log(`🔧 Using webhookId: ${webhookId}`);
        
        // 🛡️ NEW SECURITY MODEL: IP whitelist only, no authentication
        newNode.parameters = {
          ...node.parameters,
          path: webhookId,  // Use UUID as webhook path for security through obscurity
          httpMethod: 'POST',
          // NO authentication parameter - IP whitelist handles security
          options: {
            ...node.parameters?.options,
            noResponseBody: false,
            responseMode: 'onReceived',
            responseData: 'allEntries',
            rawBody: false,
            ignoreBots: false
          }
        };

        // 🛡️ Remove any existing credentials - new security model doesn't use them
        delete newNode.credentials;
        console.log(`🛡️  Using NEW security model: IP whitelist only, no N8N credentials`);
      }

      // Modify email node - 🔧 v1.1.1.9.2.3.3.1 - Configurable emails per site
      if (node.type === 'n8n-nodes-base.emailSend' || node.type === 'n8n-nodes-base.gmail') {
        newNode.parameters = {
          ...node.parameters,
          // 🎯 CONFIGURABLE EMAILS (both from site config)
          toEmail: recipientEmail,          // Who receives contact forms
          fromEmail: senderEmail,           // Who sends the emails (SMTP FROM)
          replyTo: replyToEmail,           // Reply-to address
          // Email content
          subject: `=[${siteName}] Nouveau contact de {{$json["body"]["name"]}}`,
          text: `=${this.generateEmailTemplate(siteName, siteConfig, recipientEmail, senderEmail)}`,
          options: {}
        };
        
        // 🔧 v1.1.1.9.2.3.3.1 - Use dynamically determined SMTP credentials
        // This will be set by setupN8nForSite() after credential detection/creation
        newNode.credentials = {
          ...node.credentials,
          smtp: this.resolvedSMTPCredential || node.credentials?.smtp || {
            id: 'bUu8Wj3fYXqnn2nZ',
            name: 'Locodai Gmail'  // Default fallback
          }
        };
        
        console.log(`📧 Using SMTP credential: ${newNode.credentials.smtp.name} (${newNode.credentials.smtp.id})`);
      }

      return newNode;
    });
  }

  /**
   * Activate a workflow
   * @param {string} workflowId - ID of the workflow to activate
   */
  async activateWorkflow(workflowId) {
    try {
      console.log(`🔄 Activation du workflow ${workflowId}...`);
      
      const response = await fetch(`${this.baseUrl}/api/v1/workflows/${workflowId}/activate`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }

      return {
        success: true,
        message: 'Workflow activé avec succès'
      };
    } catch (error) {
      console.error('❌ Erreur activation workflow:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Échec activation workflow'
      };
    }
  }

  /**
   * Extract webhook URL from created workflow
   * @param {Object} workflow - Created workflow data
   */
  extractWebhookUrl(workflow) {
    // Find webhook node and construct URL
    const webhookNode = workflow.nodes?.find(node => node.type === 'n8n-nodes-base.webhook');
    if (webhookNode && webhookNode.parameters?.path) {
      return `${this.baseUrl}/webhook/${webhookNode.parameters.path}`;
    }
    
    // Fallback: use workflow ID
    return `${this.baseUrl}/webhook/${workflow.id}`;
  }

  /**
   * NO LONGER NEEDED - IP whitelist security doesn't need token validation
   * These methods are kept for backward compatibility but do nothing
   */
  addValidationNode(nodes, expectedToken) {
    console.log('🛡️  SECURITY UPDATE: No token validation needed - using IP whitelist only');
    return nodes;
  }
  
  addValidationNodeConnections(connections) {
    console.log('🛡️  SECURITY UPDATE: No validation node connections needed - using IP whitelist only');
    return connections;
  }

  /**
   * Generate email template for the site
   * @param {string} siteName - Site name
   * @param {Object} siteConfig - Site configuration
   * @param {string} recipientEmail - Email that receives the form
   * @param {string} senderEmail - Email that sends the notification
   */
  generateEmailTemplate(siteName, siteConfig, recipientEmail, senderEmail) {
    const businessName = siteConfig?.business?.name || siteName;
    // 🔧 Get proper website URL from config or construct dynamically
    const websiteUrl = siteConfig?.business?.website || 
                      siteConfig?.deployment?.url || 
                      `https://${siteName}.locod-ai.com`;

    return `📧 Nouveau message de contact - ${businessName}

👤 CONTACT
Nom: {{$json["body"]["name"]}}
Email: {{$json["body"]["email"]}}
Téléphone: {{$json["body"]["phone"]}}
Entreprise: {{$json["body"]["company"]}}

💬 MESSAGE
{{$json["body"]["message"]}}

🌐 PROVENANCE
Site: ${businessName}
URL: ${websiteUrl}
Timestamp: {{DateTime.fromISO($json["body"]["timestamp"]).toFormat("dd/MM/yyyy à HH:mm")}}`.trim();
  }

  /**
   * Update site configuration with N8N workflow details
   * @param {string} siteName - Site name
   * @param {Object} workflowResult - Result from workflow creation
   */
  updateSiteConfig(siteName, workflowResult) {
    const configPath = `configs/${siteName}/site-config.json`;
    
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // Add N8N configuration
      config.integrations = config.integrations || {};
      config.integrations.n8n = {
        enabled: true,
        instance: this.baseUrl,
        apiKey: this.apiKey,
        security: {
          type: 'ip_whitelist_only',
          allowedIPs: [process.env.SERVER_IP || '162.55.213.90'],
          description: 'Security through IP whitelist - no authentication tokens needed'
        },
        workflows: {
          contactForm: {
            id: workflowResult.workflow.id,
            name: workflowResult.workflowName,
            webhookUrl: workflowResult.webhookUrl,
            method: 'POST',
            enabled: true,
            expectedFields: ['name', 'email', 'message'],
            auth: {
              type: 'ip_whitelist_only',
              description: 'Server IP whitelist - no headers or tokens needed'
            }
          }
        }
      };

      // Write updated config
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log(`✅ Configuration N8N ajoutée à ${configPath}`);
      
      return { success: true, configPath };
    } catch (error) {
      console.error('❌ Erreur mise à jour config:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Complete N8N setup for a site
   * @param {string} siteName - Site name
   * @param {Object} siteConfig - Site configuration
   */
  async setupN8nForSite(siteName, siteConfig) {
    console.log(`🚀 Configuration N8N pour ${siteName}`);
    console.log('=====================================');

    // Test API connection
    const apiTest = await this.testApiConnection();
    if (!apiTest.success) {
      return apiTest;
    }

    // Extract email configuration from site config
    const flowConfig = siteConfig.integrations?.n8n?.workflows?.contactForm?.config || {};
    const senderEmail = flowConfig.senderEmail || 'locodai.sas@gmail.com';  // Default to locodai
    const senderAppPassword = flowConfig.senderAppPassword || null;  // Gmail App Password if provided
    
    console.log(`📧 Email Configuration:`);
    console.log(`   • Sender Email: ${senderEmail}`);
    console.log(`   • App Password: ${senderAppPassword ? 'PROVIDED' : 'NOT PROVIDED'}`);
    console.log('');
    
    // Find or create SMTP credential for the sender email
    const credentialResult = await this.findOrCreateSMTPCredential(
      senderEmail, 
      senderAppPassword,
      flowConfig.credentialName
    );
    
    if (!credentialResult.success) {
      console.log('❌ Failed to setup SMTP credential');
      console.log(`   Error: ${credentialResult.message}`);
      
      if (credentialResult.error === 'App password required to create new SMTP credential') {
        console.log('');
        console.log('🔧 SOLUTION: To use a custom email address, please:');
        console.log('1. Add senderAppPassword to your site config');
        console.log('2. Or manually create the SMTP credential in N8N dashboard');
        console.log('3. Or use the default locodai.sas@gmail.com (no action needed)');
      }
      
      return credentialResult;
    }
    
    // Store the resolved credential for use in workflow creation
    this.resolvedSMTPCredential = credentialResult.credential;
    
    if (credentialResult.created) {
      console.log(`✅ Created new SMTP credential: ${credentialResult.credential.name}`);
    } else {
      console.log(`✅ Using existing SMTP credential: ${credentialResult.credential.name}`);
    }

    // Create workflow
    const workflowResult = await this.createWorkflowForSite(siteName, siteConfig);
    if (!workflowResult.success) {
      return workflowResult;
    }

    // Update site config
    const configUpdate = this.updateSiteConfig(siteName, workflowResult);
    if (!configUpdate.success) {
      return configUpdate;
    }

    console.log('✅ Configuration N8N terminée avec succès !');
    console.log('=====================================');

    return {
      success: true,
      workflow: workflowResult.workflow,
      webhookUrl: workflowResult.webhookUrl,
      workflowName: workflowResult.workflowName,
      message: `N8N configuré pour ${siteName}`
    };
  }
}

export default N8nWorkflowGenerator;

// CLI usage
const siteName = process.argv[2];
const configPath = process.argv[3];

if (siteName) {
  const generator = new N8nWorkflowGenerator();
  
  // Load site config if provided
  let siteConfig = {};
  if (configPath) {
    try {
      siteConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      console.error(`❌ Erreur lecture config: ${error.message}`);
      process.exit(1);
    }
  }

  generator.setupN8nForSite(siteName, siteConfig)
    .then(result => {
      if (result.success) {
        console.log(`\n🎉 Succès: ${result.message}`);
        process.exit(0);
      } else {
        console.error(`\n❌ Échec: ${result.message}`);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Erreur inattendue:', error.message);
      process.exit(1);
    });
} else if (process.argv.length > 2) {
  console.error('Usage: node n8n-workflow-generator.js <site-name> [config-path]');
  process.exit(1);
}