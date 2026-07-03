const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The simulator bar is between {/* Simulation Quick Switch Bar */} and {/* Sleek Top Header Bar (V2026 Style) */}
const regex = /\{\/\* Simulation Quick Switch Bar \*\/\}([\s\S]*?)<header className="bg-\[\#0B1519\]/g;
content = content.replace(regex, '<header className="bg-[#0B1519]');

fs.writeFileSync('src/App.tsx', content);
