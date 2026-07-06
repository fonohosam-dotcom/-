const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// The goal here is to show that we are migrating routes out of server.ts.
// We've already added auth and cases.
// We'll remove the local mock data variables to prevent memory leaks

const regexMockUsers = /let mockUsers: User\[\] = \[[\s\S]*?\];/m;
code = code.replace(regexMockUsers, '// mockUsers replaced by Drizzle ORM DB');

const regexMockCases = /let mockCases: Case\[\] = \[[\s\S]*?\];/m;
code = code.replace(regexMockCases, '// mockCases replaced by Drizzle ORM DB');

fs.writeFileSync('server.ts', code);
console.log("Mock data removed from server.ts");
