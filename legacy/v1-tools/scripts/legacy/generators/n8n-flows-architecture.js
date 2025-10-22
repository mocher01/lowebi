/**
 * N8N Flows Architecture - Extensible system for multiple workflow types
 * v1.1.1.9.2.3.3.1 - Preparé pour l'ajout futur de flows
 */

// Définition des types de flows supportés
export const FLOW_TYPES = {
  CONTACT_FORM: {
    id: 'contactForm',
    name: 'Formulaire de Contact',
    description: 'Gestion des soumissions de formulaire de contact',
    templateId: 'OXM4y6SbbJPIChIp', // Template QA_FormulaireMail
    requiredFields: ['name', 'email', 'message'],
    optionalFields: ['phone', 'company'],
    defaultConfig: {
      recipientEmail: null, // Required
      senderEmail: 'locodai.sas@gmail.com',
      replyToEmail: null, // Uses recipientEmail by default
      subject: '[{{siteName}}] Nouveau contact',
      priority: 'normal'
    }
  },
  
  NEWSLETTER: {
    id: 'newsletter',
    name: 'Inscription Newsletter',
    description: 'Gestion des inscriptions à la newsletter',
    templateId: null, // À créer
    requiredFields: ['email'],
    optionalFields: ['name', 'preferences'],
    defaultConfig: {
      listId: null, // Required - Mailchimp/Sendinblue list
      doubleOptIn: true,
      welcomeEmail: true,
      tags: ['website-signup']
    }
  },
  
  EVENT_REGISTRATION: {
    id: 'eventRegistration',
    name: 'Inscription Événements',
    description: 'Gestion des inscriptions aux événements',
    templateId: null, // À créer
    requiredFields: ['name', 'email', 'eventId'],
    optionalFields: ['phone', 'company', 'participants'],
    defaultConfig: {
      notificationEmail: null,
      confirmationEmail: true,
      maxParticipants: null,
      waitingList: true
    }
  },
  
  SUPPORT_TICKET: {
    id: 'supportTicket',
    name: 'Ticket Support',
    description: 'Création de tickets de support',
    templateId: null, // À créer
    requiredFields: ['email', 'subject', 'message'],
    optionalFields: ['priority', 'category', 'attachments'],
    defaultConfig: {
      supportEmail: null,
      autoReply: true,
      ticketPrefix: 'TICKET',
      categories: ['Technical', 'Billing', 'General']
    }
  },
  
  FEEDBACK_FORM: {
    id: 'feedbackForm',
    name: 'Formulaire Feedback',
    description: 'Collecte de feedback et avis clients',
    templateId: null, // À créer
    requiredFields: ['rating', 'comment'],
    optionalFields: ['name', 'email', 'productId'],
    defaultConfig: {
      storageType: 'database', // ou 'googlesheets'
      notifyOnLowRating: true,
      lowRatingThreshold: 3,
      thankYouMessage: true
    }
  }
};

// Configuration de sécurité par défaut pour tous les flows
export const SECURITY_CONFIG = {
  webhook: {
    authentication: {
      type: 'header', // 'header', 'basic', 'jwt', 'oauth2'
      headerName: 'X-Webhook-Token',
      tokenLength: 32,
      tokenAlgorithm: 'hex' // 'hex', 'base64', 'uuid'
    },
    
    rateLimit: {
      enabled: true,
      maxRequests: 100,
      timeWindow: 60000, // 1 minute
      blockDuration: 300000 // 5 minutes
    },
    
    cors: {
      enabled: true,
      origins: ['*'], // À restreindre en production
      methods: ['POST'],
      credentials: false
    },
    
    validation: {
      maxPayloadSize: '10mb',
      strictContentType: true,
      requiredContentType: 'application/json'
    }
  },
  
  encryption: {
    sensitiveFields: ['password', 'token', 'apiKey', 'secret'],
    algorithm: 'aes-256-gcm',
    saltRounds: 10
  }
};

// Architecture pour gérer plusieurs flows
export class N8nFlowsManager {
  constructor(baseConfig) {
    this.baseConfig = baseConfig;
    this.flows = new Map();
    this.securityConfig = SECURITY_CONFIG;
  }
  
