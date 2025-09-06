const bcrypt = require('bcrypt');

async function generatePasswords() {
  const passwords = {
    'owner123': await bcrypt.hash('owner123', 10),
    'manager123': await bcrypt.hash('manager123', 10),  
    'staff123': await bcrypt.hash('staff123', 10)
  };
  
  console.log('Password hashes:');
  Object.entries(passwords).forEach(([plain, hash]) => {
    console.log(`${plain}: ${hash}`);
  });
}

generatePasswords();