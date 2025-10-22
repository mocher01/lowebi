const bcrypt = require('bcrypt');

async function generateHashes() {
    console.log('Generating bcrypt hashes...');
    
    // Generate hash for common test passwords
    const passwords = {
        'admin123': await bcrypt.hash('admin123', 10),
        'test123': await bcrypt.hash('test123', 10),
        'password': await bcrypt.hash('password', 10),
        'testpass': await bcrypt.hash('testpass', 10)
    };
    
    console.log('Password hashes:');
    Object.entries(passwords).forEach(([password, hash]) => {
        console.log();
    });
    
    console.log('\nSQL to update invalid password hashes:');
    console.log();
    console.log();
}

generateHashes().catch(console.error);
