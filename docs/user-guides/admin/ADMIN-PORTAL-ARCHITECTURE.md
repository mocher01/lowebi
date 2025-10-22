# 🏗️ Admin Portal Locod-AI - Architecture Complète

**Version:** v2.0.0  
**Type:** Architecture Document  
**Status:** Design Phase  

## 📊 Vue d'ensemble

Le portail admin Locod-AI est le centre de contrôle complet pour la gestion de la plateforme SaaS, couvrant tous les aspects business et techniques.

## 🎯 Modules Admin

### **Phase 1 - Foundation (Current)**
- ✅ Customer Portal (existing)
- 🔄 **Queue IA** (in development)

### **Phase 2 - Business Management**
- 👥 **Gestion Clients** - CRM intégré
- 💰 **Facturation & Revenus** - Billing automation
- 📊 **Analytics & Reporting** - Business intelligence

### **Phase 3 - Operations**
- 🎨 **Gestion Templates** - Template management
- 📊 **Monitoring Sites** - Site health & performance
- ⚙️ **Configuration Système** - Platform settings

### **Phase 4 - Growth**
- 🎯 **Marketing & Growth** - Campaign management
- 📞 **Support Client** - Ticketing system
- 🔐 **Sécurité & Audit** - Security monitoring

## 🗄️ Database Schema Complet

### **Core Tables (Existing)**
```sql
-- Sites et configurations (existing)
customers (id, email, name, created_at, plan_type, status)
sites (id, customer_id, name, domain, config_path, status, created_at)
site_configs (id, site_id, config_data, version, created_at)

-- Templates (existing)
templates (id, name, category, config_template, created_at, status)
```

### **Queue IA System (Phase 1)**
```sql
-- Demandes de génération IA
ai_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER REFERENCES customers(id),
    site_id INTEGER REFERENCES sites(id),
    request_type TEXT NOT NULL, -- 'services', 'content', 'images', 'full_site'
    business_type TEXT NOT NULL,
    terminology TEXT, -- User-selected terminology
    request_data TEXT NOT NULL, -- JSON avec détails spécifiques
    status TEXT DEFAULT 'pending', -- pending, processing, completed, rejected, cancelled
    priority INTEGER DEFAULT 5, -- 1=urgent, 5=normal, 10=low
    estimated_cost DECIMAL(5,2) DEFAULT 2.00,
    actual_cost DECIMAL(5,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    assigned_at DATETIME,
    started_at DATETIME,
    completed_at DATETIME,
    admin_id INTEGER REFERENCES admin_users(id), -- Qui traite
    admin_notes TEXT,
    generated_content TEXT, -- Résultat JSON
    customer_feedback INTEGER, -- 1-5 rating
    customer_notes TEXT,
    billing_status TEXT DEFAULT 'pending' -- pending, billed, paid, refunded
);

-- Index pour performance
CREATE INDEX idx_ai_requests_status ON ai_requests(status);
CREATE INDEX idx_ai_requests_customer ON ai_requests(customer_id);
CREATE INDEX idx_ai_requests_created ON ai_requests(created_at);
```

### **User Management (Phase 1)**
```sql
-- Utilisateurs admin
admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'admin', -- super_admin, admin, editor, viewer
    password_hash TEXT NOT NULL,
    last_login DATETIME,
    permissions TEXT, -- JSON array of permissions
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active'
);

-- Sessions admin
admin_sessions (
    id TEXT PRIMARY KEY, -- JWT token ID
    admin_id INTEGER REFERENCES admin_users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    ip_address TEXT,
    user_agent TEXT
);
```

