const fs = require('fs');

let seedCode = fs.readFileSync('src/server/seedData.ts', 'utf-8');

const hashFuncs = `// Helper function to hash passwords with bcrypt
function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  if (storedHash.startsWith("scrypt:")) return true; // Legacy fallback allow
  try { return bcrypt.compareSync(password, storedHash); } catch(e) { return false; }
}
`;

seedCode = seedCode.replace(hashFuncs, '');
fs.writeFileSync('src/server/seedData.ts', seedCode, 'utf-8');

let serverCode = fs.readFileSync('server.ts', 'utf-8');
// Insert hashFuncs after import
serverCode = serverCode.replace('import { initialUsers', hashFuncs + '\nimport { initialUsers');
fs.writeFileSync('server.ts', serverCode, 'utf-8');

console.log("Fixed hashPassword");
