const fs = require('fs');
let content = fs.readFileSync('src/server/routes/users.routes.ts', 'utf8');

content = content.replace(
`import { state, TransactionManager, logAudit } from "../lib/legacyState.js";`,
`import { state, TransactionManager, logAudit } from "../lib/legacyState.js";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";`
);

content = content.replace(
`router.get("/users", (req, res) => {
  res.json(state.users);
});`,
`router.get("/users", async (req, res) => {
  try {
    const allUsers = await db.select().from(users);
    res.json(allUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ status: "error" });
  }
});`
);

content = content.replace(
`router.post("/users", async (req, res) => {
      await TransactionManager.withTransaction(async (draftState) => {    
      const newUser = req.body;
  if (!newUser.fullName || !newUser.email) {
    return res.status(400).json({ status: "error", message: "الاسم والبريد الإلكتروني مطلوبان" });
  }
  const emailLower = newUser.email.toLowerCase().trim();
  const exists = draftState.users.some(u => u.email.toLowerCase() === emailLower);
  if (exists) {
    return res.status(400).json({ status: "error", message: "البريد الإلكتروني مسجل مسبقاً" });
  }
  const userRecord: User = {
    id: newUser.id || \`user-\${Date.now()}\`,
    fullName: newUser.fullName.trim(),
    email: emailLower,
    role: newUser.role || "researcher",
    municipality: newUser.municipality || "صبراتة",
    gamificationPoints: newUser.gamificationPoints || 100,
    phone: newUser.phone || "",
    address: newUser.address || "",
    nationalId: newUser.nationalId || ""
  };
  userRecord.status = newUser.status || "active";
  userRecord.region = newUser.region || "المنطقة الغربية";
  userRecord.permissions = newUser.permissions || [];
  userRecord.allowedMunicipalities = newUser.allowedMunicipalities || [userRecord.municipality || "صبراتة"];
  draftState.users.push(userRecord);
  
  res.json({ status: "success", user: userRecord });
    
  });
  
});`,
`router.post("/users", async (req, res) => {
  try {
    const newUser = req.body;
    if (!newUser.fullName || !newUser.email) {
      return res.status(400).json({ status: "error", message: "الاسم والبريد الإلكتروني مطلوبان" });
    }
    const emailLower = newUser.email.toLowerCase().trim();
    
    const existing = await db.select().from(users).where(eq(users.email, emailLower)).limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ status: "error", message: "البريد الإلكتروني مسجل مسبقاً" });
    }
    
    const [inserted] = await db.insert(users).values({
      uid: crypto.randomUUID(),
      fullName: newUser.fullName.trim(),
      email: emailLower,
      role: newUser.role || "researcher",
      municipality: newUser.municipality || "صبراتة",
      gamificationPoints: newUser.gamificationPoints || 100,
      phone: newUser.phone || "",
      address: newUser.address || "",
      nationalId: newUser.nationalId || "",
      status: newUser.status || "active",
      region: newUser.region || "المنطقة الغربية",
      permissions: newUser.permissions || [],
      allowedMunicipalities: newUser.allowedMunicipalities || [newUser.municipality || "صبراتة"]
    }).returning();
    
    res.json({ status: "success", user: inserted });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ status: "error" });
  }
});`
);

content = content.replace(
`router.put("/users/:id", async (req, res) => {
      await TransactionManager.withTransaction(async (draftState) => {    
      const { id } = req.params;
  const updateData = req.body;
  const userIndex = draftState.users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ status: "error", message: "المستخدم غير موجود" });
  }
  const existingUser = draftState.users[userIndex];
  const updatedUser = {
    ...existingUser,
    ...updateData
  };
  draftState.users[userIndex] = updatedUser;
  
  res.json({ status: "success", user: updatedUser });
    
  });
  
});`,
`router.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Using parseInt as schema id is serial (number) but params are strings
    const userId = parseInt(id, 10);
    if (isNaN(userId)) return res.status(400).json({ status: "error" });

    const [updated] = await db.update(users).set(updateData).where(eq(users.id, userId)).returning();
    
    if (!updated) {
      return res.status(404).json({ status: "error", message: "المستخدم غير موجود" });
    }
    
    res.json({ status: "success", user: updated });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ status: "error" });
  }
});`
);

content = content.replace(
`router.delete("/users/:id", async (req, res) => {
      await TransactionManager.withTransaction(async (draftState) => {    
      const { id } = req.params;
  const initialLength = draftState.users.length;
  draftState.users = draftState.users.filter(u => u.id !== id);
  if (draftState.users.length === initialLength) {
    return res.status(404).json({ status: "error", message: "المستخدم غير موجود" });
  }
  
  res.json({ status: "success", message: "تم حذف المستخدم بنجاح" });
    
  });
  
});`,
`router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) return res.status(400).json({ status: "error" });

    const deleted = await db.delete(users).where(eq(users.id, userId)).returning();
    
    if (deleted.length === 0) {
      return res.status(404).json({ status: "error", message: "المستخدم غير موجود" });
    }
    
    res.json({ status: "success", message: "تم حذف المستخدم بنجاح" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ status: "error" });
  }
});`
);

content = `import crypto from 'crypto';\n` + content;
fs.writeFileSync('src/server/routes/users.routes.ts', content);
