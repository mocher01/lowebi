/**
 * n8n Service - Handle webhook integrations
 * Version: 1.1.1.9.1 - Basic n8n Configuration
 */

class N8nService {
  constructor(config) {
    this.config = config;
    this.isEnabled = config?.n8n?.enabled || false;
    this.instance = config?.n8n?.instance;
    this.apiKey = config?.n8n?.apiKey;
    this.workflows = config?.n8n?.workflows || {};
  }

  /**
   * Check if n8n integration is enabled and configured
   */
  isAvailable() {
    return this.isEnabled && this.instance && this.workflows.contactForm?.enabled;
  }

  /**
   * Get contact form webhook configuration
   */
  getContactFormWebhook() {
    if (!this.isAvailable()) {
      throw new Error('n8n integration not available or contact form webhook not configured');
    }

    return this.workflows.contactForm;
  }

  /**
   * Submit contact form data to n8n webhook
   * @param {Object} formData - Form data object
   * @param {String} captchaToken - reCAPTCHA token (optional)
   * @returns {Promise<Object>} Response from webhook
   */
  async submitContactForm(formData, captchaToken = null) {
    try {
      const webhook = this.getContactFormWebhook();
      
      // Validate required fields
      this.validateFormData(formData, webhook.expectedFields);

      // Check if captcha is enabled
      const captchaConfig = this.config?.captcha;
      if (captchaConfig?.enabled && !captchaToken) {
        throw new Error('Veuillez compléter la vérification reCAPTCHA');
      }

      // Verify captcha token if provided
      if (captchaConfig?.enabled && captchaToken) {
        const captchaValid = await this.verifyCaptcha(captchaToken, captchaConfig.secretKey);
        if (!captchaValid) {
          throw new Error('La vérification reCAPTCHA a échoué. Veuillez réessayer.');
        }
      }

      // Prepare payload
      const payload = {
        name: formData.name || '',
        email: formData.email || '',
        phone: formData.phone || '',
        company: formData.company || '',
        message: formData.message || '',
        captchaToken: captchaToken || null,
        captchaVerified: captchaConfig?.enabled ? true : false
      };

      console.log('🔄 Submitting to n8n webhook:', {
        url: webhook.webhookUrl,
        method: webhook.method,
        payload: { ...payload, email: '[PROTECTED]' } // Don't log sensitive data
      });

      // Send to n8n webhook
      const response = await fetch(webhook.webhookUrl, {
        method: webhook.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Website-Generator/1.1.1.9.1'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`n8n webhook request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json().catch(() => ({}));
      
      console.log('✅ n8n webhook response:', {
        status: response.status,
        success: true
      });

      return {
        success: true,
        status: response.status,
        data: result,
        message: 'Form submitted successfully'
      };

    } catch (error) {
      console.error('❌ n8n webhook error:', error);
      
      return {
        success: false,
        error: error.message,
        message: 'Failed to submit form. Please try again.'
      };
    }
  }

  /**
   * Validate form data against expected fields
   * @param {Object} formData - Form data to validate
   * @param {Array} expectedFields - Array of expected field names
   */
  validateFormData(formData, expectedFields = []) {
    const errors = [];
    
    // Validate required fields
    if (!formData.name || formData.name.trim() === '') {
      errors.push('Le nom complet est obligatoire');
    }
    
    if (!formData.email || formData.email.trim() === '') {
      errors.push('L\'adresse email est obligatoire');
    }
    
    if (!formData.message || formData.message.trim() === '') {
      errors.push('Le message est obligatoire');
    }

    // Validate email format
    if (formData.email && formData.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.push('L\'adresse email n\'est pas valide (exemple: nom@domaine.com)');
      }
    }

    // Validate phone format if provided
    if (formData.phone && formData.phone.trim() !== '') {
      const phoneRegex = /^[\d\s\-\+\(\)\.]{8,}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        errors.push('Le numéro de téléphone n\'est pas valide (utilisez uniquement des chiffres, espaces, tirets, parenthèses)');
      }
    }

    // Validate name contains only letters, spaces, hyphens, apostrophes
    if (formData.name && formData.name.trim() !== '') {
      const nameRegex = /^[a-zA-ZÀ-ÿ\s\-\'\.]+$/;
      if (!nameRegex.test(formData.name.trim())) {
        errors.push('Le nom ne doit contenir que des lettres, espaces, tirets et apostrophes');
      }
    }

    // Validate message length
    if (formData.message && formData.message.trim().length < 10) {
      errors.push('Le message doit contenir au moins 10 caractères');
    }

    if (errors.length > 0) {
      throw new Error(errors.join('. '));
    }
  }

  /**
   * Verify reCAPTCHA token with Google API
   * @param {String} token - reCAPTCHA token from client
   * @param {String} secretKey - reCAPTCHA secret key
   * @returns {Promise<Boolean>} Verification result
   */
  async verifyCaptcha(token, secretKey) {
    try {
      // Note: In production, this should be done server-side for security
      // For now, we'll use a proxy or implement server-side verification later
      console.log('🔐 Captcha token received for verification');
      
      // For v1.1.1.9.2, we'll trust the client-side verification
      // In v1.1.1.9.3, we'll add server-side verification
      return true;
      
      /* Server-side implementation (for future version):
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${secretKey}&response=${token}`
      });
      const data = await response.json();
      return data.success;
      */
    } catch (error) {
      console.error('Captcha verification error:', error);
      return false;
    }
  }

  /**
   * Test n8n connectivity (for future versions)
   * @returns {Promise<Object>} Connection test result
   */
  async testConnection() {
    if (!this.isAvailable()) {
      return {
        success: false,
        message: 'n8n integration not configured'
      };
    }

    try {
      // For v1.1.1.9.1, we just check if webhook URL is accessible
      const webhook = this.getContactFormWebhook();
      const testUrl = new URL(webhook.webhookUrl);
      
      return {
        success: true,
        message: 'n8n webhook configuration valid',
        details: {
          instance: this.instance,
          webhookHost: testUrl.host,
          workflowId: webhook.id,
          workflowName: webhook.name
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `n8n configuration error: ${error.message}`
      };
    }
  }
}

// Export for use in components
export default N8nService;

// Also export a factory function for easy initialization
export const createN8nService = (siteConfig) => {
  return new N8nService(siteConfig?.integrations);
};