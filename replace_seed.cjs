const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const startStr = 'const initialUsers: User[] = [';
const endStr = '\n// Default hashed password for all pre-seeded accounts: "123456"';

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

const before = code.substring(0, startIndex);
const after = code.substring(endIndex);

const importStr = `import { initialUsers, initialFamilies, initialCases, initialProjects, initialLedger, initialFunds } from "./src/server/seedData";\n`;

fs.writeFileSync('server.ts', before + importStr + after, 'utf-8');
console.log("Replaced seed data in server.ts");
