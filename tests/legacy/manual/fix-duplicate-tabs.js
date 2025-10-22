const fs = require('fs');

function fixDuplicateTabs() {
    console.log('🔧 FIXING DUPLICATE CONTENT TABS IN STEP 6');
    console.log('==========================================');
    
    let content = fs.readFileSync('../../api/portal-ui/wizard.html', 'utf8');
    let lines = content.split('\n');
    
    // Find the three duplicate content tab sections
    const contentTabStarts = [];
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('<!-- Tab 3:') && 
            (lines[i].includes('Content') || lines[i].includes('Contenu'))) {
            contentTabStarts.push(i);
            console.log(`Found content tab at line ${i + 1}: ${lines[i].trim()}`);
        }
    }
    
    console.log(`\nFound ${contentTabStarts.length} content tab sections`);
    
    if (contentTabStarts.length !== 3) {
        console.log('❌ Expected 3 duplicate tabs, found ' + contentTabStarts.length);
        return;
    }
    
    // Find the end of each section (where the next tab or major section starts)
    const tabEnds = [];
    const tabMarkers = ['<!-- Tab 4:', '<!-- Tab 5:', '<!-- Navigation buttons', '</div>'];
    
    for (let start of contentTabStarts) {
        let endLine = -1;
        let divCount = 0;
        let foundStart = false;
        
        for (let i = start; i < lines.length; i++) {
            const line = lines[i];
            
            // Start counting divs after we find the x-show div
            if (!foundStart && line.includes('x-show="activeTab === \'content\'"')) {
                foundStart = true;
                divCount = 1;
                continue;
            }
            
            if (foundStart) {
                // Count opening divs
                const openDivs = (line.match(/<div/g) || []).length;
                divCount += openDivs;
                
                // Count closing divs
                const closeDivs = (line.match(/<\/div>/g) || []).length;
                divCount -= closeDivs;
                
                // When we close the main content tab div
                if (divCount === 0) {
                    endLine = i;
                    break;
                }
            }
        }
        
        tabEnds.push(endLine);
        console.log(`Content tab from line ${start + 1} ends at line ${endLine + 1}`);
    }
    
    // Decision: Keep the SECOND one (line 1619) as it has the most complete sub-tabs
    // Remove the FIRST (line 1570) and THIRD (line 1813)
    
    console.log('\n📋 REMOVAL PLAN:');
    console.log(`1. Remove FIRST content tab: lines ${contentTabStarts[0] + 1} to ${tabEnds[0] + 1}`);
    console.log(`2. Keep SECOND content tab: lines ${contentTabStarts[1] + 1} to ${tabEnds[1] + 1}`);
    console.log(`3. Remove THIRD content tab: lines ${contentTabStarts[2] + 1} to ${tabEnds[2] + 1}`);
    
    // Remove third one first (higher line numbers) so indices don't shift
    console.log('\n🗑️ Removing duplicate content tabs...');
    
    // Remove third duplicate
    const thirdStart = contentTabStarts[2];
    const thirdEnd = tabEnds[2];
    lines.splice(thirdStart, thirdEnd - thirdStart + 1);
    console.log(`✅ Removed third duplicate (${thirdEnd - thirdStart + 1} lines)`);
    
    // Remove first duplicate
    const firstStart = contentTabStarts[0];
    const firstEnd = tabEnds[0];
    lines.splice(firstStart, firstEnd - firstStart + 1);
    console.log(`✅ Removed first duplicate (${firstEnd - firstStart + 1} lines)`);
    
    // Write the fixed content
    const fixedContent = lines.join('\n');
    fs.writeFileSync('../../api/portal-ui/wizard.html', fixedContent, 'utf8');
    
    console.log('\n🎉 DUPLICATE TABS REMOVED!');
    console.log('Step 6 should now display correctly with single content tab');
}

fixDuplicateTabs();