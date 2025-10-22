const fs = require('fs');

function traceStep4Exact() {
    console.log('🔍 Tracing exact Step 4 opening and closing...');
    
    const content = fs.readFileSync('./api/portal-ui/wizard.html', 'utf8');
    const lines = content.split('\n');
    
    let step4Depth = -1;
    let currentDepth = 0;
    let step4Found = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;
        
        // Find Step 4 opening
        if (line.includes('x-show="currentStep === 4"') && !step4Found) {
            step4Found = true;
            step4Depth = currentDepth;
            console.log(`📍 STEP 4 OPENS at line ${lineNum} (depth: ${currentDepth})`);
            console.log(`   ${line.trim()}`);
        }
        
        // Count div opening and closing to track depth
        const openingDivs = line.match(/<div[^>]*>/g);
        if (openingDivs) {
            openingDivs.forEach(tag => {
                if (!tag.includes('/>')) {
                    currentDepth++;
                }
            });
        }
        
        const closingDivs = line.match(/<\/div>/g);
        if (closingDivs) {
            closingDivs.forEach(() => {
                currentDepth--;
                
                // Check if we just closed Step 4
                if (step4Found && currentDepth === step4Depth) {
                    console.log(`✅ STEP 4 CLOSES at line ${lineNum} (depth: ${currentDepth})`);
                    console.log(`   ${line.trim()}`);
                    
                    // Check what comes after
                    if (i + 1 < lines.length) {
                        console.log(`📄 Next line ${lineNum + 1}: ${lines[i + 1].trim()}`);
                    }
                    if (i + 2 < lines.length) {
                        console.log(`📄 Line ${lineNum + 2}: ${lines[i + 2].trim()}`);
                    }
                    
                    return;
                }
            });
        }
        
        // Check if we're past reasonable Step 4 boundaries
        if (lineNum > 1300 && step4Found && step4Depth >= 0) {
            console.log(`⚠️  Reached line ${lineNum} and Step 4 (depth ${step4Depth}) is still not closed!`);
            console.log(`    Current depth: ${currentDepth}`);
            break;
        }
    }
    
    if (step4Found && step4Depth >= 0) {
        console.log(`\n❌ Step 4 never properly closed! It opened at depth ${step4Depth}, current depth is ${currentDepth}`);
        console.log(`💡 Need to add ${currentDepth - step4Depth} closing </div> tags after Step 4 content`);
    }
}

traceStep4Exact();