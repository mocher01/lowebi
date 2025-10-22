#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const AdminAuth = require('../api/admin/auth');

const DB_PATH = path.join(__dirname, 'website-generator.db');

// Generate correct hash for admin123
const auth = new AdminAuth();
const correctHash = auth.hashPassword('admin123');

console.log('🔐 Fixing admin password hash...');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        return;
    }
    
    db.run(
        'UPDATE admin_users SET password_hash = ? WHERE email = ?',
        [correctHash, 'admin@locod.ai'],
        function(err) {
            if (err) {
                console.error('❌ Update failed:', err.message);
            } else {
                console.log(`✅ Password hash updated successfully`);
                console.log(`   Rows affected: ${this.changes}`);
            }
            
            db.close();
        }
    );
});