const fs = require('fs');
const backupPath = 'D:\\Download\\TEMP_GT_RESTORE\\GT_MASTER_DASHBOARD\\modules\\sales-staff\\assets\\js\\summary.js';
const targetPath = 'D:\\Download\\GT_MASTER_DASHBOARD\\modules\\sales-staff\\assets\\js\\summary.js';

let backupContent = fs.readFileSync(backupPath, 'utf8');
let targetContent = fs.readFileSync(targetPath, 'utf8');

const startMarker = '// BUILD PRINT SUMMARY';
const endMarker = 'SALES STAFF PERFORMANCE';

const startIdx = backupContent.indexOf(startMarker);
const endIdx = backupContent.indexOf(endMarker);

if(startIdx !== -1 && endIdx !== -1) {
    const missingContent = backupContent.substring(startIdx - 50, endIdx - 50);
    const targetStartIdx = targetContent.indexOf('    };\n\n}');
    const targetEndIdx = targetContent.indexOf(endMarker);
    
    if(targetStartIdx !== -1 && targetEndIdx !== -1) {
        // extract the exact string to replace
        const toReplace = targetContent.substring(targetStartIdx + 8, targetEndIdx - 50);
        const newContent = targetContent.replace(toReplace, missingContent);
        fs.writeFileSync(targetPath, newContent);
        console.log('Restored missing content successfully.');
    } else {
        console.log('Could not find markers in target.');
    }
} else {
    console.log('Could not find markers in backup.');
}