### **Billing System (Phase 2)**
```sql
-- Plans de facturation
billing_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, -- 'free', 'starter', 'pro', 'enterprise'
    price_monthly DECIMAL(8,2),
    price_yearly DECIMAL(8,2),
    features TEXT, -- JSON array
    ai_credits_included INTEGER DEFAULT 0,
    max_sites INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active'
);

-- Abonnements clients
customer_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER REFERENCES customers(id),
    plan_id INTEGER REFERENCES billing_plans(id),
    status TEXT DEFAULT 'active', -- active, cancelled, expired, suspended
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    current_period_start DATETIME,
    current_period_end DATETIME,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    stripe_subscription_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Factures
invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER REFERENCES customers(id),
    subscription_id INTEGER REFERENCES customer_subscriptions(id),
    invoice_number TEXT UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    status TEXT DEFAULT 'pending', -- pending, paid, failed, refunded
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    due_at DATETIME,
    paid_at DATETIME,
    stripe_invoice_id TEXT,
    payment_method TEXT,
    notes TEXT
);

-- Éléments de facture
invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER REFERENCES invoices(id),
    ai_request_id INTEGER REFERENCES ai_requests(id), -- Si facturé pour IA
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(8,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **Analytics & Monitoring (Phase 2)**
```sql
-- Métriques business
business_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_date DATE NOT NULL,
    total_customers INTEGER DEFAULT 0,
    active_customers INTEGER DEFAULT 0,
    new_customers INTEGER DEFAULT 0,
    churned_customers INTEGER DEFAULT 0,
    total_sites INTEGER DEFAULT 0,
    active_sites INTEGER DEFAULT 0,
    monthly_revenue DECIMAL(12,2) DEFAULT 0,
    ai_requests_count INTEGER DEFAULT 0,
    ai_revenue DECIMAL(10,2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Monitoring des sites
site_monitoring (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER REFERENCES sites(id),
    check_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    status_code INTEGER,
    response_time_ms INTEGER,
    is_up BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    check_type TEXT DEFAULT 'http' -- http, ssl, dns
);

-- Logs d'activité admin
admin_activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER REFERENCES admin_users(id),
    action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', etc.
    resource_type TEXT, -- 'ai_request', 'customer', 'site', etc.
    resource_id INTEGER,
    old_values TEXT, -- JSON
    new_values TEXT, -- JSON
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **Template Management (Phase 3)**
```sql
-- Versions de templates
template_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER REFERENCES templates(id),
    version TEXT NOT NULL, -- '1.0.0', '1.1.0', etc.
    config_data TEXT NOT NULL, -- JSON
    changelog TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    created_by INTEGER REFERENCES admin_users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- A/B testing templates
template_ab_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    template_a_id INTEGER REFERENCES templates(id),
    template_b_id INTEGER REFERENCES templates(id),
    traffic_split INTEGER DEFAULT 50, -- Percentage to template_b
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'draft', -- draft, running, completed, cancelled
    created_by INTEGER REFERENCES admin_users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **Marketing & Growth (Phase 4)**
```sql
-- Campagnes email
email_campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    content_html TEXT NOT NULL,
    content_text TEXT,
    segment_criteria TEXT, -- JSON pour ciblage
    status TEXT DEFAULT 'draft', -- draft, scheduled, sending, sent, cancelled
    scheduled_at DATETIME,
    sent_at DATETIME,
    created_by INTEGER REFERENCES admin_users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Historique envois emails
email_sends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER REFERENCES email_campaigns(id),
    customer_id INTEGER REFERENCES customers(id),
    email TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, sent, delivered, opened, clicked, bounced, complained
    sent_at DATETIME,
    delivered_at DATETIME,
    opened_at DATETIME,
    clicked_at DATETIME,
    error_message TEXT
);

