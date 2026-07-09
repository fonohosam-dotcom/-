const fs = require('fs');
const api = fs.readFileSync('src/server/api.ts', 'utf-8');
const server = fs.readFileSync('server.ts', 'utf-8');

const apiCode = api.split('// We will refactor this to proper controllers later\n')[1].replace(/apiRouter\./g, 'app.');
const serverParts = server.split('import apiRouter from "./src/server/api.ts";\napp.use("/api", apiRouter);');

fs.writeFileSync('server.ts', serverParts[0] + apiCode + serverParts[1]);
console.log('Reverted');
