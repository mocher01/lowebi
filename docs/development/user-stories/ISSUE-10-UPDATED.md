# Issue #10 - Enhanced Wizard Flow for Portal v1.1.1.9.2.4.2.5

## **🎯 Updated User Story**

As a **site creator**, I want a **comprehensive wizard interface** that creates complete, customized websites with proper content, branding, and configuration management.

## **✅ Current Status (What Works)**
- ✅ Basic 6-step wizard flow
- ✅ ConfigGenerator service validation (step 4 fix)
- ✅ Database integration
- ✅ Template saving to files
- ✅ API endpoints for site creation

## **❌ Critical Gaps Identified (Must Fix)**

### **1. Logo & Asset Management**
**Current**: No logo/image management in wizard
**Required**:
- [ ] Logo upload step in wizard
- [ ] Image upload for services/hero
- [ ] Asset preview and management
- [ ] File validation and resizing
- [ ] Default placeholder generation

### **2. Language Management**
**Current**: No language selection
**Required**:
- [ ] Language selection in wizard (default: French)
- [ ] Localized wizard interface in French
- [ ] Language-specific content generation
- [ ] Multi-language template support

### **3. Flexible Service/Activity Types**
**Current**: Hardcoded "services" with finite predefined list
**Required**:
- [ ] Configurable terminology (services, activités, cours, produits)
- [ ] Open text input for any activity type
- [ ] Business type determines default terminology
- [ ] Dynamic form labels based on business type

### **4. Template Selection**
**Current**: No template selection in wizard
**Required**:
- [ ] Template library display in wizard
- [ ] Template preview functionality
- [ ] Template selection step (Step 2.5)
- [ ] Load selected template as base configuration

### **5. Content Accuracy & Business-Specific Generation**
**Current**: Generic content regardless of business type
**Required**:
- [ ] Accurate content generation for specific industries
- [ ] User services properly integrated into content
- [ ] Business-appropriate hero text and descriptions
- [ ] Industry-specific default values and text

### **6. Content Review & Customization**
**Current**: No way to review/edit generated content
**Required**:
- [ ] Content review step before site creation
- [ ] Editable hero text, descriptions, and about section
- [ ] Preview of generated content
- [ ] Ability to regenerate content with different parameters

### **7. Blog & Advanced Features Setup**
**Current**: No blog management in wizard
**Required**:
- [ ] Blog setup option in wizard
- [ ] Initial blog posts generation
- [ ] Blog category configuration
- [ ] Newsletter signup configuration

## **🎯 Updated Wizard Flow (8 Steps)**

### **Step 1: Welcome & Terms**
- Introduction and terms acceptance
- Language selection (default: French)

### **Step 2: Template Selection** ⭐ **NEW**
- Display available templates
- Template preview
- Select base template or start from scratch

### **Step 3: Business Information**
- Site name, business type, domain, slogan
- **Enhanced**: Business type determines terminology (services/activités/cours)

### **Step 4: Branding & Assets** ⭐ **NEW**
- Logo upload and management
- Color palette selection
- Image upload for hero/services
- Asset preview and validation

### **Step 5: Content & Activities** ⭐ **ENHANCED**
- **Dynamic terminology** based on business type
- **Open text input** for any activity/service type
- Contact information
- **Business-specific content generation**

### **Step 6: Content Review & Customization** ⭐ **NEW**
- Preview generated content
- Edit hero text, descriptions, about section
- Review services/activities presentation
- Regenerate content options

### **Step 7: Advanced Features** ⭐ **NEW**
- Blog setup and configuration
- Newsletter signup
- Additional features selection
- SEO settings

### **Step 8: Final Review & Creation**
- Complete configuration review
- Template saving option
- Site creation and deployment

## **🔧 Technical Requirements**

### **ConfigGenerator Enhancements**
- [ ] Business-specific content generation
- [ ] Flexible terminology support
- [ ] Template integration
- [ ] Asset management integration
- [ ] Language-specific generation

### **Wizard UI Enhancements**
- [ ] French localization by default
- [ ] Asset upload components
- [ ] Template selection interface
- [ ] Content editing interface
- [ ] Dynamic form labels

### **Template System Integration**
- [ ] Template preview API
- [ ] Template loading in wizard
- [ ] Template-based configuration override

### **Asset Management System**
- [ ] File upload handling
- [ ] Image processing and resizing
- [ ] Asset storage and organization
- [ ] Default asset generation

## **📋 Acceptance Criteria**

### **Core Functionality**
- [ ] 8-step wizard with all required features
- [ ] French language interface by default
- [ ] Template selection and preview
- [ ] Logo and image upload/management
- [ ] Flexible service/activity terminology
- [ ] Business-specific content generation
- [ ] Content review and customization
- [ ] Blog and advanced features setup

### **Content Quality**
- [ ] Generated content matches actual business type
- [ ] User-provided services properly integrated
- [ ] Accurate industry-specific descriptions
- [ ] Proper French localization

### **Asset Management**
- [ ] Logo upload and processing
- [ ] Service/hero image management
- [ ] Asset validation and optimization
- [ ] Default placeholder generation

### **Template Integration**
- [ ] Template library accessible in wizard
- [ ] Template preview functionality
- [ ] Selected template properly applied
- [ ] Template-specific customizations

### **User Experience**
- [ ] Intuitive 8-step flow
- [ ] Clear progress indicators
- [ ] Proper validation and error handling
- [ ] Mobile-responsive interface

## **🚀 Implementation Priority**

### **Phase 1: Critical Fixes**
1. Language management (French by default)
2. Flexible service terminology
3. Business-specific content generation
4. Template selection integration

### **Phase 2: Asset Management**
1. Logo upload functionality
2. Image management system
3. Asset processing pipeline
4. Preview capabilities

### **Phase 3: Advanced Features**
1. Content review and editing
2. Blog setup integration
3. Advanced feature configuration
4. Enhanced user experience

## **📊 Success Metrics**
- [ ] Complete wizard flow without gaps
- [ ] Accurate content generation for all business types
- [ ] Functional asset management
- [ ] Template system integration
- [ ] French localization implemented
- [ ] User can create complete, branded websites

## **🔄 Definition of Done**
- [ ] All 7 critical gaps addressed
- [ ] Enhanced 8-step wizard implemented
- [ ] Comprehensive testing completed
- [ ] Documentation updated
- [ ] Production deployment successful
- [ ] User acceptance testing passed

---

**Previous Version**: v1.1.1.9.2.4.2.4 (ConfigGenerator fix only)
**Updated Version**: v1.1.1.9.2.4.2.5 (Complete wizard enhancement)
**Estimated Effort**: Large (7 new features + significant enhancements)