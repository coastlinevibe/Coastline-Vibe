const fs = require('fs');
const path = require('path');

// Ensure the reactions directory exists
const reactionsDir = path.join(__dirname, '../public/reactions');
if (!fs.existsSync(reactionsDir)) {
  fs.mkdirSync(reactionsDir, { recursive: true });
}

// Define the reaction definitions from our types
const reactions = [
  { code: 'wave', name: 'Making Waves', color: '#3b82f6' },
  { code: 'beach-buddy', name: 'Beach Buddy', color: '#f59e0b' },
  { code: 'lighthouse', name: 'Lighthouse', color: '#ef4444' },
  { code: 'sunset', name: 'Sunset Vibes', color: '#8b5cf6' },
  { code: 'sand-dollar', name: 'Sand Dollar', color: '#10b981' },
  { code: 'tide-rising', name: 'Tide\'s Rising', color: '#0ea5e9' },
  { code: 'sandcastle', name: 'Sandcastle Builder', color: '#f97316' },
  { code: 'volleyball', name: 'Beach Volleyball', color: '#ec4899' },
  { code: 'bonfire', name: 'Bonfire Gathering', color: '#f43f5e' },
  { code: 'seagull', name: 'Seagull Swoop', color: '#6366f1' },
];

// Generate a simple SVG for each reaction
reactions.forEach(reaction => {
  const svgContent = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" fill="${reaction.color}" />
    <text x="50" y="55" font-family="Arial" font-size="14" fill="white" text-anchor="middle">${reaction.name.split(' ')[0]}</text>
  </svg>`;
  
  const filePath = path.join(reactionsDir, `${reaction.code}.svg`);
  fs.writeFileSync(filePath, svgContent);
  console.log(`Generated: ${filePath}`);
  
  // Also create a GIF version (just a renamed SVG for now)
  const gifPath = path.join(reactionsDir, `${reaction.code}.gif`);
  fs.writeFileSync(gifPath, svgContent);
  console.log(`Generated: ${gifPath}`);
});

console.log('All reaction placeholders generated successfully!'); 