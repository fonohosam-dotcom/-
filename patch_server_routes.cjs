const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Insert route imports
const imports = `
import authRoutes from "./src/server/routes/auth.js";
import casesRoutes from "./src/server/routes/cases.js";
`;

code = code.replace(/import express from "express";/, imports + '\nimport express from "express";');

// Insert route usages
const routeUsages = `
app.use("/api/auth", authRoutes);
app.use("/api/cases", casesRoutes);
`;

code = code.replace(/app\.use\("\/api\/", limiter\);\n/, 'app.use("/api/", limiter);\n' + routeUsages);

fs.writeFileSync('server.ts', code);
