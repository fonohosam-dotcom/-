const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Replace the admin initialization logic with the new modular way or just use admin.apps?
// No, the default import in v12+ doesn't export the default object with `.apps`.
// Let's change it to:
// import { getApps, initializeApp } from 'firebase-admin/app';
// import { getFirestore } from 'firebase-admin/firestore';

code = code.replace(/import admin from "firebase-admin";/, `import { getApps, initializeApp } from "firebase-admin/app";\nimport { getFirestore } from "firebase-admin/firestore";`);

code = code.replace(/\/\/ @ts-ignore\n\s*if \(\!admin\.apps\.length\) \{/g, 'if (!getApps().length) {');
code = code.replace(/admin\.initializeApp\(\);/g, 'initializeApp();');
code = code.replace(/\/\/ @ts-ignore\n\s*db = admin\.firestore\(\);/g, 'db = getFirestore();');

fs.writeFileSync('server.ts', code, 'utf-8');
