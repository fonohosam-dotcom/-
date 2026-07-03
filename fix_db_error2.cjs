const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/db\.collection\("system"\)\.doc\("state"\)\.set\(state\)\.catch\(e => console\.error\("Firestore sync error", e\)\);/g, `db.collection("system").doc("state").set(state).catch(e => { console.warn("Firestore sync error. Disabling."); db = null; });`);

content = content.replace(/console\.error\("Failed to load state from Firestore", e\);/g, `console.warn("Failed to load state from Firestore. Disabling db."); db = null;`);

fs.writeFileSync('server.ts', content);
