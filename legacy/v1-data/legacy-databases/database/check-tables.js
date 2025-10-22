#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'website-generator.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        return;
    }
    
    console.log('📋 Database Tables:');
    console.log('==================');
    
    db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, tables) => {
        if (err) {
            console.error('❌ Error querying tables:', err.message);
            return;
        }
        
        tables.forEach((table, index) => {
            console.log(`${index + 1}. ${table.name}`);
        });
        
        console.log('');
        console.log('📊 Admin Users:');
        console.log('===============');
        
        db.all("SELECT email, name, role, created_at FROM admin_users", (err, users) => {
            if (err) {
                console.error('⚠️  Admin users table not found or error:', err.message);
            } else if (users.length === 0) {
                console.log('No admin users found');
            } else {
                users.forEach(user => {
                    console.log(`• ${user.email} (${user.name}) - ${user.role} - Created: ${user.created_at}`);
                });
            }
            
            db.close();
        });
    });
});