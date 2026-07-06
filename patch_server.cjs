const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Insert imports
const imports = `import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { logger } from "./src/lib/logger.ts";
`;

code = code.replace(/import express from "express";/, imports + 'import express from "express";');

// Insert middleware after const app = express();
const middleware = `
// Security Middleware (Zero Trust & WAF basics)
app.use(helmet({
  contentSecurityPolicy: false, // Disabling for dev/sandbox
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});
app.use("/api/", limiter);

app.use((req, res, next) => {
  logger.info(\`\${req.method} \${req.url}\`);
  next();
});
`;

code = code.replace(/const app = express\(\);\n/, 'const app = express();\n' + middleware);

fs.writeFileSync('server.ts', code);
