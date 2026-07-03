const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const startupLogic = `
  if (db) {
    try {
      const doc = await db.collection("system").doc("state").get();
      if (doc.exists) {
        const data = doc.data();
        state = { ...state, ...data };
        console.log("State synchronized from Firestore");
      }
    } catch (e) {
      console.warn("Failed to sync from Firestore. Disabling Firestore sync.", e.message);
      db = null; // Disable db
    }
  }`;

content = content.replace(/if \(db\) \{\s*try \{\s*const doc = await db\.collection\("system"\)\.doc\("state"\)\.get\(\);\s*if \(doc\.exists\) \{\s*const data = doc\.data\(\);\s*state = \{ \.\.\.state, \.\.\.data \};\s*console\.log\("State synchronized from Firestore"\);\s*\}\s*\} catch \(e\) \{\s*console\.error\("Failed to load state from Firestore", e\);\s*\}\s*\}/g, startupLogic);

const saveLogic = `
    if (db) {
       // Fire and forget upload to avoid blocking HTTP response
       db.collection("system").doc("state").set(state).catch(e => {
         console.warn("Firestore sync error. Disabling further syncs.");
         db = null;
       });
    }
`;
content = content.replace(/if \(db\) \{\s*\/\/ Fire and forget upload to avoid blocking HTTP response\s*db\.collection\("system"\)\.doc\("state"\)\.set\([^)]*\)\.catch\([^)]*\);\s*\}/g, saveLogic);

fs.writeFileSync('server.ts', content);