  /**
   * Enregistrer un nouveau type de flow
   */
  registerFlowType(flowType) {
    if (!flowType.id || !flowType.name) {
      throw new Error('Flow type must have id and name');
    }
    
    this.flows.set(flowType.id, {
      ...flowType,
      instances: new Map()
    });
    
    console.log(`📋 Flow type registered: ${flowType.name} (${flowType.id})`);
  }
  
  /**
   * Créer une instance de flow pour un site
   */
  async createFlowInstance(siteId, flowTypeId, config = {}) {
    const flowType = this.flows.get(flowTypeId);
    if (!flowType) {
      throw new Error(`Unknown flow type: ${flowTypeId}`);
    }
    
    const instanceConfig = {
      ...flowType.defaultConfig,
      ...config,
      siteId,
      flowTypeId,
      createdAt: new Date().toISOString()
    };
    
    // Générer token de sécurité
    const securityToken = this.generateSecurityToken();
    instanceConfig.security = {
      ...this.securityConfig.webhook,
      token: securityToken
    };
    
    // Stocker l'instance
    flowType.instances.set(siteId, instanceConfig);
    
    console.log(`✅ Flow instance created: ${flowType.name} for ${siteId}`);
    return instanceConfig;
  }
  
  /**
   * Générer un token de sécurité
   */
  generateSecurityToken() {
    const crypto = require('crypto');
    const { tokenLength, tokenAlgorithm } = this.securityConfig.webhook.authentication;
    
    switch (tokenAlgorithm) {
      case 'hex':
        return crypto.randomBytes(tokenLength).toString('hex');
      case 'base64':
        return crypto.randomBytes(tokenLength).toString('base64');
      case 'uuid':
        return crypto.randomUUID();
      default:
        return crypto.randomBytes(tokenLength).toString('hex');
    }
  }
  
  /**
   * Valider les données d'un webhook
   */
  validateWebhookData(flowTypeId, data) {
    const flowType = this.flows.get(flowTypeId);
    if (!flowType) {
      return { valid: false, error: 'Unknown flow type' };
    }
    
    // Vérifier les champs requis
    const missingFields = flowType.requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
      return {
        valid: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      };
    }
    
    // Vérifier les types de données
    // TODO: Implémenter validation plus stricte avec JSON Schema
    
    return { valid: true };
  }
  
  /**
   * Obtenir la configuration d'un flow pour un site
   */
  getFlowConfig(siteId, flowTypeId) {
    const flowType = this.flows.get(flowTypeId);
    if (!flowType) {
      return null;
    }
    
    return flowType.instances.get(siteId);
  }
  
  /**
   * Lister tous les flows disponibles
   */
  listAvailableFlows() {
    return Array.from(this.flows.values()).map(flow => ({
      id: flow.id,
      name: flow.name,
      description: flow.description,
      hasTemplate: !!flow.templateId,
      requiredFields: flow.requiredFields,
      optionalFields: flow.optionalFields
    }));
  }
  
  /**
   * Exporter la configuration pour un site
   */
  exportSiteFlows(siteId) {
    const siteFlows = {};
    
    this.flows.forEach((flowType, flowTypeId) => {
      const instance = flowType.instances.get(siteId);
      if (instance) {
        siteFlows[flowTypeId] = {
          enabled: true,
          config: instance,
          security: {
            type: instance.security.authentication.type,
            headerName: instance.security.authentication.headerName,
            // Ne pas exporter le token lui-même
          }
        };
      }
    });
    
    return siteFlows;
  }
}

// Fonction helper pour initialiser l'architecture
export function initializeN8nArchitecture() {
  const manager = new N8nFlowsManager({
    baseUrl: process.env.N8N_INSTANCE_URL || 'https://automation.locod-ai.fr',
    apiKey: process.env.N8N_API_KEY
  });
  
  // Enregistrer tous les types de flows disponibles
  Object.values(FLOW_TYPES).forEach(flowType => {
    manager.registerFlowType(flowType);
  });
  
  return manager;
}

// Export pour utilisation dans d'autres modules
export default {
  FLOW_TYPES,
  SECURITY_CONFIG,
  N8nFlowsManager,
  initializeN8nArchitecture
};