const fs = require('fs');

function fixSpecificDivs() {
    console.log('🔧 TARGETED DIV FIXES FOR OPTION 1');
    console.log('===================================');
    
    let content = fs.readFileSync('../../api/portal-ui/wizard.html', 'utf8');
    let lines = content.split('\n');
    
    // The exact issue based on analysis: Option 1 has 8 extra closing divs
    // Looking at the div history, I can see some lines have orphaned closing divs
    
    // These are the problematic lines with extra closing divs based on the analysis:
    const fixes = [
        // Looking at the div history, these lines have closing divs that don't match opens
        { line: 892, remove: '                            </div>' }, // Extra closing div
        { line: 949, remove: '                        </div>' }, // Extra closing div  
        { line: 1003, remove: '                    </div>' }, // Extra closing div
        { line: 1034, remove: '                        </div>' }, // Extra closing div
        { line: 1067, remove: '                    </div>' }, // Extra closing div
        { line: 1082, remove: '                        </div>' }, // Extra closing div
        { line: 1083, remove: '                    </div>' }, // Extra closing div
        { line: 1130, remove: '                </div>' } // Extra closing div at end of manual section
    ];
    
    console.log('📋 Removing extra closing divs...');
    
    // Remove the problematic closing divs (in reverse order to maintain line numbers)
    fixes.reverse().forEach((fix, index) => {
        const lineIndex = fix.line - 1; // Convert to 0-based index
        if (lines[lineIndex] && lines[lineIndex].trim() === fix.remove.trim()) {
            console.log(`✅ Removing extra closing div at line ${fix.line}: ${fix.remove.trim()}`);
            lines.splice(lineIndex, 1);
        } else {
            console.log(`⚠️ Line ${fix.line} doesn't match expected content: "${lines[lineIndex]?.trim()}"`);
        }
    });
    
    // Write the fixed content
    const fixedContent = lines.join('\n');
    fs.writeFileSync('../../api/portal-ui/wizard.html', fixedContent, 'utf8');
    
    console.log('\n🎉 TARGETED DIV FIXES APPLIED!');
    console.log('Now Option 2 and 3 should be siblings, not nested in Option 1');
}

fixSpecificDivs();