# 📋 Issue #15 - Admin AI Queue System (Phase 1)

**Version:** v1.1.1.9.2.4.1.7  
**Type:** Admin Tool - AI Management System  
**Priority:** Medium 🔥  
**Status:** Open  
**Architecture:** See `/docs/admin/ADMIN-PORTAL-ARCHITECTURE.md`  

## 📊 User Story

**En tant qu'administrateur Locod-AI,**  
**Je veux pouvoir traiter les demandes de génération IA des utilisateurs via une interface dédiée,**  
**Afin de fournir un service de génération expert sans coût API supplémentaire.**

## 🎯 Acceptance Criteria

### ✅ Critères fonctionnels

1. **Interface admin dédiée**
   - Dashboard avec liste des demandes en attente
   - Détails complets de chaque demande (site, business type, terminologie)
   - Statuts: En attente, En cours, Terminé, Rejeté
   - Tri et filtrage par date, type, statut

2. **Workflow de traitement**
   - Bouton "Traiter avec Claude Code" pour chaque demande
   - Zone de texte pour coller la réponse générée
   - Validation et formatage automatique de la réponse
   - Publication automatique vers le wizard utilisateur

3. **Système de notifications**
   - Email automatique à l'utilisateur quand demande traitée
   - Notifications admin pour nouvelles demandes
   - Historique des actions et timestamps

4. **Gestion des utilisateurs**
   - Mise en pause du wizard utilisateur pendant traitement
   - Lien de reprise du wizard envoyé par email
   - Gestion des timeouts (24h max)

### ✅ Critères techniques

5. **Base de données**
   - Table `ai_requests` avec tous les champs nécessaires
   - Relation avec table `sites` et `customers`
   - Index pour performance sur queries fréquentes

6. **API endpoints**
   - POST `/admin/ai/queue/create` - Créer demande depuis wizard
   - GET `/admin/ai/queue` - Liste demandes admin
   - PUT `/admin/ai/queue/:id/process` - Traiter une demande
   - GET `/api/ai/status/:id` - Statut pour utilisateur

7. **Sécurité et authentification**
   - Interface admin protégée (authentification requise)
   - Logging de toutes les actions admin
   - Validation des données utilisateur

8. **Integration wizard**
   - Bouton "Locod-AI Expert" dans Step 4
   - Modal d'explication du processus
   - Redirection vers email de confirmation

## 🖥️ UI/UX Design

### Admin Dashboard
```
┌─────────────────────────────────────────────────┐
│ 🎛️ Admin Locod-AI - AI Generation Queue        │
├─────────────────────────────────────────────────┤
│ 📊 Statistiques: 3 en attente | 12 traitées    │
│                                                 │
│ 🔄 Demandes en attente                         │
│ ┌─────────────────────────────────────────────┐ │
│ │ #2025-001 | Services Traduction            │ │
│ │ Site: qalyarab-tech | Créé: il y a 2h      │ │
│ │ Business: Translation | Terminologie: Services│ │
│ │ [📋 Voir détails] [🤖 Traiter] [❌ Rejeter] │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ⏳ En cours de traitement                      │
│ ┌─────────────────────────────────────────────┐ │
│ │ #2025-002 | Spécialités Restaurant         │ │
│ │ Site: bistro-marine | Démarré: il y a 30min│ │
│ │ [📝 Continuer] [✅ Terminer] [⏸️ Pause]     │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ✅ Traitées aujourd'hui: 5 | ⏰ Temps moyen: 15min│
└─────────────────────────────────────────────────┘
```

### Modal de traitement
```
┌─────────────────────────────────────────────────┐
│ 🤖 Traitement IA - Demande #2025-001           │
├─────────────────────────────────────────────────┤
│ 📋 Détails de la demande:                      │
│ • Site: qalyarab-tech                          │
│ • Business: Services de traduction             │
│ • Terminologie: "Services"                     │
│ • Email: client@example.com                    │
│                                                 │
│ 💬 Prompt Claude Code:                         │
│ ┌─────────────────────────────────────────────┐ │
│ │ Génère 3 services pour une entreprise de   │ │
│ │ traduction nommée "qalyarab-tech":          │ │
│ │ [Prompt auto-généré, copiable]             │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ✨ Réponse Claude Code:                        │
│ ┌─────────────────────────────────────────────┐ │
│ │ [Textarea pour coller la réponse générée]  │ │
│ │                                             │ │
│ │                                             │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [🔄 Démarrer traitement] [✅ Publier] [❌ Annuler]│
└─────────────────────────────────────────────────┘
```

## 🔧 Technical Implementation

### Database Schema (from Architecture)
```sql
-- Utilise le schéma complet défini dans ADMIN-PORTAL-ARCHITECTURE.md
CREATE TABLE ai_requests (
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

-- Tables de support nécessaires
CREATE TABLE admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    password_hash TEXT NOT NULL,
    last_login DATETIME,
    permissions TEXT, -- JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active'
);

-- Index pour performance
CREATE INDEX idx_ai_requests_status ON ai_requests(status);
CREATE INDEX idx_ai_requests_customer ON ai_requests(customer_id);
CREATE INDEX idx_ai_requests_created ON ai_requests(created_at);
```

