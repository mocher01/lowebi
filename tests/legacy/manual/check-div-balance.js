const fs = require('fs');

function checkDivBalance() {
    console.log('🔍 CHECKING DIV BALANCE IN IMAGES STEP (currentStep === 4)');
    console.log('============================================================');
    
    const content = fs.readFileSync('../../api/portal-ui/wizard.html', 'utf8');
    const lines = content.split('\n');
    
    // Find the Images step boundaries
    let startLine = -1;
    let endLine = -1;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('currentStep === 4') && line.includes('wizard-step')) {
            startLine = i;
            console.log(`📍 Images Step starts at line ${i + 1}`);
        }
        if (startLine !== -1 && endLine === -1) {
            if (line.includes('currentStep === 5') && line.includes('wizard-step')) {
                endLine = i - 1;
                console.log(`📍 Images Step ends at line ${i}`);
                break;
            }
        }
    }
    
    if (startLine === -1 || endLine === -1) {
        console.log('❌ Could not find step boundaries');
        return;
    }
    
    // Count divs in the Images step
    let openDivs = 0;
    let closeDivs = 0;
    let divHistory = [];
    
    for (let i = startLine; i <= endLine; i++) {
        const line = lines[i];
        const lineNum = i + 1;
        
        // Count opening divs
        const openMatches = line.match(/<div[^>]*>/g);
        if (openMatches) {
            openDivs += openMatches.length;
            openMatches.forEach(match => {
                divHistory.push(`Line ${lineNum}: OPEN ${match}`);
            });
        }
        
        // Count closing divs
        const closeMatches = line.match(/<\/div>/g);
        if (closeMatches) {
            closeDivs += closeMatches.length;
            closeMatches.forEach(() => {
                divHistory.push(`Line ${lineNum}: CLOSE </div>`);
            });
        }
    }
    
    console.log('\n📊 DIV COUNT ANALYSIS:');
    console.log(`   Opening <div>: ${openDivs}`);
    console.log(`   Closing </div>: ${closeDivs}`);
    console.log(`   Balance: ${openDivs - closeDivs}`);
    
    if (openDivs !== closeDivs) {
        console.log('❌ UNBALANCED DIVS DETECTED!');
        console.log(`   Missing ${Math.abs(openDivs - closeDivs)} ${openDivs > closeDivs ? 'closing' : 'opening'} div(s)`);
        
        console.log('\n📋 DIV HISTORY:');
        divHistory.forEach((entry, index) => {
            console.log(`   ${index + 1}. ${entry}`);
        });
    } else {
        console.log('✅ DIV tags are balanced in Images step');
    }
    
    // Also check if the last div closes properly
    const lastFewLines = lines.slice(endLine - 5, endLine + 1);
    console.log('\n🔚 LAST FEW LINES OF IMAGES STEP:');
    lastFewLines.forEach((line, index) => {
        const actualLineNum = endLine - 5 + index + 1;
        console.log(`   ${actualLineNum}: ${line}`);
    });
}

checkDivBalance();