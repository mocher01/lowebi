#!/bin/bash

# 🌐 Customer Portal with Database Startup Script v1.1.1.9.2.18
# Launch the database-powered customer-facing web interface

set -e

echo "🌐 Starting Customer Portal with Database v1.1.1.9.2.18"
echo "=========================================================="

# Check if Node.js dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if database exists, initialize if not
if [ ! -f "database/website-generator.db" ]; then
    echo "🗄️ Initializing database..."
    node database/cli.js init
else
    echo "✅ Database already exists"
fi

# Initialize wizard-user customer for the enhanced wizard
echo "🧙‍♂️ Setting up wizard-user customer..."
node -e "
const { DatabaseManager } = require('./database/database-manager.js');
(async () => {
    const db = new DatabaseManager();
    await db.initialize();
    
    try {
        // Check if wizard-user already exists
        const existing = await db.getCustomer('b131e26a1d916c086088491ea6ed0cfa').catch(() => null);
        
        if (!existing) {
            console.log('📝 Creating wizard-user customer...');
            await db.createCustomer({
                id: 'b131e26a1d916c086088491ea6ed0cfa',
                name: 'Wizard User',
                email: 'wizard@locod.ai',
                plan_type: 'wizard',
                max_sites: 50,
                max_storage_mb: 10000,
                max_bandwidth_gb: 100
            });
            console.log('✅ Wizard-user customer created with 50 site limit');
        } else {
            // Update existing customer to ensure proper limits
            await db.database.run(
                'UPDATE customers SET max_sites = 50, max_storage_mb = 10000 WHERE id = ?',
                ['b131e26a1d916c086088491ea6ed0cfa']
            );
            console.log('✅ Wizard-user customer limits updated');
        }
    } catch (error) {
        console.log('ℹ️ Wizard-user setup: ' + error.message);
    } finally {
        await db.close();
    }
})();
"

# Check if portal UI directory exists
if [ ! -d "api/portal-ui" ]; then
    echo "❌ Portal UI directory not found at api/portal-ui"
    echo "💡 Using basic HTML fallback"
    mkdir -p api/portal-ui
    cat > api/portal-ui/index.html << 'EOF'
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Locod.AI - Customer Portal Database</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
    <nav class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <h1 class="text-xl font-bold text-gray-900">Locod.AI Portal (Database)</h1>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="text-sm text-gray-500">v1.1.1.9.2.18</span>
                </div>
            </div>
        </div>
    </nav>
    
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="text-center">
            <h2 class="text-3xl font-bold text-gray-900 mb-4">
                🗄️ Database-Powered Portal
            </h2>
            <p class="text-lg text-gray-600 mb-8">
                Multi-tenant website generator with persistent storage
            </p>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div class="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 class="text-lg font-semibold mb-2">API Health</h3>
                    <a href="/api/health" class="text-blue-600 hover:underline">Check Status</a>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 class="text-lg font-semibold mb-2">Admin Stats</h3>
                    <a href="/api/admin/stats" class="text-blue-600 hover:underline">View Statistics</a>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 class="text-lg font-semibold mb-2">Business Types</h3>
                    <a href="/api/config/business-types" class="text-blue-600 hover:underline">View Templates</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
EOF
fi

echo ""
echo "🚀 Starting Customer Portal with Database..."
echo "📊 Admin Dashboard: http://localhost:3080/admin"
echo "🎯 Site Creator: http://localhost:3080/create"
echo "🔧 API Health: http://localhost:3080/api/health"
echo "📈 Admin Stats: http://localhost:3080/api/admin/stats"
echo "💾 Database: $(pwd)/database/website-generator.db"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the database-powered API server
node api/customer-portal-db.js