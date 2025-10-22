#!/usr/bin/env node

const AdminAuth = require('../api/admin/auth');

const auth = new AdminAuth();
const password = 'admin123';
const hash = auth.hashPassword(password);

console.log('Password:', password);
console.log('Hash:', hash);
console.log('');
console.log('SQL to update admin user:');
console.log(`UPDATE admin_users SET password_hash = '${hash}' WHERE email = 'admin@locod.ai';`);

// Test that it works
const isValid = auth.verifyPassword(password, hash);
console.log('');
console.log('Verification test:', isValid ? '✅ PASS' : '❌ FAIL');