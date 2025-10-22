const fs = require('fs');

function findUnclosedDivs() {
    const content = fs.readFileSync('./api/portal-ui/wizard.html', 'utf8');
    const lines = content.split('\n');
    
    let stack = [];
    let issues = [];
    
    // Focus on the area between Step 4 and Step 6 
    const startLine = 829 - 1; // Convert to 0-based
    const endLine = 2140 - 1;
    
    for (let i = startLine; i <= endLine; i++) {
        const line = lines[i];
        const lineNum = i + 1;
        
        // Find opening div tags
        const openingDivs = line.match(/<div[^>]*>/g);
        if (openingDivs) {
            openingDivs.forEach(tag => {
                // Skip self-closing tags
                if (!tag.includes('/>')) {
                    stack.push({ tag, line: lineNum, content: line.trim() });
                }
            });
        }
        
        // Find closing div tags
        const closingDivs = line.match(/<\/div>/g);
        if (closingDivs) {
            closingDivs.forEach(() => {
                if (stack.length > 0) {
                    stack.pop();
                } else {
                    issues.push({
                        type: 'extra_closing',
                        line: lineNum,
                        content: line.trim()
                    });
                }
            });
        }
    }
    
    // Remaining items in stack are unclosed
    stack.forEach(item => {
        issues.push({
            type: 'unclosed',
            line: item.line,
            tag: item.tag,
            content: item.content
        });
    });
    
    console.log(`📊 Analysis of lines ${startLine + 1} to ${endLine + 1}:`);
    console.log(`🔢 Total unclosed divs found: ${stack.length}`);
    console.log(`⚠️ Issues found: ${issues.length}`);
    
    if (issues.length > 0) {
        console.log('\n❌ Issues:');
        issues.forEach((issue, index) => {
            console.log(`${index + 1}. ${issue.type.toUpperCase()} at line ${issue.line}:`);
            console.log(`   ${issue.content}`);
            if (issue.tag) {
                console.log(`   Tag: ${issue.tag}`);
            }
        });
    }
    
    // Show the last few items in the stack (most likely to be the problem)
    if (stack.length > 0) {
        console.log('\n🔍 Unclosed divs (most recent first):');
        stack.slice(-5).reverse().forEach((item, index) => {
            console.log(`${index + 1}. Line ${item.line}: ${item.content}`);
            console.log(`   Tag: ${item.tag}`);
        });
    }
}

findUnclosedDivs();