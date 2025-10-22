/**
 * Admin Authentication System
 * Version: v1.1.1.9.2.4.1.7
 * 
 * Handles authentication, password hashing, and session management for admin portal
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class AdminAuth {
    constructor(dbPath = null) {
        this.dbPath = dbPath || path.join(__dirname, '../../database/logen-v1.db');
        this.JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'locod-ai-admin-secret-change-in-production';
        this.JWT_EXPIRES_IN = process.env.ADMIN_JWT_EXPIRES || '24h';
        this.MAX_LOGIN_ATTEMPTS = 5;
        this.LOCKOUT_HOURS = 1;
    }

    /**
     * Hash a password using bcrypt-style crypto
     */
    hashPassword(password) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
        return `${salt}:${hash}`;
    }

    /**
     * Verify a password against a hash
     */
    verifyPassword(password, storedHash) {
        try {
            const [salt, hash] = storedHash.split(':');
            const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
            return hash === verifyHash;
        } catch (error) {
            return false;
        }
    }

    /**
     * Generate JWT token for admin user
     */
    generateToken(adminUser) {
        const payload = {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
            role: adminUser.role,
            permissions: JSON.parse(adminUser.permissions || '[]')
        };

        return jwt.sign(payload, this.JWT_SECRET, {
            expiresIn: this.JWT_EXPIRES_IN,
            issuer: 'locod-ai-admin'
        });
    }

    /**
     * Verify and decode JWT token
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, this.JWT_SECRET);
        } catch (error) {
            return null;
        }
    }

    /**
     * Check if admin user is locked out
     */
    isLockedOut(adminUser) {
        if (!adminUser.locked_until) return false;
        
        const lockoutTime = new Date(adminUser.locked_until);
        const now = new Date();
        
        return now < lockoutTime;
    }

    /**
     * Authenticate admin user
     */
    async authenticate(email, password, ipAddress = null, userAgent = null) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    return reject(new Error('Database connection failed'));
                }

                // Get admin user with current failed attempts
                db.get(
                    'SELECT * FROM admin_users WHERE email = ? AND status = ?',
                    [email, 'active'],
                    (err, user) => {
                        if (err) {
                            db.close();
                            return reject(new Error('Database query failed'));
                        }

                        if (!user) {
                            db.close();
                            return resolve({ success: false, error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
                        }

                        // Check if account is locked
                        if (this.isLockedOut(user)) {
                            db.close();
                            return resolve({ 
                                success: false, 
                                error: 'Account temporarily locked due to too many failed attempts', 
                                code: 'ACCOUNT_LOCKED',
                                lockoutUntil: user.locked_until
                            });
                        }

                        // Verify password
                        if (!this.verifyPassword(password, user.password_hash)) {
                            // Increment failed attempts
                            const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
                            let lockoutUntil = null;

                            // Lock account if max attempts reached
                            if (newFailedAttempts >= this.MAX_LOGIN_ATTEMPTS) {
                                lockoutUntil = new Date(Date.now() + (this.LOCKOUT_HOURS * 60 * 60 * 1000)).toISOString();
                            }

                            db.run(
                                'UPDATE admin_users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?',
                                [newFailedAttempts, lockoutUntil, user.id],
                                (err) => {
                                    db.close();
                                    if (err) {
                                        return reject(new Error('Failed to update login attempts'));
                                    }

                                    const attemptsLeft = this.MAX_LOGIN_ATTEMPTS - newFailedAttempts;
                                    const response = { 
                                        success: false, 
                                        error: 'Invalid credentials',
                                        code: 'INVALID_CREDENTIALS'
                                    };

                                    if (lockoutUntil) {
                                        response.error = 'Account locked due to too many failed attempts';
                                        response.code = 'ACCOUNT_LOCKED';
                                        response.lockoutUntil = lockoutUntil;
                                    } else if (attemptsLeft > 0) {
                                        response.attemptsLeft = attemptsLeft;
                                    }

                                    return resolve(response);
                                }
                            );
                            return;
                        }

                        // Successful login - reset failed attempts and update last login
                        db.run(
                            'UPDATE admin_users SET failed_login_attempts = 0, locked_until = NULL, last_login = ? WHERE id = ?',
                            [new Date().toISOString(), user.id],
                            (err) => {
                                if (err) {
                                    db.close();
                                    return reject(new Error('Failed to update login time'));
                                }

                                // Create session record
                                const sessionId = crypto.randomUUID();
                                const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString(); // 24h

                                db.run(
                                    'INSERT INTO admin_sessions (id, admin_id, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
                                    [sessionId, user.id, expiresAt, ipAddress, userAgent],
                                    (err) => {
                                        if (err) {
                                            console.error('Failed to create session record:', err);
                                        }

                                        // Log successful login
                                        db.run(
                                            'INSERT INTO admin_activity_log (admin_id, action, ip_address, user_agent) VALUES (?, ?, ?, ?)',
                                            [user.id, 'login', ipAddress, userAgent],
                                            () => {
                                                db.close();

                                                // Generate JWT token
                                                const token = this.generateToken(user);

                                                resolve({
                                                    success: true,
                                                    token,
                                                    sessionId,
                                                    user: {
                                                        id: user.id,
                                                        email: user.email,
                                                        name: user.name,
                                                        role: user.role,
                                                        permissions: JSON.parse(user.permissions || '[]')
                                                    }
                                                });
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    }
                );
            });
        });
    }

    /**
     * Logout admin user
     */
    async logout(token, sessionId = null) {
        return new Promise((resolve, reject) => {
            try {
                const decoded = this.verifyToken(token);
                if (!decoded) {
                    return resolve({ success: false, error: 'Invalid token' });
                }

                const db = new sqlite3.Database(this.dbPath, (err) => {
                    if (err) {
                        return reject(new Error('Database connection failed'));
                    }

                    // Deactivate session if sessionId provided
                    if (sessionId) {
                        db.run(
                            'UPDATE admin_sessions SET is_active = 0 WHERE id = ? AND admin_id = ?',
                            [sessionId, decoded.id],
                            () => {
                                // Log logout
                                db.run(
                                    'INSERT INTO admin_activity_log (admin_id, action) VALUES (?, ?)',
                                    [decoded.id, 'logout'],
                                    () => {
                                        db.close();
                                        resolve({ success: true });
                                    }
                                );
                            }
                        );
                    } else {
                        // Deactivate all sessions for this user
                        db.run(
                            'UPDATE admin_sessions SET is_active = 0 WHERE admin_id = ?',
                            [decoded.id],
                            () => {
                                // Log logout
                                db.run(
                                    'INSERT INTO admin_activity_log (admin_id, action) VALUES (?, ?)',
                                    [decoded.id, 'logout_all'],
                                    () => {
                                        db.close();
                                        resolve({ success: true });
                                    }
                                );
                            }
                        );
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Middleware for protecting admin routes
     */
    requireAuth(requiredPermissions = []) {
        return (req, res, next) => {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            const token = authHeader.substring(7);
            const decoded = this.verifyToken(token);

            if (!decoded) {
                return res.status(401).json({ error: 'Invalid or expired token' });
            }

            // Check if user has required permissions
            if (requiredPermissions.length > 0) {
                const userPermissions = decoded.permissions || [];
                const hasPermission = userPermissions.includes('*') || // Super admin
                    requiredPermissions.some(perm => userPermissions.includes(perm));

                if (!hasPermission) {
                    return res.status(403).json({ error: 'Insufficient permissions' });
                }
            }

            // Add user info to request
            req.admin = decoded;
            next();
        };
    }

    /**
     * Clean up expired sessions
     */
    async cleanupExpiredSessions() {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    return reject(err);
                }

                const now = new Date().toISOString();
                db.run(
                    'DELETE FROM admin_sessions WHERE expires_at < ?',
                    [now],
                    function(err) {
                        db.close();
                        if (err) {
                            return reject(err);
                        }
                        resolve({ deletedSessions: this.changes });
                    }
                );
            });
        });
    }
}

module.exports = AdminAuth;