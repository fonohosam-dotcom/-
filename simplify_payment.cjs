const fs = require('fs');
let content = fs.readFileSync('src/components/PaymentHub.tsx', 'utf-8');

content = content.replace(/import CryptoWalletIntegrator from "\.\/CryptoWalletIntegrator";\n/, '');
content = content.replace(/paymentType === "crypto"/g, 'paymentType === "web3"');
content = content.replace(/\{paymentType === "web3" && \(\s*<CryptoWalletIntegrator[\s\S]*?\/>\s*\)\}/g, '');
content = content.replace(/<CryptoWalletIntegrator[\s\S]*?\/>/, '');

fs.writeFileSync('src/components/PaymentHub.tsx', content);
