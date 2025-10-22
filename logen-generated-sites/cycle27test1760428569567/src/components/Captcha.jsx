import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { loadSiteConfig } from '@/config/config-loader';

/**
 * Google reCAPTCHA v2 Component using official react-google-recaptcha
 * Version: 1.1.1.9.3
 */
const Captcha = forwardRef(({ onVerify, onExpired, theme = 'light', size = 'normal' }, ref) => {
  const config = window.SITE_CONFIG || loadSiteConfig();
  const captchaConfig = config?.integrations?.captcha || {};
  const recaptchaRef = useRef(null);

  // Check if captcha is enabled
  const isEnabled = captchaConfig.enabled && 
                   captchaConfig.provider === 'recaptcha' && 
                   captchaConfig.version === 'v2' &&
                   captchaConfig.siteKey;

  // Handle captcha verification
  const handleVerify = (token) => {
    if (onVerify) onVerify(token);
  };

  // Handle captcha expiration
  const handleExpired = () => {
    if (onExpired) onExpired();
  };

  // Reset captcha method
  const reset = () => {
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  };

  // Expose reset method through ref
  useImperativeHandle(ref, () => ({
    reset
  }), []);

  // Don't render if not enabled
  if (!isEnabled) {
    return null;
  }

  return (
    <div className="captcha-container">
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={captchaConfig.siteKey}
        theme={captchaConfig.theme || theme}
        size={captchaConfig.size || size}
        onChange={handleVerify}
        onExpired={handleExpired}
      />
    </div>
  );
});

Captcha.displayName = 'Captcha';

export default Captcha;