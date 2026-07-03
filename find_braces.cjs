const fs = require('fs');
const code = fs.readFileSync('server.ts', 'utf-8');
let depth = 0;
for(let i=0; i<code.length; i++) {
  if (code[i] === '{') {
    if (depth === 0) console.log('Top level { at', i, 'line', code.substring(0, i).split('\n').length);
    depth++;
  } else if (code[i] === '}') {
    depth--;
    if (depth === 0) console.log('Top level } at', i, 'line', code.substring(0, i).split('\n').length);
  }
}
