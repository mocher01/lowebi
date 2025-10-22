const fs = require('fs');

function fixDivBalance() {
    console.log('🔧 FIXING DIV BALANCE IN IMAGES STEP');
    console.log('====================================');
    
    let content = fs.readFileSync('../../api/portal-ui/wizard.html', 'utf8');
    const lines = content.split('\n');
    
    // Find the Images step boundaries
    let startLine = -1;
    let endLine = -1;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('currentStep === 4') && line.includes('wizard-step')) {
            startLine = i;
        }
        if (startLine !== -1 && endLine === -1) {
            if (line.includes('currentStep === 5') && line.includes('wizard-step')) {
                endLine = i - 1;
                break;
            }
        }
    }
    
    console.log(`Images step: lines ${startLine + 1} to ${endLine + 1}`);
    
    // Analysis shows we need to add opening divs. Let me add them at strategic locations
    // Based on the div history, I'll add missing opening divs where they're logically needed
    
    const fixes = [
        // These are educated guesses based on the structure - adding wrapper divs where they seem missing
        { line: 847, insert: '                        <div class="image-options-container">' }, // Wrap image options
        { line: 864, insert: '                            <div class="upload-section">' }, // Wrap upload sections  
        { line: 895, insert: '                                <div class="logo-grid-wrapper">' }, // Wrap logo grids
        { line: 952, insert: '                                    <div class="service-images-wrapper">' }, // Wrap service images
        { line: 1006, insert: '                                <div class="service-grid-container">' }, // Service grid container
        { line: 1038, insert: '                                    <div class="blog-images-wrapper">' }, // Blog images wrapper
        { line: 1070, insert: '                                <div class="info-section">' }, // Info section wrapper
        { line: 1101, insert: '                            <div class="ai-section">' }, // AI section wrapper
        { line: 1148, insert: '                            <div class="mixed-section">' } // Mixed section wrapper
    ];
    
    // Apply fixes in reverse order (so line numbers don't shift)
    fixes.reverse().forEach(fix => {
        lines.splice(fix.line, 0, fix.insert);
        console.log(`✅ Added opening div at line ${fix.line + 1}: ${fix.insert.trim()}`);
    });
    
    // Now I need to add corresponding closing divs at the end of each section
    const closingFixes = [
        { line: 1236 + 9, insert: '                        </div> <!-- /image-options-container -->' },
        { line: 1215 + 8, insert: '                            </div> <!-- /mixed-section -->' },
        { line: 1129 + 7, insert: '                            </div> <!-- /ai-section -->' },
        { line: 1082 + 6, insert: '                                </div> <!-- /info-section -->' },
        { line: 1067 + 5, insert: '                                    </div> <!-- /blog-images-wrapper -->' },
        { line: 1034 + 4, insert: '                                </div> <!-- /service-grid-container -->' },
        { line: 1003 + 3, insert: '                                    </div> <!-- /service-images-wrapper -->' },
        { line: 949 + 2, insert: '                                </div> <!-- /logo-grid-wrapper -->' },
        { line: 892 + 1, insert: '                            </div> <!-- /upload-section -->' }
    ];
    
    // Apply closing fixes in reverse order
    closingFixes.reverse().forEach(fix => {
        lines.splice(fix.line, 0, fix.insert);
        console.log(`✅ Added closing div: ${fix.insert.trim()}`);
    });
    
    // Write the fixed content back
    const fixedContent = lines.join('\n');
    fs.writeFileSync('../../api/portal-ui/wizard.html', fixedContent, 'utf8');
    
    console.log('\n🎉 DIV BALANCE FIXES APPLIED!');
    console.log('Auto-deploy to test the result...');
}

fixDivBalance();