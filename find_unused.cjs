const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

files.forEach(file => {
  const componentName = file.replace('.tsx', '').replace('.ts', '');
  try {
    const result = require('child_process').execSync(`grep -r "import.*${componentName}" src/`).toString();
    if (!result) {
      console.log(`${file} is not imported anywhere`);
    }
  } catch (e) {
    console.log(`${file} is not imported anywhere`);
  }
});
