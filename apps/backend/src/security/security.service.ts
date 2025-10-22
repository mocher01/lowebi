import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);
  private readonly suspiciousIPs = new Set<string>();
  private readonly rateLimitAttempts = new Map<string, number>();

  /**
   * Monitor and log security events
   */
  logSecurityEvent(event: string, ip: string, userId?: string, details?: any) {
    this.logger.warn(`Security Event: ${event}`, {
      ip,
      userId,
      timestamp: new Date().toISOString(),
      details,
    });
  }

  /**
   * Check if IP is on suspicious list
   */
  isSuspiciousIP(ip: string): boolean {
    return this.suspiciousIPs.has(ip);
  }

  /**
   * Add IP to suspicious list
   */
  addSuspiciousIP(ip: string, reason: string) {
    this.suspiciousIPs.add(ip);
    this.logSecurityEvent('IP_MARKED_SUSPICIOUS', ip, undefined, { reason });
  }

  /**
   * Remove IP from suspicious list
   */
  removeSuspiciousIP(ip: string) {
    this.suspiciousIPs.delete(ip);
    this.logSecurityEvent('IP_UNMARKED_SUSPICIOUS', ip);
  }

  /**
   * Track rate limit attempts
   */
  trackRateLimitAttempt(ip: string): number {
    const current = this.rateLimitAttempts.get(ip) || 0;
    const newCount = current + 1;
    this.rateLimitAttempts.set(ip, newCount);

    // Auto-mark as suspicious after too many rate limit hits
    if (newCount > 10) {
      this.addSuspiciousIP(ip, 'Excessive rate limiting');
    }

    return newCount;
  }

  /**
   * Get security status overview
   */
  getSecurityStatus() {
    return {
      suspiciousIPs: this.suspiciousIPs.size,
      rateLimitAttempts: this.rateLimitAttempts.size,
      totalRateLimitHits: Array.from(this.rateLimitAttempts.values()).reduce(
        (a, b) => a + b,
        0,
      ),
    };
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Password should be at least 8 characters long');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password should contain at least one uppercase letter');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password should contain at least one lowercase letter');
    }

    // Number check
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password should contain at least one number');
    }

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password should contain at least one special character');
    }

    // Length bonus
    if (password.length >= 12) {
      score += 1;
    }

    return {
      isValid: score >= 4,
      score,
      feedback,
    };
  }

  /**
   * Clean up old entries (should be called periodically)
   */
  cleanup() {
    // Clear rate limit attempts older than 1 hour
    // In a real implementation, this would track timestamps
    if (this.rateLimitAttempts.size > 1000) {
      this.rateLimitAttempts.clear();
      this.logger.log('Cleaned up rate limit tracking');
    }
  }
}
