/**
 * Admin AI Queue API Endpoints
 * Version: v1.1.1.9.2.4.1.7
 * 
 * API endpoints for managing AI generation queue
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const AdminAuth = require('./auth');
const ImageProcessor = require('../image-processor');

class AIQueueAPI {
    constructor(dbPath = null) {
        this.dbPath = dbPath || path.join(__dirname, '../../database/logen-v1.db');
        this.auth = new AdminAuth(this.dbPath);
        this.router = express.Router();
        this.setupRoutes();
    }

    setupRoutes() {
        // Authentication routes
        this.router.post('/auth/login', this.login.bind(this));
        this.router.post('/auth/logout', this.logout.bind(this));

        // AI Queue management routes
        this.router.get('/queue', this.auth.requireAuth(['ai_queue_view']), this.getQueue.bind(this));
        this.router.get('/queue/:id', this.auth.requireAuth(['ai_queue_view']), this.getRequest.bind(this));
        this.router.put('/queue/:id/assign', this.auth.requireAuth(['ai_queue_process']), this.assignRequest.bind(this));
        this.router.put('/queue/:id/start', this.auth.requireAuth(['ai_queue_process']), this.startProcessing.bind(this));
        this.router.put('/queue/:id/complete', this.auth.requireAuth(['ai_queue_process']), this.completeRequest.bind(this));
        this.router.put('/queue/:id/reject', this.auth.requireAuth(['ai_queue_process']), this.rejectRequest.bind(this));
        this.router.delete('/queue/:id', this.auth.requireAuth(['ai_queue_delete']), this.deleteRequest.bind(this));

        // Dashboard stats
        this.router.get('/dashboard/stats', this.auth.requireAuth(['ai_queue_view']), this.getDashboardStats.bind(this));
        
        // User-facing routes (no auth required)
        this.router.post('/queue/create', this.createRequest.bind(this));
        this.router.get('/status/:id', this.getRequestStatus.bind(this));
        this.router.get('/request/:id', this.getPublicRequestDetails.bind(this));
    }

    /**
     * Admin login
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;
            
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password required' });
            }

            const result = await this.auth.authenticate(
                email, 
                password, 
                req.ip, 
                req.get('User-Agent')
            );

            if (result.success) {
                res.json({
                    success: true,
                    token: result.token,
                    sessionId: result.sessionId,
                    user: result.user
                });
            } else {
                res.status(401).json({
                    error: result.error,
                    code: result.code,
                    attemptsLeft: result.attemptsLeft,
                    lockoutUntil: result.lockoutUntil
                });
            }
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Admin logout
     */
    async logout(req, res) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(400).json({ error: 'Token required for logout' });
            }

            const token = authHeader.substring(7);
            const sessionId = req.body.sessionId;

            const result = await this.auth.logout(token, sessionId);
            res.json({ success: result.success });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get AI requests queue with filtering and pagination
     */
    getQueue(req, res) {
        const db = new sqlite3.Database(this.dbPath);
        
        const {
            status = '',
            request_type = '',
            admin_id = '',
            page = 1,
            limit = 20,
            sort_by = 'created_at',
            sort_order = 'DESC'
        } = req.query;

        // Build WHERE clause
        const conditions = [];
        const params = [];

        if (status) {
            conditions.push('ai.status = ?');
            params.push(status);
        }

        if (request_type) {
            conditions.push('ai.request_type = ?');
            params.push(request_type);
        }

        if (admin_id) {
            conditions.push('ai.admin_id = ?');
            params.push(admin_id);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Build query
        const query = `
            SELECT 
                ai.*,
                c.name as customer_name,
                c.email as customer_email,
                s.name as site_name,
                s.domain as site_domain,
                au.name as admin_name,
                au.email as admin_email
            FROM ai_requests ai
            LEFT JOIN customers c ON ai.customer_id = c.id
            LEFT JOIN sites s ON ai.site_id = s.id
            LEFT JOIN admin_users au ON ai.admin_id = au.id
            ${whereClause}
            ORDER BY ${sort_by} ${sort_order}
            LIMIT ? OFFSET ?
        `;

        params.push(parseInt(limit), offset);

        db.all(query, params, (err, requests) => {
            if (err) {
                console.error('Queue query error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            // Get total count
            const countQuery = `SELECT COUNT(*) as total FROM ai_requests ai ${whereClause}`;
            const countParams = params.slice(0, -2); // Remove limit and offset

            db.get(countQuery, countParams, (err, countResult) => {
                db.close();
                
                if (err) {
                    console.error('Count query error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                res.json({
                    requests: requests.map(req => ({
                        ...req,
                        request_data: JSON.parse(req.request_data),
                        permissions: req.permissions ? JSON.parse(req.permissions) : []
                    })),
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: countResult.total,
                        totalPages: Math.ceil(countResult.total / parseInt(limit))
                    }
                });
            });
        });
    }

    /**
     * Get single AI request details
     */
    getRequest(req, res) {
        const db = new sqlite3.Database(this.dbPath);
        const requestId = parseInt(req.params.id);

        const query = `
            SELECT 
                ai.*,
                c.name as customer_name,
                c.email as customer_email,
                s.name as site_name,
                s.domain as site_domain,
                au.name as admin_name,
                au.email as admin_email
            FROM ai_requests ai
            LEFT JOIN customers c ON ai.customer_id = c.id
            LEFT JOIN sites s ON ai.site_id = s.id
            LEFT JOIN admin_users au ON ai.admin_id = au.id
            WHERE ai.id = ?
        `;

        db.get(query, [requestId], (err, request) => {
            if (err) {
                console.error('Request query error:', err);
                db.close();
                return res.status(500).json({ error: 'Database error' });
            }

            if (!request) {
                db.close();
                return res.status(404).json({ error: 'Request not found' });
            }

            // Get request history
            db.all(
                'SELECT * FROM ai_request_history WHERE request_id = ? ORDER BY created_at DESC',
                [requestId],
                (err, history) => {
                    db.close();
                    
                    if (err) {
                        console.error('History query error:', err);
                        return res.status(500).json({ error: 'Database error' });
                    }

                    res.json({
                        ...request,
                        request_data: JSON.parse(request.request_data),
                        generated_content: request.generated_content ? JSON.parse(request.generated_content) : null,
                        history: history.map(h => ({
                            ...h,
                            old_values: h.old_values ? JSON.parse(h.old_values) : null,
                            new_values: h.new_values ? JSON.parse(h.new_values) : null
                        }))
                    });
                }
            );
        });
    }

    /**
     * Create new AI request (from wizard)
     */
    createRequest(req, res) {
        const {
            customer_id,
            site_id,
            request_type,
            business_type,
            terminology,
            request_data,
            wizard_session_id,
            estimated_cost = 2.00
        } = req.body;

        if (!customer_id || !request_type || !business_type || !request_data) {
            return res.status(400).json({ 
                error: 'Missing required fields: customer_id, request_type, business_type, request_data' 
            });
        }

        const db = new sqlite3.Database(this.dbPath);
        
        const insertQuery = `
            INSERT INTO ai_requests (
                customer_id, site_id, request_type, business_type, terminology, 
                request_data, wizard_session_id, estimated_cost, client_ip, user_agent
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            customer_id,
            site_id,
            request_type,
            business_type,
            terminology,
            JSON.stringify(request_data),
            wizard_session_id,
            estimated_cost,
            req.ip,
            req.get('User-Agent')
        ];

        db.run(insertQuery, params, function(err) {
            db.close();
            
            if (err) {
                console.error('Create request error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            res.json({
                success: true,
                request_id: this.lastID,
                message: 'AI request created successfully',
                estimated_completion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            });
        });
    }

    /**
     * Get dashboard statistics
     */
    getDashboardStats(req, res) {
        const db = new sqlite3.Database(this.dbPath);
        
        const queries = {
            total_requests: 'SELECT COUNT(*) as count FROM ai_requests',
            pending_requests: 'SELECT COUNT(*) as count FROM ai_requests WHERE status = "pending"',
            processing_requests: 'SELECT COUNT(*) as count FROM ai_requests WHERE status = "processing"',
            completed_today: `SELECT COUNT(*) as count FROM ai_requests WHERE status = "completed" AND date(completed_at) = date('now')`,
            revenue_today: `SELECT COALESCE(SUM(actual_cost), 0) as total FROM ai_requests WHERE status = "completed" AND date(completed_at) = date('now')`,
            avg_processing_time: `SELECT AVG(julianday(completed_at) - julianday(started_at)) * 24 * 60 as minutes FROM ai_requests WHERE status = "completed" AND started_at IS NOT NULL AND completed_at IS NOT NULL`
        };

        const stats = {};
        const queryKeys = Object.keys(queries);
        let completed = 0;

        for (const key of queryKeys) {
            db.get(queries[key], (err, result) => {
                if (err) {
                    console.error(`Stats query error for ${key}:`, err);
                    stats[key] = 0;
                } else {
                    stats[key] = result.count !== undefined ? result.count : 
                                 result.total !== undefined ? result.total : 
                                 result.minutes !== undefined ? Math.round(result.minutes) : 0;
                }

                completed++;
                if (completed === queryKeys.length) {
                    // Get recent activity
                    db.all(
                        `SELECT 
                            ai.id, ai.status, ai.request_type, ai.created_at, ai.completed_at,
                            c.name as customer_name
                         FROM ai_requests ai
                         LEFT JOIN customers c ON ai.customer_id = c.id
                         ORDER BY ai.created_at DESC 
                         LIMIT 10`,
                        (err, recentActivity) => {
                            db.close();
                            
                            if (err) {
                                console.error('Recent activity query error:', err);
                                recentActivity = [];
                            }

                            res.json({
                                stats,
                                recent_activity: recentActivity
                            });
                        }
                    );
                }
            });
        }
    }

    /**
     * Assign request to admin
     */
    assignRequest(req, res) {
        const requestId = parseInt(req.params.id);
        const adminId = req.admin.id;

        this.updateRequestStatus(requestId, 'assigned', adminId, req, res, {
            assigned_at: new Date().toISOString(),
            admin_id: adminId
        });
    }

    /**
     * Start processing request
     */
    startProcessing(req, res) {
        const requestId = parseInt(req.params.id);
        const adminId = req.admin.id;

        this.updateRequestStatus(requestId, 'processing', adminId, req, res, {
            started_at: new Date().toISOString()
        });
    }

    /**
     * Complete AI request
     */
    async completeRequest(req, res) {
        const requestId = parseInt(req.params.id);
        const adminId = req.admin.id;
        const { generated_content, actual_cost, admin_notes, content_type } = req.body;

        if (!generated_content) {
            return res.status(400).json({ error: 'Generated content is required' });
        }

        // Get the request to know the site_id
        const db = new sqlite3.Database(this.dbPath);
        
        db.get('SELECT * FROM ai_requests WHERE id = ?', [requestId], async (err, request) => {
            if (err) {
                db.close();
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (!request) {
                db.close();
                return res.status(404).json({ error: 'Request not found' });
            }
            
            db.close();
            
            let processedContent = generated_content;
            
            // If it's an image request, process the images
            if (content_type === 'images' || request.request_type === 'images') {
                try {
                    const imageProcessor = new ImageProcessor();
                    const siteId = request.site_id;
                    
                    // Process and rename images automatically
                    const processedImages = await imageProcessor.processImages(siteId, generated_content);
                    
                    // Update site configuration with image filenames
                    await imageProcessor.updateSiteConfig(siteId, processedImages);
                    
                    // Store processed filenames in the database
                    processedContent = processedImages;
                } catch (error) {
                    console.error('Image processing error:', error);
                    return res.status(500).json({ error: 'Image processing failed', details: error.message });
                }
            }
            
            // Update request status
            this.updateRequestStatus(requestId, 'completed', adminId, req, res, {
                completed_at: new Date().toISOString(),
                generated_content: JSON.stringify(processedContent),
                actual_cost: actual_cost,
                admin_notes: admin_notes,
                billing_status: 'pending'
            });
        });
    }

    /**
     * Reject AI request
     */
    rejectRequest(req, res) {
        const requestId = parseInt(req.params.id);
        const adminId = req.admin.id;
        const { admin_notes } = req.body;

        this.updateRequestStatus(requestId, 'rejected', adminId, req, res, {
            admin_notes: admin_notes
        });
    }

    /**
     * Delete AI request
     */
    deleteRequest(req, res) {
        const requestId = parseInt(req.params.id);
        const db = new sqlite3.Database(this.dbPath);

        db.run('DELETE FROM ai_requests WHERE id = ?', [requestId], function(err) {
            db.close();
            
            if (err) {
                console.error('Delete request error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Request not found' });
            }

            res.json({ success: true, message: 'Request deleted successfully' });
        });
    }

    /**
     * Get request status for user
     */
    getRequestStatus(req, res) {
        const requestId = parseInt(req.params.id);
        const db = new sqlite3.Database(this.dbPath);

        db.get(
            'SELECT id, status, created_at, started_at, completed_at, estimated_cost, actual_cost FROM ai_requests WHERE id = ?',
            [requestId],
            (err, request) => {
                db.close();
                
                if (err) {
                    console.error('Status query error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                if (!request) {
                    return res.status(404).json({ error: 'Request not found' });
                }

                res.json(request);
            }
        );
    }

    /**
     * Helper method to update request status
     */
    updateRequestStatus(requestId, newStatus, adminId, req, res, additionalFields = {}) {
        const db = new sqlite3.Database(this.dbPath);

        // First get current request
        db.get('SELECT * FROM ai_requests WHERE id = ?', [requestId], (err, currentRequest) => {
            if (err) {
                console.error('Get request error:', err);
                db.close();
                return res.status(500).json({ error: 'Database error' });
            }

            if (!currentRequest) {
                db.close();
                return res.status(404).json({ error: 'Request not found' });
            }

            // Prepare update fields
            const updateFields = { status: newStatus, ...additionalFields };
            const setClause = Object.keys(updateFields).map(key => `${key} = ?`).join(', ');
            const values = Object.values(updateFields);

            // Update request
            db.run(
                `UPDATE ai_requests SET ${setClause} WHERE id = ?`,
                [...values, requestId],
                function(err) {
                    if (err) {
                        console.error('Update request error:', err);
                        db.close();
                        return res.status(500).json({ error: 'Database error' });
                    }

                    // Add to history
                    db.run(
                        'INSERT INTO ai_request_history (request_id, old_status, new_status, changed_by, old_values, new_values) VALUES (?, ?, ?, ?, ?, ?)',
                        [
                            requestId,
                            currentRequest.status,
                            newStatus,
                            adminId,
                            JSON.stringify({ status: currentRequest.status }),
                            JSON.stringify(updateFields)
                        ],
                        (err) => {
                            if (err) {
                                console.error('History insert error:', err);
                            }

                            // Log activity
                            db.run(
                                'INSERT INTO admin_activity_log (admin_id, action, resource_type, resource_id, new_values, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
                                [
                                    adminId,
                                    `ai_request_${newStatus}`,
                                    'ai_request',
                                    requestId,
                                    JSON.stringify(updateFields),
                                    req.ip,
                                    req.get('User-Agent')
                                ],
                                () => {
                                    db.close();
                                    res.json({ success: true, message: `Request ${newStatus} successfully` });
                                }
                            );
                        }
                    );
                }
            );
        });
    }

    /**
     * Get public request details (no auth required)
     * Returns request info including generated content for completed requests
     */
    getPublicRequestDetails(req, res) {
        const requestId = parseInt(req.params.id);

        if (!requestId) {
            return res.status(400).json({ error: 'Invalid request ID' });
        }

        const db = new sqlite3.Database(this.dbPath);
        
        db.get(
            `SELECT id, status, request_type, business_type, terminology, 
                    created_at, completed_at, estimated_cost, actual_cost,
                    generated_content, request_data
             FROM ai_requests 
             WHERE id = ?`,
            [requestId],
            (err, row) => {
                if (err) {
                    db.close();
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                if (!row) {
                    db.close();
                    return res.status(404).json({ error: 'Request not found' });
                }

                db.close();
                
                // Return public information
                res.json({
                    id: row.id,
                    status: row.status,
                    request_type: row.request_type,
                    business_type: row.business_type,
                    terminology: row.terminology,
                    created_at: row.created_at,
                    completed_at: row.completed_at,
                    estimated_cost: row.estimated_cost,
                    actual_cost: row.actual_cost,
                    generated_content: row.generated_content,
                    request_data: row.request_data
                });
            }
        );
    }

    getRouter() {
        return this.router;
    }
}

module.exports = AIQueueAPI;