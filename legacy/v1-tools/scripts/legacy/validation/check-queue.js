const axios = require('axios');

(async () => {
    console.log('🔍 Checking queue data...');
    
    // Login
    const loginRes = await axios.post('http://162.55.213.90:3080/admin/auth/login', {
        email: 'admin@locod.ai', 
        password: 'admin123'
    });
    
    if (!loginRes.data.success) {
        console.log('❌ Login failed');
        return;
    }
    
    const token = loginRes.data.token;
    console.log('✅ Login successful');
    
    // Get queue
    const queueRes = await axios.get('http://162.55.213.90:3080/admin/queue', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = queueRes.data;
    console.log('\n📊 QUEUE DATA:');
    console.log('Success:', data.success);
    console.log('Total requests:', data.requests?.length || 0);
    
    if (data.requests && data.requests.length > 0) {
        console.log('\n📋 FIRST REQUEST:');
        const firstRequest = data.requests[0];
        console.log('ID:', firstRequest.id);
        console.log('Status:', firstRequest.status);
        console.log('Admin ID:', firstRequest.admin_id);
        console.log('Site Name (DB):', firstRequest.site_name);
        console.log('Site Name (Data):', firstRequest.request_data?.siteName);
        
        console.log('\n🔍 BUTTON VISIBILITY CHECK:');
        console.log('Show Assign:', firstRequest.status === 'pending');
        console.log('Show Start:', firstRequest.status === 'assigned' && firstRequest.admin_id === 1);
        console.log('Show Continue:', firstRequest.status === 'processing' && firstRequest.admin_id === 1);
        console.log('Show View:', true);
        
        console.log('\n📋 ALL REQUESTS:');
        data.requests.forEach((req, i) => {
            console.log(`${i+1}. ID:${req.id} Status:${req.status} AdminID:${req.admin_id}`);
        });
    } else {
        console.log('❌ NO REQUESTS IN QUEUE');
    }
})().catch(console.error);