const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const loginLogic = `
  // If password is provided, do a secure verification
  if (password) {
    const userEmailKey = user.email.toLowerCase();
    const savedHash = state.userPasswords[userEmailKey];
    if (!verifyPassword(password, savedHash)) {
      return res.status(401).json({ status: "error", message: "كلمة المرور غير صحيحة، يرجى إعادة المحاولة" });
    }
  } else {
    // If password is not provided, it's from the Simulator Quick Switch Bar
    console.log(\`Simulator login bypass for user: \${email}\`);
  }`;

const secureLogic = `
  if (!password) {
      return res.status(401).json({ status: "error", message: "كلمة المرور مطلوبة" });
  }

  const userEmailKey = user.email.toLowerCase();
  const savedHash = state.userPasswords[userEmailKey];
  if (!verifyPassword(password, savedHash)) {
    return res.status(401).json({ status: "error", message: "كلمة المرور غير صحيحة، يرجى إعادة المحاولة" });
  }`;

content = content.replace(loginLogic, secureLogic);
fs.writeFileSync('server.ts', content);
