const fs = require('fs');

function analyzeOption1() {
    console.log('🔍 ANALYZING OPTION 1 (MANUAL) DIV BALANCE');
    console.log('==========================================');
    
    const content = fs.readFileSync('../../api/portal-ui/wizard.html', 'utf8');
    const lines = content.split('\n');
    
    // Find Option 1 boundaries (Manual upload option)
    let startLine = -1;
    let endLine = -1;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('<!-- Option 1: Upload manuel -->')) {
            startLine = i + 1; // Next line after comment  
        }
        if (startLine !== -1 && endLine === -1) {
            if (line.includes('<!-- Option 2: Génération IA -->')) {
                endLine = i - 1; // Line before the comment
                break;
            }
        }
    }
    
    console.log(`Option 1 (Manual) boundaries:`);
    console.log(`Start: Line ${startLine + 1}: ${lines[startLine]?.trim()}`);
    console.log(`End: Line ${endLine + 1}: ${lines[endLine]?.trim()}`);
    
    // Count divs in Option 1 only
    let openDivs = 0;
    let closeDivs = 0;
    let divDetails = [];
    
    for (let i = startLine; i <= endLine; i++) {
        const line = lines[i];
        const lineNum = i + 1;
        
        // Count opening divs
        const openMatches = line.match(/<div[^>]*>/g);
        if (openMatches) {
            openDivs += openMatches.length;
            openMatches.forEach(match => {
                divDetails.push(`${lineNum}: OPEN ${match}`);
            });
        }
        
        // Count closing divs
        const closeMatches = line.match(/<\/div>/g);
        if (closeMatches) {
            closeDivs += closeMatches.length;
            closeMatches.forEach(() => {
                divDetails.push(`${lineNum}: CLOSE </div>`);
            });
        }
    }
    
    console.log('\n📊 OPTION 1 DIV BALANCE:');
    console.log(`Opening <div>: ${openDivs}`);
    console.log(`Closing </div>: ${closeDivs}`);
    console.log(`Balance: ${openDivs - closeDivs}`);
    
    if (openDivs !== closeDivs) {
        console.log(`❌ IMBALANCED! Missing ${Math.abs(openDivs - closeDivs)} ${openDivs > closeDivs ? 'closing' : 'opening'} div(s) in Option 1`);
    } else {
        console.log('✅ Option 1 divs are balanced');
    }
    
    console.log('\n📋 OPTION 1 DIV DETAILS:');
    divDetails.forEach(detail => {
        console.log(`  ${detail}`);
    });
    
    // Check what comes after Option 1
    console.log('\n🔍 WHAT COMES AFTER OPTION 1:');
    for (let i = endLine + 1; i <= endLine + 5; i++) {
        if (lines[i]) {
            console.log(`${i + 1}: ${lines[i]}`);
        }
    }
}

analyzeOption1();