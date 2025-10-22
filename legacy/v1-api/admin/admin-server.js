/**
 * Admin Portal Server
 * Version: v1.1.1.9.2.4.1.7
 * 
 * Express server for admin portal with AI queue management
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const AIQueueAPI = require('./queue-api');

class AdminServer {
    constructor(port = 3081, dbPath = null) {
        this.app = express();
        this.port = port;
        this.queueAPI = new AIQueueAPI(dbPath);
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        // CORS for development
        this.app.use(cors({
            origin: ['http://localhost:3081', 'http://162.55.213.90:3081', 'http://162.55.213.90:3080'],
            credentials: true
        }));

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Security headers
        this.app.use((req, res, next) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            next();
        });

        // Logging
        this.app.use((req, res, next) => {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] ${req.method} ${req.url} - ${req.ip}`);
            next();
        });
    }

    setupRoutes() {
        // Serve static dashboard
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'dashboard.html'));
        });

        this.app.get('/admin', (req, res) => {
            res.sendFile(path.join(__dirname, 'dashboard.html'));
        });

        // API routes
        this.app.use('/admin', this.queueAPI.getRouter());

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'Admin Portal API',
                version: '1.1.1.9.2.4.1.7',
                timestamp: new Date().toISOString()
            });
        });

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Not Found',
                message: 'The requested resource was not found',
                path: req.originalUrl
            });
        });

        // Error handler
        this.app.use((error, req, res, next) => {
            console.error('Server error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
            });
        });
    }

    start() {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.port, (err) => {
                if (err) {
                    console.error('❌ Admin server failed to start:', err);
                    return reject(err);
                }

                console.log('🎛️  Admin Portal Server Started');
                console.log('================================');
                console.log(`🌐 URL: http://localhost:${this.port}`);
                console.log(`🚀 Health: http://localhost:${this.port}/health`);
                console.log(`📊 Dashboard: http://localhost:${this.port}/admin`);
                console.log('');
                console.log('🔐 Default admin credentials:');
                console.log('  Email: admin@locod.ai');
                console.log('  Password: admin123');
                console.log('');

                resolve(this.server);
            });
        });
    }

    stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    console.log('🛑 Admin server stopped');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

// Start server if run directly
if (require.main === module) {
    const port = process.env.PORT || 3082;
    const server = new AdminServer(port);
    
    server.start().catch(error => {
        console.error('Failed to start admin server:', error);
        process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
        console.log('Received SIGTERM, shutting down gracefully');
        await server.stop();
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        console.log('Received SIGINT, shutting down gracefully');
        await server.stop();
        process.exit(0);
    });
}

module.exports = AdminServer;