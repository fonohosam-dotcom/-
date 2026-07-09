const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/app\.use\(helmet\(\{\n\s*contentSecurityPolicy: true, \/\/ Vite requires unsafe-inline for dev, or config can be complex\. Disabling CSP for simplicity in sandbox\.\n\s*crossOriginEmbedderPolicy: false,\n\}\)\);/g, `app.use(helmet({
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

fs.writeFileSync('server.ts', code);
