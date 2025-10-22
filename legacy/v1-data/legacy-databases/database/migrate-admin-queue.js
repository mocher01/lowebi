#!/usr/bin/env node

/**
 * Admin AI Queue Migration Script
 * Applies migration 001_admin_ai_queue.sql to the database
 * Version: v1.1.1.9.2.4.1.7
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Configuration
const DB_PATH = path.join(__dirname, 'website-generator.db');
const MIGRATION_FILE = path.join(__dirname, 'migrations', '001_admin_ai_queue.sql');

function runMigration() {
    return new Promise((resolve, reject) => {
        console.log('🚀 Starting Admin AI Queue Migration');
        console.log('=====================================');
        
        // Check if migration file exists
        if (!fs.existsSync(MIGRATION_FILE)) {
            return reject(new Error(`Migration file not found: ${MIGRATION_FILE}`));
        }
        
        // Read migration SQL
        const migrationSQL = fs.readFileSync(MIGRATION_FILE, 'utf8');
        console.log('✅ Migration file loaded successfully');
        
        // Open database connection
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                return reject(err);
            }
            console.log('✅ Database connection established');
            
            // Check if migration already applied
            db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='admin_users'", (err, row) => {
                if (err) {
                    console.log('⚠️  Could not check existing tables, continuing with migration');
                } else if (row) {
                    console.log('⚠️  Admin AI Queue tables already exist. Skipping migration.');
                    db.close();
                    return resolve();
                }
                
                // Check current version
                db.get('SELECT value FROM system_config WHERE key = ?', ['version'], (err, versionRow) => {
                    let currentVersion = '0.0.0';
                    if (!err && versionRow) {
                        currentVersion = versionRow.value;
                    }
                    console.log(`📋 Current database version: ${currentVersion}`);
                    
                    // Begin transaction and execute migration
                    db.serialize(() => {
                        db.run('BEGIN TRANSACTION');
                        
                        // Split SQL by semicolons but handle multiline statements properly
                        const statements = migrationSQL
                            .split(';')
                            .map(stmt => stmt.trim().replace(/--.*$/gm, '').trim()) // Remove comments
                            .filter(stmt => stmt.length > 0);
                        
                        let executedStatements = 0;
                        let errors = [];
                        
                        statements.forEach((statement, index) => {
                            if (statement.trim()) {
                                db.run(statement, (err) => {
                                    if (err) {
                                        errors.push(`Statement ${index + 1}: ${err.message}`);
                                    } else {
                                        executedStatements++;
                                    }
                                });
                            }
                        });
                        
                        // Commit or rollback based on errors
                        db.run(errors.length > 0 ? 'ROLLBACK' : 'COMMIT', (err) => {
                            if (errors.length > 0) {
                                console.error('❌ Migration failed with errors:');
                                errors.forEach(error => console.error(`  • ${error}`));
                                db.close();
                                return reject(new Error('Migration failed: ' + errors.join(', ')));
                            }
                            
                            console.log(`✅ Executed ${executedStatements} SQL statements`);
                            
                            // Verify migration success
                            const tablesCreated = [
                                'admin_users',
                                'admin_sessions', 
                                'ai_requests',
                                'ai_request_history',
                                'admin_activity_log',
                                'email_queue'
                            ];
                            
                            console.log('🔍 Verifying created tables...');
                            let verificationsLeft = tablesCreated.length;
                            let verificationErrors = [];
                            
                            tablesCreated.forEach(table => {
                                db.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [table], (err, row) => {
                                    if (!err && row) {
                                        console.log(`  ✅ ${table}`);
                                    } else {
                                        verificationErrors.push(`Table ${table} was not created`);
                                    }
                                    
                                    verificationsLeft--;
                                    if (verificationsLeft === 0) {
                                        if (verificationErrors.length > 0) {
                                            db.close();
                                            return reject(new Error(verificationErrors.join(', ')));
                                        }
                                        
                                        // Verify admin user
                                        db.get('SELECT email FROM admin_users WHERE role = ?', ['super_admin'], (err, adminUser) => {
                                            if (!err && adminUser) {
                                                console.log(`✅ Default admin user created: ${adminUser.email}`);
                                            }
                                            
                                            // Check final version
                                            db.get('SELECT value FROM system_config WHERE key = ?', ['version'], (err, newVersionRow) => {
                                                const newVersion = (!err && newVersionRow) ? newVersionRow.value : 'unknown';
                                                console.log(`✅ Database version updated to: ${newVersion}`);
                                                
                                                // Close database and complete
                                                db.close((err) => {
                                                    if (err) {
                                                        return reject(err);
                                                    }
                                                    
                                                    console.log('');
                                                    console.log('🎉 Migration completed successfully!');
                                                    console.log('=====================================');
                                                    console.log('');
                                                    console.log('📋 What was created:');
                                                    console.log('• Admin Users table with default admin@locod.ai user');
                                                    console.log('• AI Requests queue system');
                                                    console.log('• Admin authentication and session management');
                                                    console.log('• Activity logging and audit trail');
                                                    console.log('• Email notification system');
                                                    console.log('');
                                                    console.log('🔐 Default admin credentials:');
                                                    console.log('  Email: admin@locod.ai');
                                                    console.log('  Password: admin123');
                                                    console.log('  ⚠️  CHANGE PASSWORD IN PRODUCTION!');
                                                    console.log('');
                                                    console.log('🚀 Ready to implement Admin AI Queue System!');
                                                    
                                                    resolve();
                                                });
                                            });
                                        });
                                    }
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

// Run if called directly
if (require.main === module) {
    runMigration()
        .then(() => {
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Migration failed:', error.message);
            console.error('Stack trace:', error.stack);
            process.exit(1);
        });
}

module.exports = { runMigration };