const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Ensure firebaseConfig is imported
if (!code.includes('import firebaseConfig')) {
    code = code.replace(/import \{ getApps, initializeApp \} from "firebase-admin\/app";/, 'import { getApps, initializeApp } from "firebase-admin/app";\nimport firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };');
}

code = code.replace(/initializeApp\(\);/g, 'initializeApp({ projectId: firebaseConfig.projectId });');
code = code.replace(/db = getFirestore\(\);/g, 'db = getFirestore(firebaseConfig.firestoreDatabaseId);');

fs.writeFileSync('server.ts', code, 'utf-8');
