console.log('🔍 VERIFYING SERVICE IMAGE FIX DEPLOYMENT');
console.log('='.repeat(60));

const testServiceDeployment = async () => {
    try {
        const response = await fetch('http://162.55.213.90:3080/wizard');
        const html = await response.text();
        
        console.log('📊 DEPLOYMENT VERIFICATION:');
        
        // Check for any hardcoded loops
        const hardcodedLoops = (html.match(/x-for="[^"]*i in \d+/g) || []);
        console.log(`\n1. HARDCODED LOOPS:`);
        if (hardcodedLoops.length > 0) {
            console.log(`❌ Found ${hardcodedLoops.length} hardcoded loops:`);
            hardcodedLoops.forEach(loop => console.log(`   - ${loop}`));
        } else {
            console.log(`✅ No hardcoded loops found`);
        }
        
        // Check service template
        const serviceTemplate = html.includes('x-for="(service, index) in wizardData.services"');
        console.log(`\n2. SERVICE TEMPLATE:`);
        console.log(`${serviceTemplate ? '✅' : '❌'} Dynamic service template: ${serviceTemplate ? 'DEPLOYED' : 'NOT FOUND'}`);
        
        // Check if old slice(0,6) exists
        const serviceSlice = html.includes('wizardData.services.slice(0, 6)');
        console.log(`\n3. OLD SLICE LIMITATION:`);
        console.log(`${serviceSlice ? '❌' : '✅'} .slice(0, 6) found: ${serviceSlice ? 'STILL EXISTS' : 'REMOVED'}`);
        
        // Count service image sections
        const serviceImageSections = (html.match(/Images pour vos.*service/gi) || []).length;
        console.log(`\n4. SERVICE IMAGE SECTIONS:`);
        console.log(`📊 Found ${serviceImageSections} service image section(s)`);
        
        // Check git hash in deployed version  
        const lastCommit = html.includes('a50b197') || html.includes('service image limitation');
        console.log(`\n5. COMMIT VERIFICATION:`);
        console.log(`${lastCommit ? '✅' : '❌'} Service fix commit deployed: ${lastCommit ? 'YES' : 'UNKNOWN'}`);
        
        console.log('\n🎯 DIAGNOSIS:');
        
        const issues = [];
        if (hardcodedLoops.length > 0) issues.push('Hardcoded loops still exist');
        if (!serviceTemplate) issues.push('Dynamic service template not found');
        if (serviceSlice) issues.push('Old slice limitation still present');
        
        if (issues.length === 0) {
            console.log('✅ SERVICE FIX IS PROPERLY DEPLOYED');
            console.log('The issue you\'re seeing is likely browser caching.');
            console.log('\n🔧 SOLUTION:');
            console.log('1. Open browser in INCOGNITO/PRIVATE mode');
            console.log('2. Go to: http://162.55.213.90:3080/wizard');
            console.log('3. Create 3 services → Should see exactly 3 service image slots');
            console.log('\nIf you still see 6 slots in incognito, there might be another section I missed.');
        } else {
            console.log('❌ DEPLOYMENT ISSUES FOUND:');
            issues.forEach((issue, i) => console.log(`   ${i + 1}. ${issue}`));
        }
        
        console.log('\n📋 NEXT STEPS:');
        console.log('1. Test in incognito mode first');
        console.log('2. If still broken, let me know which specific screen/step');  
        console.log('3. Take a screenshot if possible to show exact location');
        
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
    }
};

testServiceDeployment();