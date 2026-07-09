const fs = require('fs');
let content = fs.readFileSync('src/server/routes/auth.routes.ts', 'utf8');

content = content.replace(
`// IMPORTANT: We need to store password somewhere if we handle local auth properly, 
// currently we didn't add password hash to schema.ts. We should add it.
router.post("/login", async (req, res) => {
  res.status(501).json({ status: "error", message: "Login with password is not fully migrated, please use social login for now." });
});`,
`router.post("/login", async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ status: "error", message: parsed.error.issues[0].message });
    }
    const { email, password } = parsed.data;
    const identifier = email.trim();
    const normalizedIdentifier = identifier.toLowerCase();

    const existingUser = await db.select().from(users).where(
      or(
        eq(users.email, normalizedIdentifier),
        eq(users.phone, identifier),
        eq(users.nationalId, identifier)
      )
    ).limit(1);

    if (existingUser.length === 0) {
      return res.status(404).json({ status: "error", message: "المستند أو معرف الدخول غير مسجل لدينا، يرجى التأكد من البيانات المدخلة" });
    }

    const user = existingUser[0];
    
    if (user.status === 'banned') {
      return res.status(403).json({ status: "error", message: "هذا الحساب محظور من استخدام المنظومة." });
    }

    if (!password) {
      return res.status(401).json({ status: "error", message: "كلمة المرور مطلوبة" });
    }

    if (!user.passwordHash) {
      return res.status(401).json({ status: "error", message: "هذا الحساب مسجل عن طريق الدخول الاجتماعي. يرجى الدخول من هناك." });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ status: "error", message: "كلمة المرور غير صحيحة، يرجى إعادة المحاولة" });
    }

    const token = jwt.sign({ id: user.id, uid: user.uid, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ status: "success", user, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});`
);
fs.writeFileSync('src/server/routes/auth.routes.ts', content);
