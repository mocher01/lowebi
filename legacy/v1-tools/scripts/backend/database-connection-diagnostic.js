#!/usr/bin/env node
/**
 * Database Connection Diagnostic Tool
 * Tests PostgreSQL connectivity with different credential combinations
 */

const { Client } = require('pg');

// Potential database configurations to test
const configsToTest = [
  {
    name: 'v2test-postgres (5433)',
    host: '127.0.0.1',
    port: 5433,
    user: 'postgres',
    password: '',
    database: 'postgres'
  },
  {
    name: 'v2test-postgres with locod_user (5433)',
    host: '127.0.0.1',
    port: 5433,
    user: 'locod_user',
    password: 'locod_pass_2024',
    database: 'locod_db'
  },
  {
    name: 'v2test-postgres with locod_user (5433) - prod db',
    host: '127.0.0.1',
    port: 5433,
    user: 'locod_user',
    password: 'locod_pass_2024',
    database: 'locod_prod'
  },
  {
    name: 'n8n-prod-postgres (5432)',
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    password: '',
    database: 'postgres'
  },
  {
    name: 'n8n-prod-postgres with locod_user (5432)',
    host: '127.0.0.1',
    port: 5432,
    user: 'locod_user',
    password: 'locod_pass_2024',
    database: 'locod_prod'
  }
];

async function testConnection(config) {
  const client = new Client({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectionTimeoutMillis: 5000
  });

  try {
    console.log(`\n🔍 Testing: ${config.name}`);
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   User: ${config.user}`);
    console.log(`   Database: ${config.database}`);
    
    await client.connect();
    console.log(`✅ Connection successful!`);
    
    // Test basic query
    const result = await client.query('SELECT version()');
    console.log(`   PostgreSQL Version: ${result.rows[0].version.split(' ').slice(0, 2).join(' ')}`);
    
    // List databases
    const dbResult = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false');
    const databases = dbResult.rows.map(row => row.datname).join(', ');
    console.log(`   Available databases: ${databases}`);
    
    // Test if locod_prod database exists
    const locodDbExists = dbResult.rows.some(row => row.datname === 'locod_prod');
    const locodDbExistsAlt = dbResult.rows.some(row => row.datname === 'locod_db');
    
    if (locodDbExists) {
      console.log(`   ✅ locod_prod database found`);
    } else if (locodDbExistsAlt) {
      console.log(`   ✅ locod_db database found`);
    } else {
      console.log(`   ⚠️  Neither locod_prod nor locod_db database found`);
    }
    
    await client.end();
    return { success: true, config, databases: dbResult.rows.map(row => row.datname) };
    
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    try {
      await client.end();
    } catch (e) {
      // Ignore cleanup errors
    }
    return { success: false, config, error: error.message };
  }
}

async function generateEnvironmentConfig(workingConfig, availableDatabases) {
  console.log(`\n🔧 RECOMMENDED ENVIRONMENT CONFIGURATION:`);
  console.log(`# Database Configuration for Backend`);
  console.log(`DATABASE_HOST=${workingConfig.host}`);
  console.log(`DATABASE_PORT=${workingConfig.port}`);
  console.log(`DATABASE_USERNAME=${workingConfig.user}`);
  console.log(`DATABASE_PASSWORD=${workingConfig.password}`);
  
  // Determine best database to use
  let targetDb = 'locod_prod';
  if (availableDatabases.includes('locod_prod')) {
    targetDb = 'locod_prod';
  } else if (availableDatabases.includes('locod_db')) {
    targetDb = 'locod_db';
  } else {
    targetDb = 'postgres';
  }
  
  console.log(`DATABASE_NAME=${targetDb}`);
  console.log(`\n# Application Configuration`);
  console.log(`PORT=7600`);
  console.log(`NODE_ENV=development`);
  console.log(`\n# JWT Configuration`);
  console.log(`JWT_SECRET=your-super-secret-jwt-key-here`);
  console.log(`JWT_EXPIRES_IN=24h`);
}

async function main() {
  console.log('🚀 Portal v2.0 Database Connection Diagnostic Tool');
  console.log('================================================');
  
  const workingConfigs = [];
  
  for (const config of configsToTest) {
    const result = await testConnection(config);
    if (result.success) {
      workingConfigs.push(result);
    }
  }
  
  console.log(`\n📊 DIAGNOSTIC SUMMARY:`);
  console.log(`====================================`);
  console.log(`Total configurations tested: ${configsToTest.length}`);
  console.log(`Working configurations: ${workingConfigs.length}`);
  
  if (workingConfigs.length === 0) {
    console.log(`\n❌ NO WORKING DATABASE CONNECTIONS FOUND`);
    console.log(`\nTroubleshooting steps:`);
    console.log(`1. Verify PostgreSQL containers are running:`);
    console.log(`   docker ps | grep postgres`);
    console.log(`2. Check if containers exist:`);
    console.log(`   docker container ls -a`);
    console.log(`3. Start the containers if needed:`);
    console.log(`   docker start v2test-postgres`);
    console.log(`   docker start n8n-prod-postgres`);
    process.exit(1);
  }
  
  // Use the first working configuration
  const bestConfig = workingConfigs[0];
  console.log(`\n🎯 RECOMMENDED DATABASE CONFIGURATION:`);
  console.log(`   ${bestConfig.config.name}`);
  
  await generateEnvironmentConfig(bestConfig.config, bestConfig.databases);
  
  console.log(`\n🔧 NEXT STEPS:`);
  console.log(`1. Update /var/apps/website-generator/v2/backend/.env with the above configuration`);
  console.log(`2. Restart the backend service: cd /var/apps/website-generator/v2/backend && npm run start:prod`);
  console.log(`3. Test health endpoint: curl http://162.55.213.90:7600/api/health`);
  console.log(`4. Check API documentation: http://162.55.213.90:7600/api/docs`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testConnection, generateEnvironmentConfig };