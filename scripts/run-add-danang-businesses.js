// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Execute the script using ts-node
require('ts-node').register();
require('../src/scripts/add-danang-businesses.ts');

console.log('Script execution started. Check the logs for details.'); 