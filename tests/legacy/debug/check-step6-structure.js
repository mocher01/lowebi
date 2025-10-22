const fs = require('fs');

function checkStep6Structure() {
    const content = fs.readFileSync('./api/portal-ui/wizard.html', 'utf8');
    const lines = content.split('\n');
    
    // Find Step 6 boundaries
    const step6Start = 2140 - 1; // Line 2140, convert to 0-based
    const step7Start = 2214 - 1; // Line 2214, convert to 0-based
    
    let divStack = [];
    let step6Opened = false;
    
    console.log(`🔍 Analyzing Step 6 structure (lines ${step6Start + 1} to ${step7Start}):\n`);
    
    for (let i = step6Start; i < step7Start; i++) {
        const line = lines[i];
        const lineNum = i + 1;
        
        // Check if this is the Step 6 opening line
        if (line.includes('x-show="currentStep === 6"')) {
            step6Opened = true;
            console.log(`📍 Line ${lineNum}: STEP 6 OPENED`);
            console.log(`   ${line.trim()}`);
            divStack.push('STEP6');
        }
        
        // Find other opening div tags
        const openingDivs = line.match(/<div[^>]*>/g);
        if (openingDivs) {
            openingDivs.forEach(tag => {
                if (!tag.includes('/>') && !line.includes('x-show="currentStep === 6"')) {
                    divStack.push(`DIV-${lineNum}`);
                    if (divStack.length <= 3) { // Only show first few levels
                        console.log(`   Line ${lineNum}: +div (depth: ${divStack.length})`);
                    }
                }
            });
        }
        
        // Find closing div tags
        const closingDivs = line.match(/<\/div>/g);
        if (closingDivs) {
            closingDivs.forEach(() => {
                const closed = divStack.pop();
                if (closed === 'STEP6') {
                    console.log(`✅ Line ${lineNum}: STEP 6 CLOSED`);
                    console.log(`   ${line.trim()}`);
                    return;
                }
                if (divStack.length <= 3 || !closed) { // Only show first few levels or errors
                    console.log(`   Line ${lineNum}: -div (depth: ${divStack.length + 1}) closed: ${closed || 'EXTRA!'}`);
                }
            });
        }
    }
    
    console.log(`\n📊 Final analysis:`);
    console.log(`🔢 Remaining unclosed divs in Step 6: ${divStack.length}`);
    if (divStack.length > 0) {
        console.log(`❌ Unclosed divs: ${divStack.join(', ')}`);
    }
    
    if (!step6Opened) {
        console.log(`❌ Step 6 opening tag not found in expected range!`);
    }
}

checkStep6Structure();