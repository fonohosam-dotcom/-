const fs = require('fs');
let content = fs.readFileSync('src/components/ErrorBoundary.tsx', 'utf8');
content = content.replace('this.props.children', 'this.props.children as ReactNode');
fs.writeFileSync('src/components/ErrorBoundary.tsx', content);