-- Programme de parrainage
referral_program (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referrer_id INTEGER REFERENCES customers(id),
    referred_id INTEGER REFERENCES customers(id),
    referral_code TEXT UNIQUE,
    reward_type TEXT DEFAULT 'credit', -- credit, discount, cash
    reward_amount DECIMAL(8,2),
    status TEXT DEFAULT 'pending', -- pending, earned, paid
    earned_at DATETIME,
    paid_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🎨 Interface Modules

### **1. Dashboard Principal**
```
📊 KPIs: MRR, Churn, New Customers, AI Revenue
📈 Graphiques: Trends 7/30/90 jours
🚨 Alertes: Sites down, factures impayées, queue IA
📋 Actions rapides: Traiter IA, relances, support
```

### **2. Queue IA (Phase 1 - Development)**
```
📋 Liste demandes avec filtres et tri
🔄 Workflow traitement avec Claude Code integration
📊 Métriques: temps moyen, taux completion, revenus
💰 Facturation automatique des demandes traitées
```

### **3. Gestion Clients (Phase 2)**
```
👥 Liste clients avec segmentation avancée
📊 Profils détaillés: historique, paiements, sites
💬 Notes internes et suivi commercial
📧 Communication directe et templates
```

### **4. Facturation (Phase 2)**
```
💰 Dashboard revenus: MRR, ARPU, churn rate
🧾 Génération factures automatique
📊 Rapports comptables exportables
🔄 Integration Stripe/PayPal
```

### **5. Monitoring (Phase 3)**
```
🌐 Status tous les sites en temps réel
📊 Analytics: trafic, conversions, performance
🚨 Alertes automatiques et escalation
📥 Backups et restauration
```

### **6. Templates (Phase 3)**
```
🎨 CRUD templates avec preview temps réel
📝 Versioning et changelog
🧪 A/B testing et métriques
📊 Analytics d'utilisation par template
```

## 🔧 API Architecture

### **REST API Structure**
```
/admin/api/v1/
├── auth/           # Authentication
├── dashboard/      # KPIs et overview
├── ai-queue/       # Queue IA management
├── customers/      # Customer management
├── billing/        # Invoices, subscriptions
├── sites/          # Site management
├── templates/      # Template CRUD
├── monitoring/     # Site health checks
├── analytics/      # Business metrics
├── campaigns/      # Email campaigns
└── settings/       # System configuration
```

### **Authentication & Permissions**
```javascript
// Roles hiérarchiques
const roles = {
    'super_admin': ['*'], // Tous droits
    'admin': ['read', 'write', 'delete'], // Presque tout
    'editor': ['read', 'write'], // Pas de delete
    'viewer': ['read'] // Read-only
};

// Permissions granulaires par module
const permissions = {
    'ai_queue': ['view', 'process', 'reject', 'stats'],
    'customers': ['view', 'edit', 'delete', 'export'],
    'billing': ['view', 'create_invoice', 'refund', 'export'],
    'sites': ['view', 'edit', 'delete', 'backup'],
    'templates': ['view', 'edit', 'create', 'delete', 'test'],
    'monitoring': ['view', 'configure_alerts', 'backup'],
    'analytics': ['view', 'export', 'configure'],
    'campaigns': ['view', 'create', 'send', 'delete'],
    'settings': ['view', 'edit', 'system']
};
```

## 🚀 Deployment & Infrastructure

### **Environment Structure**
```
Development → Staging → Production
     ↓           ↓          ↓
   SQLite    PostgreSQL  PostgreSQL + Redis
   Local     Cloud VM    Load Balanced
```

### **Monitoring & Alerts**
- **Application**: Health checks, error tracking
- **Database**: Query performance, disk usage
- **Business**: Revenue alerts, churn notifications
- **Security**: Failed logins, suspicious activity

## 📋 Development Phases

### **Phase 1 (Current): Queue IA**
- ✅ Database schema IA tables
- 🔄 Admin interface Queue IA
- 🔄 Wizard integration Step 4
- 🔄 Email notification system

### **Phase 2: Business Core**
- 👥 Customer management complet
- 💰 Système facturation automatique
- 📊 Analytics business basics
- 📧 Email campaigns basics

### **Phase 3: Operations**
- 🎨 Template management avancé
- 📊 Monitoring complet des sites
- ⚙️ Configuration système
- 🔧 API management

### **Phase 4: Growth & Scale**
- 🎯 Marketing automation
- 📞 Support système complet
- 🔐 Sécurité avancée
- 📈 Advanced analytics

---

**🎯 Vision**: Admin Portal complet pour gérer Locod-AI comme une vraie entreprise SaaS scalable et profitable.

**⚡ Next Step**: Développer Phase 1 (Queue IA) avec ce schema complet en place.