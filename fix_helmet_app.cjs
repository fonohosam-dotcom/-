const fs = require('fs');
let code = fs.readFileSync('src/server/app.ts', 'utf8');

code = code.replace(/app\.use\(helmet\(\{\n\s*contentSecurityPolicy: false, \/\/ Vite requires unsafe-inline for dev, or config can be complex\. Disabling CSP for simplicity in sandbox\.\n\s*crossOriginEmbedderPolicy: false,\n\}\)\);/g, `app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://maps.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://*"],
      connectSrc: ["'self'", "https://*", "wss://*"]
    }
  },
  crossOriginEmbedderPolicy: false,
}));`);

code = code.replace(/app\.use\(helmet\(\{\n\s*contentSecurityPolicy: false, \/\/ Disabling for dev\/sandbox\n\}\)\);/g, `// Removed duplicate helmet`);

fs.writeFileSync('src/server/app.ts', code);
