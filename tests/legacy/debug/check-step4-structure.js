const fs = require('fs');

function checkStep4Structure() {
    const content = fs.readFileSync('./api/portal-ui/wizard.html', 'utf8');
    const lines = content.split('\n');
    
    // Find Step 4 boundaries
    const step4Start = 829 - 1; // Line 829, convert to 0-based
    const step5Start = 1237 - 1; // Line 1237 (Step 5), convert to 0-based
    
    let divStack = [];
    let step4Opened = false;
    
    console.log(`🔍 Analyzing Step 4 structure (lines ${step4Start + 1} to ${step5Start}):\n`);
    
    for (let i = step4Start; i < step5Start; i++) {
        const line = lines[i];
        const lineNum = i + 1;
        
        // Check if this is the Step 4 opening line
        if (line.includes('x-show="currentStep === 4"')) {
            step4Opened = true;
            console.log(`📍 Line ${lineNum}: STEP 4 OPENED`);
            console.log(`   ${line.trim()}`);
            divStack.push('STEP4');
        }
        
        // Find other opening div tags
        const openingDivs = line.match(/<div[^>]*>/g);
        if (openingDivs) {
            openingDivs.forEach(tag => {
                if (!tag.includes('/>') && !line.includes('x-show="currentStep === 4"')) {
                    divStack.push(`DIV-${lineNum}`);
                }
            });
        }
        
        // Find closing div tags
        const closingDivs = line.match(/<\/div>/g);
        if (closingDivs) {
            closingDivs.forEach(() => {
                const closed = divStack.pop();
                if (closed === 'STEP4') {
                    console.log(`✅ Line ${lineNum}: STEP 4 CLOSED`);
                    console.log(`   ${line.trim()}`);
                    return;
                }
                if (!closed) {
                    console.log(`❌ Line ${lineNum}: EXTRA CLOSING DIV (no matching opening)`);
                    console.log(`   ${line.trim()}`);
                }
            });
        }
    }
    
    console.log(`\n📊 Final analysis:`);
    console.log(`🔢 Remaining unclosed divs in Step 4: ${divStack.length}`);
    if (divStack.length > 0) {
        console.log(`❌ Unclosed divs: ${divStack.slice(-5).join(', ')} (showing last 5)`);
        
        // Show the lines where these unclosed divs were opened
        console.log(`\n🔍 Details of unclosed divs:`);
        divStack.slice(-5).forEach((item, index) => {
            if (item.includes('DIV-')) {
                const lineNum = item.split('-')[1];
                const line = lines[parseInt(lineNum) - 1];
                console.log(`${index + 1}. ${item}: ${line.trim()}`);
            } else {
                console.log(`${index + 1}. ${item}: Step opening tag`);
            }
        });
    }
    
    if (!step4Opened) {
        console.log(`❌ Step 4 opening tag not found in expected range!`);
    }
}

checkStep4Structure();