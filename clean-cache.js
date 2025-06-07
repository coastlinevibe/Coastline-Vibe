// clean-cache.js
// Script to clean Next.js and webpack cache to resolve "invalid block type" errors

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Paths to clean
const cachePaths = [
  '.next',
  'node_modules/.cache'
];

console.log('🧹 Cleaning Next.js and webpack cache...');

// Delete cache directories
cachePaths.forEach(cachePath => {
  const fullPath = path.join(__dirname, cachePath);
  
  if (fs.existsSync(fullPath)) {
    console.log(`Removing ${cachePath}...`);
    
    try {
      if (fs.lstatSync(fullPath).isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(fullPath);
      }
      console.log(`✅ Successfully removed ${cachePath}`);
    } catch (err) {
      console.error(`❌ Error removing ${cachePath}:`, err.message);
    }
  } else {
    console.log(`📝 ${cachePath} doesn't exist, skipping.`);
  }
});

// Clean npm cache as well
console.log('🧹 Cleaning npm cache...');
exec('npm cache clean --force', (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Error cleaning npm cache: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`⚠️ stderr: ${stderr}`);
    return;
  }
  console.log('✅ npm cache cleaned successfully');
  console.log(stdout);
  
  console.log('\n🎉 Cache cleaning complete!');
  console.log('\nNext steps:');
  console.log('1. Run "npm install" to reinstall dependencies if needed');
  console.log('2. Start the development server with "PORT=3001 npm run dev"');
}); 