const axios = require('axios');

(async () => {
    console.log('🔍 Checking login response...');
    
    const loginRes = await axios.post('http://162.55.213.90:3080/admin/auth/login', {
        email: 'admin@locod.ai', 
        password: 'admin123'
    });
    
    console.log('\n📊 LOGIN RESPONSE:');
    console.log(JSON.stringify(loginRes.data, null, 2));
    
    if (loginRes.data.user) {
        console.log('\n👤 USER OBJECT:');
        console.log('ID:', loginRes.data.user.id);
        console.log('Email:', loginRes.data.user.email);
        console.log('Name:', loginRes.data.user.name);
        console.log('Role:', loginRes.data.user.role);
    } else {
        console.log('❌ No user object in response!');
    }
})().catch(console.error);