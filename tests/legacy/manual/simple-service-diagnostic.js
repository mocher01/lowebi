// Use node built-in fetch for Node 18+

console.log('🔍 SIMPLE DIAGNOSTIC: STEP 5 SERVICE TEMPLATE');
console.log('='.repeat(60));

(async () => {
    try {
        const response = await fetch('http://162.55.213.90:3080/wizard');
        const html = await response.text();
        
        console.log('🎯 CHECKING STEP 5 SERVICE IMAGES TEMPLATE:');
        
        // Find the Step 5 service template
        const step5ServiceSection = html.match(/Images des Services[\s\S]*?<template x-for="[^"]*"[^>]*>[\s\S]*?<\/template>/);
        
        if (step5ServiceSection) {
            console.log('✅ Step 5 service section found');
            
            // Extract the template loop
            const templateMatch = step5ServiceSection[0].match(/<template x-for="([^"]*)"[^>]*>/);
            if (templateMatch) {
                console.log(`📊 Template loop: ${templateMatch[1]}`);
                
                if (templateMatch[1].includes('wizardData.services')) {
                    console.log('✅ TEMPLATE IS DYNAMIC - correctly using wizardData.services');
                    console.log('🎯 DIAGNOSIS: Template is correct');
                    console.log('');
                    console.log('👀 If user sees 5 service upload slots, it means:');
                    console.log('   ✅ Template is working correctly');
                    console.log('   ✅ Step 5 service section is properly dynamic');
                    console.log('   📊 The wizardData.services array actually contains 5 services');
                    console.log('   🔍 Investigation needed: WHY does services array have 5 instead of 3?');
                    console.log('');
                    console.log('💡 POSSIBLE CAUSES:');
                    console.log('   1. Business type auto-populates default services');
                    console.log('   2. Template loading adds default services'); 
                    console.log('   3. User actually added 5 services but thinks they added 3');
                    console.log('   4. Services are being duplicated somehow');
                    console.log('');
                    console.log('🧪 NEXT STEPS:');
                    console.log('   1. Ask user to screenshot the Content step showing services');
                    console.log('   2. Check what business type they selected');
                    console.log('   3. Check if they loaded a template that has 5 services');
                    
                } else {
                    console.log('❌ TEMPLATE IS NOT DYNAMIC');
                }
            }
        } else {
            console.log('❌ Step 5 service section not found');
        }
        
        // Also check if there are any hardcoded service loops in Step 5
        const step5Content = html.match(/x-show="currentStep === 5"[\s\S]*?(?=x-show="currentStep === 6"|$)/);
        if (step5Content) {
            const hardcodedLoops = step5Content[0].match(/x-for="[^"]*i in \d+[^"]*"/g);
            if (hardcodedLoops && hardcodedLoops.length > 0) {
                console.log('❌ FOUND HARDCODED LOOPS IN STEP 5:');
                hardcodedLoops.forEach(loop => console.log(`   - ${loop}`));
            } else {
                console.log('✅ No hardcoded loops in Step 5');
            }
        }
        
    } catch (error) {
        console.error('❌ Diagnostic failed:', error.message);
    }
})();