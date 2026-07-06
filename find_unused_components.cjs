const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

const allProjectFiles = [];
function walk(dir) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist') walk(fullPath);
    } else {
      if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
        allProjectFiles.push(fullPath);
      }
    }
  }
}
walk(path.join(__dirname, 'src'));

for (const file of files) {
  const compName = file.replace('.tsx', '');
  let isUsed = false;
  for (const projFile of allProjectFiles) {
    if (projFile === path.join(componentsDir, file)) continue; // ignore self
    const content = fs.readFileSync(projFile, 'utf8');
    if (content.includes(compName)) {
      isUsed = true;
      break;
    }
  }
  if (!isUsed) {
    console.log(`Unused: ${file}`);
  }
}
