const fs = require('fs');

function analyzeStep4Divs() {
    const content = fs.readFileSync('./api/portal-ui/wizard.html', 'utf8');
    const lines = content.split('\n');
    
    // Step 4 starts at line 829 and should end around line 1234
    const step4Start = 829 - 1;
    const step4End = 1234 - 1;
    
    console.log(`🔍 Analyzing Step 4 div structure (lines ${step4Start + 1} to ${step4End + 1}):`);
    
    let divStack = [];
    let issues = [];
    
    for (let i = step4Start; i <= step4End; i++) {
        const line = lines[i];
        const lineNum = i + 1;
        
        // Skip comments and empty lines
        if (line.trim().startsWith('<!--') || line.trim() === '') continue;
        
        // Find opening div tags
        const openingDivs = line.match(/<div[^>]*>/g);
        if (openingDivs) {
            openingDivs.forEach(tag => {
                // Skip self-closing tags
                if (!tag.includes('/>')) {
                    divStack.push({ 
                        tag: tag.substring(0, 50) + (tag.length > 50 ? '...' : ''),
                        line: lineNum, 
                        content: line.trim().substring(0, 80) + (line.trim().length > 80 ? '...' : '')
                    });
                }
            });
        }
        
        // Find closing div tags
        const closingDivs = line.match(/<\/div>/g);
        if (closingDivs) {
            closingDivs.forEach(() => {
                if (divStack.length > 0) {
                    const closed = divStack.pop();
                    // Only show major sections being closed
                    if (divStack.length < 3) {
                        console.log(`✅ Line ${lineNum}: Closed div from line ${closed.line}`);
                    }
                } else {
                    issues.push({
                        type: 'extra_closing',
                        line: lineNum,
                        content: line.trim()
                    });
                    console.log(`❌ Line ${lineNum}: EXTRA CLOSING DIV (no matching opening)`);
                    console.log(`   ${line.trim()}`);
                }
            });
        }
    }
    
    console.log(`\n📊 Step 4 Analysis Results:`);
    console.log(`🔢 Unclosed divs: ${divStack.length}`);
    console.log(`⚠️ Extra closing divs: ${issues.length}`);
    
    if (divStack.length > 0) {
        console.log(`\n❌ Unclosed divs in Step 4:`);
        divStack.forEach((div, index) => {
            console.log(`${index + 1}. Line ${div.line}: ${div.content}`);
            console.log(`   Tag: ${div.tag}`);
        });
        
        console.log(`\n🔧 SOLUTION: Add ${divStack.length} closing </div> tags at line ${step4End + 1}`);
    }
    
    if (issues.length > 0) {
        console.log(`\n⚠️ Extra closing divs found:`);
        issues.forEach(issue => {
            console.log(`Line ${issue.line}: ${issue.content}`);
        });
    }
}

analyzeStep4Divs();