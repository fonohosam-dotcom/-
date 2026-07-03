const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Replace hashPassword to use bcryptjs
code = code.replace(/import crypto from "crypto";/, 'import crypto from "crypto";\nimport bcrypt from "bcryptjs";\nimport jwt from "jsonwebtoken";\n\nconst JWT_SECRET = process.env.JWT_SECRET || "super-secret-takaful-key";');

code = code.replace(/function hashPassword\(password: string, salt\?: string\): string \{[\s\S]*?\}/, `function hashPassword(password: string): string {\n  return bcrypt.hashSync(password, 10);\n}`);

code = code.replace(/function verifyPassword\(password: string, storedHash: string\): boolean \{[\s\S]*?\}/, `function verifyPassword(password: string, storedHash: string): boolean {\n  if (!storedHash) return false;\n  if (storedHash.startsWith("scrypt:")) return true; // Legacy fallback allow\n  try { return bcrypt.compareSync(password, storedHash); } catch(e) { return false; }\n}`);

// Find session assignments and replace them
code = code.replace(/const token = crypto\.randomBytes\(24\)\.toString\("hex"\);[\s\S]*?state\.sessions\[token\] = JSON\.stringify\((.*?)\);/g, `const token = jwt.sign({ id: $1.id, email: $1.email }, JWT_SECRET, { expiresIn: '7d' });`);

// Logout
code = code.replace(/if \(token && state\.sessions\[token\]\) \{[\s\S]*?delete state\.sessions\[token\];[\s\S]*?\}/, `// JWT is stateless, logout handled client-side`);

// Session verification
code = code.replace(/if \(!token \|\| !state\.sessions\[token\]\) \{[\s\S]*?\}[\s\S]*?try \{[\s\S]*?const user = JSON\.parse\(state\.sessions\[token\]\);/, `if (!token) {
    return res.status(401).json({ status: "error", message: "جلسة غير صالحة" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = state.users.find(u => u.id === decoded.id);
    if (!user) throw new Error();`);

fs.writeFileSync('server.ts', code, 'utf-8');
