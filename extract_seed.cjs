const fs = require('fs');
const code = fs.readFileSync('server.ts', 'utf-8');

const startStr = 'const initialUsers: User[] = [';
const endStr = '\n// Default hashed password for all pre-seeded accounts: "123456"';

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

let seedData = code.substring(startIndex, endIndex);
seedData = seedData.replace(/^const initial/gm, 'export const initial');

const output = `import { User, Case, MajorProject, Fund, LedgerEntry, Family } from "../types";\n\n` + seedData;

fs.writeFileSync('src/server/seedData.ts', output, 'utf-8');
console.log("Extracted seed data. length: ", seedData.length);