### API Endpoints
```javascript
// Création demande depuis wizard
app.post('/admin/ai/queue/create', async (req, res) => {
    const request = await createAIRequest({
        wizardSessionId: req.body.sessionId,
        customerEmail: req.body.email,
        requestType: 'services',
        requestData: req.body.data
    });
    
    // Envoyer email confirmation
    await sendConfirmationEmail(request);
    
    res.json({ requestId: request.id, estimatedTime: '2-24h' });
});

// Interface admin
app.get('/admin/ai/queue', requireAuth, async (req, res) => {
    const requests = await getAIRequests({
        status: req.query.status,
        orderBy: 'created_at DESC'
    });
    
    res.json({ requests, stats: getQueueStats() });
});

// Traitement admin
app.put('/admin/ai/queue/:id/process', requireAuth, async (req, res) => {
    const request = await processAIRequest(req.params.id, {
        generatedContent: req.body.content,
        adminNotes: req.body.notes
    });
    
    // Notifier utilisateur
    await notifyUserCompletion(request);
    
    res.json({ success: true });
});
```

### Integration Wizard
```javascript
// Dans Step 4 wizard
function requestAIGeneration() {
    const modal = showModal({
        title: '🤖 Locod-AI Expert',
        content: `
            <h3>Génération par expert IA</h3>
            <p>🎯 Nos experts IA vont créer des services personnalisés pour votre domaine</p>
            <p>⏱️ Délai: 2-24 heures</p>
            <p>💰 Coût: 2,00€</p>
            <p>📧 Vous recevrez un email quand c'est prêt</p>
        `,
        buttons: [
            { text: 'Annuler', action: 'cancel' },
            { text: 'Demander génération', action: 'confirm' }
        ]
    });
    
    if (await modal === 'confirm') {
        const response = await fetch('/admin/ai/queue/create', {
            method: 'POST',
            body: JSON.stringify({
                sessionId: wizardData.sessionId,
                email: wizardData.email,
                data: {
                    siteName: wizardData.siteName,
                    businessType: wizardData.businessType,
                    terminology: wizardData.serviceTerminology
                }
            })
        });
        
        showSuccessMessage('Demande envoyée ! Vous recevrez un email dans 2-24h');
        pauseWizard();
    }
}
```

## 🧪 Test Scenarios

### Test Cases
1. **Création demande**
   - ✅ Demande créée depuis wizard Step 4
   - ✅ Email confirmation envoyé à l'utilisateur
   - ✅ Wizard mis en pause correctement

2. **Interface Admin**
   - ✅ Liste des demandes avec filtrage
   - ✅ Détails complets de chaque demande
   - ✅ Changement de statut fonctionnel

3. **Workflow de traitement**
   - ✅ Prompt auto-généré pour Claude Code
   - ✅ Parsing et validation de la réponse
   - ✅ Publication vers wizard utilisateur

4. **Notifications**
   - ✅ Email de confirmation à la création
   - ✅ Email de completion au traitement
   - ✅ Lien de reprise wizard fonctionnel

### E2E Test Flow
```javascript
// tests/specs/admin-ai-queue.spec.js
test('Complete AI queue workflow', async ({ page }) => {
    // 1. Utilisateur demande génération IA
    await page.goto('/wizard?step=4');
    await page.click('[data-testid="ai-generation-btn"]');
    await page.click('[data-testid="confirm-ai-request"]');
    
    // 2. Admin traite la demande
    await page.goto('/admin/ai/queue');
    await page.click('[data-testid="process-request-1"]');
    await page.fill('[data-testid="ai-response"]', mockAIResponse);
    await page.click('[data-testid="publish-response"]');
    
    // 3. Utilisateur reprend wizard
    await page.goto('/wizard/resume?token=test-token');
    await expect(page.locator('[data-testid="services-list"]'))
        .toContainText('Service généré par IA');
});
```

## 📊 Success Metrics

### Functional KPIs
- **Request completion rate**: >95% des demandes traitées sous 24h
- **User satisfaction**: Score de 4.5+ sur service de génération IA
- **Admin efficiency**: <15min temps moyen de traitement par demande
- **Revenue impact**: 2€ per request, target 50+ requests/month

### Technical KPIs  
- **Admin page load time**: <1s pour dashboard
- **Queue processing**: Support 100+ demandes simultanées
- **Email delivery**: 100% des notifications envoyées
- **System uptime**: 99.9% availability

## 🔗 Dependencies

### Prerequisites
- ✅ Wizard Step 4 structure (Issue #14)
- ✅ Customer Portal database
- ✅ Email system configured
- ✅ Admin authentication system

### Integration Points
- **Wizard Step 4**: Bouton "Locod-AI Expert"
- **Email System**: Notifications automatiques
- **Customer Portal**: Database et authentification admin
- **Payment System**: Facturation 2€ par demande (future)

## 🚀 Definition of Done

- [ ] **Database**: Table ai_requests avec tous les champs
- [ ] **Admin Interface**: Dashboard complet avec CRUD operations
- [ ] **Wizard Integration**: Bouton et modal dans Step 4
- [ ] **Email System**: Templates et envoi automatique
- [ ] **API Endpoints**: Toutes les routes admin et utilisateur
- [ ] **Authentication**: Protection admin interface
- [ ] **Testing**: Suite E2E complète du workflow
- [ ] **Documentation**: Guide admin d'utilisation
- [ ] **Deployment**: Déployé et testé sur serveur production

---

**🎯 Business Value**: Service premium de génération IA sans coût API, utilisant l'abonnement Claude existant pour maximiser la rentabilité.

**⚡ Ready for Parallel Development**: Peut être développé indépendamment du Step 4 wizard.