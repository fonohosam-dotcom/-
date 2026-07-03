const fs = require('fs');
let content = fs.readFileSync('src/components/AuthModal.tsx', 'utf8');

// Replace the specific admin block
const blockRegex = /\{step !== "register" && \(\s*<div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900[\s\S]*?<\/div>\s*\)\}/g;
content = content.replace(blockRegex, '');

fs.writeFileSync('src/components/AuthModal.tsx', content);
