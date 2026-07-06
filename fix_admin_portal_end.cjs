const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

const regex = /\{\/\*\s*Central registry of verified users\s*\*\/\}[\s\S]*?\{\/\*\s*Advanced Admin controls \(Feature Flags \+ Ban\/Delete users\)\s*\*\/\}[\s\S]*?<\/div>\s*<\/div>\s*\)\}/;

if (regex.test(code)) {
    code = code.replace(regex, '          </div>\n        </div>\n      )}');
    fs.writeFileSync('src/components/AdminPortal.tsx', code);
    console.log("Replaced successfully!");
} else {
    console.log("Regex didn't match.");
}
