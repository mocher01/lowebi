# #100 - 🏗️ Portal v2.0 - Enterprise Architecture Rewrite

**Type:** Epic / Master Issue  
**Version:** v2.0.0  
**Priority:** Critical 🔴  
**Duration:** 6-8 weeks  

## 📋 Executive Summary

Complete architectural rewrite of the Website Generator portal from v1.x prototype to enterprise-grade v2.0 platform with NestJS backend, Next.js frontend, proper authentication, multi-tenancy, and scalable deployment system.

## 🎯 Context & Motivation

### Current v1.x State:
- ✅ **Working:** Core generator, wizard UI, config generation
- ❌ **Missing:** Authentication, multi-tenancy, deployment automation
- ❌ **Issues:** Monolithic code, no job queue, SQLite limitations

### v2.0 Vision:
Build a production-ready SaaS platform where customers can create, manage, and deploy websites with professional architecture and scalability.

## 🏛️ Architecture Overview

```
┌─────────────────────────────────────────┐
│         Next.js Frontend                 │
│    (Wizard, Mode Rapide, Admin)         │
└─────────────────────────────────────────┘
                    ↓
         [REST API + WebSockets]
                    ↓
┌─────────────────────────────────────────┐
│         NestJS Backend                   │
│    (JWT Auth, Business Logic)           │
└─────────────────────────────────────────┘
                    ↓
    ┌───────────────┼───────────────┐
    ↓               ↓               ↓
PostgreSQL    Bull Queue      Redis Cache
(Data)        (Jobs)          (Sessions)
                    ↓
           Docker Deployment
           (Website Containers)
```

## 🔧 Technology Stack

### Backend:
- **Framework:** NestJS (TypeScript)
- **Database:** PostgreSQL + TypeORM
- **Queue:** Bull (Redis-based)
- **Auth:** JWT + Passport.js
- **Validation:** class-validator
- **API Docs:** Swagger/OpenAPI
- **Real-time:** Socket.io

### Frontend:
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State:** Zustand
- **Forms:** React Hook Form
- **API Client:** Axios + React Query

### DevOps:
- **Containers:** Docker
- **Orchestration:** Docker Compose → Kubernetes
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus + Grafana

## 📋 Core Features

### 1. Customer Portal
- User registration/login
- Create sites (Wizard + Mode Rapide)
- Manage deployed sites
- View deployment logs
- Billing/subscription management

### 2. Admin Dashboard
- Manage all customers
- Monitor all sites
- AI content queue
- System health metrics
- Revenue analytics

### 3. Deployment System
- Queue-based processing
- Real-time progress
- Docker API integration
- Automatic port allocation
- Health checks

### 4. Multi-tenancy
- Complete data isolation
- Customer-specific quotas
- Usage tracking
- Resource limits

## ✅ Acceptance Criteria

### Phase 1 - Foundation (Weeks 1-4)
- [ ] NestJS backend running with PostgreSQL
- [ ] Next.js frontend with wizard recreated
- [ ] JWT authentication working
- [ ] Multi-tenant database structure
- [ ] API endpoints matching v1 functionality

### Phase 2 - Core Features (Weeks 4-6)
- [ ] Deployment queue processing sites
- [ ] Real-time logs via WebSockets
- [ ] Admin dashboard functional
- [ ] Customer isolation verified
- [ ] Mode Rapide working end-to-end

### Phase 3 - Production (Weeks 6-8)
- [ ] Data migration from v1
- [ ] All tests passing (unit + e2e)
- [ ] Documentation complete
- [ ] Docker deployment ready
- [ ] Monitoring configured

## 📊 Sub-Issues Breakdown

### Backend Development
- [ ] #101 - NestJS project setup with TypeScript
- [ ] #102 - PostgreSQL database design and setup
- [ ] #103 - JWT authentication implementation
- [ ] #104 - Customer module (CRUD + multi-tenancy)
- [ ] #105 - Sites module (CRUD + config management)
- [ ] #106 - Deployment module (Queue + Docker API)
- [ ] #107 - Admin module (Dashboard + Analytics)
- [ ] #108 - WebSocket implementation for real-time

### Frontend Development
- [ ] #109 - Next.js project setup with TypeScript
- [ ] #110 - Authentication flow (Login/Register)
- [ ] #111 - Wizard components (8 steps)
- [ ] #112 - Mode Rapide interface
- [ ] #113 - Customer dashboard
- [ ] #114 - Admin dashboard
- [ ] #115 - Real-time deployment logs UI

### Integration & Testing
- [ ] #116 - API integration layer
- [ ] #117 - End-to-end testing setup
- [ ] #118 - Data migration scripts
- [ ] #119 - Load testing
- [ ] #120 - Security audit

### DevOps & Deployment
- [ ] #121 - Docker configuration
- [ ] #122 - CI/CD pipeline
- [ ] #123 - Production deployment
- [ ] #124 - Monitoring setup
- [ ] #125 - Backup strategy

## 🚀 Implementation Phases

### Week 1-2: Foundation
- Setup projects (NestJS + Next.js)
- Database design
- Basic authentication

### Week 3-4: Core Development
- Customer portal features
- Site management
- Deployment queue

### Week 5-6: Admin & Polish
- Admin dashboard
- Real-time features
- Testing

### Week 7-8: Production
- Migration tools
- Deployment
- Documentation

## ⚠️ Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data migration fails | High | Comprehensive backup, test migrations |
| Learning curve (NestJS/Next.js) | Medium | Start with simpler features, documentation |
| Deployment complexity | Medium | Incremental rollout, feature flags |
| Performance issues | Low | Load testing, caching strategy |

## 📈 Success Metrics

- **Performance:** < 200ms API response time
- **Reliability:** 99.9% uptime
- **Scalability:** Handle 100+ concurrent users
- **Deployment:** < 30 seconds site creation
- **Migration:** 100% data preserved

## 🔄 Migration Plan

1. **Parallel Development:** Build v2 while v1 runs
2. **Feature Freeze:** v1 receives only critical fixes
3. **Beta Testing:** Selected customers test v2
4. **Data Export:** Export all v1 data
5. **Migration:** Import to v2 with validation
6. **Cutover:** Switch DNS/proxy to v2
7. **Rollback Plan:** Keep v1 for 30 days

## 📝 Notes

- Preserve all v1 business logic that works
- Maintain API compatibility where possible
- Focus on architecture, not new features
- Customer communication critical

## 🔗 References

- [ROADMAP v2.0](../docs/project/ROADMAP-v2.md)
- [Current v1 Issues](#14-#43)
- [Architecture Diagram](../docs/architecture-v2.png)

---

**Created:** August 2024  
**Owner:** @mocher01  
**Status:** Planning  
**Target Release:** v2.0.0