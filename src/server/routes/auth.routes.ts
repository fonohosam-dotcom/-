
import { Router } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { state, saveState, hashPassword, verifyPassword, logAudit, TransactionManager } from "../lib/legacyState.js";
import { User } from "../types/index.js";

const router = Router();
const JWT_SECRET = env.JWT_SECRET;

const registerSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  fullName: z.string().min(3, "الاسم الرباعي مطلوب"),
  phone: z.string().optional(),
  role: z.enum(["citizen", "donor", "charity", "admin", "researcher"]).default("donor"),
  municipality: z.string().optional(),
  nationalId: z.string().optional(),
  address: z.string().optional(),
});

router.post("/register", async (req, res) => {
      await TransactionManager.withTransaction(async (draftState) => {
        
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ status: "error", message: parsed.error.issues[0].message });
  }
  const { email, password, fullName, phone, role, municipality, nationalId, address } = parsed.data;

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = draftState.users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (existingUser) {
    return res.status(400).json({ status: "error", message: "هذا البريد الإلكتروني مسجل مسبقاً" });
  }

  // Create new user
  const newUser: User = {
    id: `user-${Date.now()}`,
    email: normalizedEmail,
    fullName,
    phone,
    role,
    municipality,
    nationalId,
    address,
    gamificationPoints: 0
  };

  // Hash password & store
  draftState.users.push(newUser);
  draftState.userPasswords[normalizedEmail] = hashPassword(password);
  
  // Set default notification preferences
  draftState.notificationPrefs[newUser.id] = {
    projectUpdates: true,
    taskAssignments: true,
    mentions: true,
    deadlines: true,
    donations: true,
    soundEnabled: true
  };

  // Generate Session Token
  const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

  // Trigger system notification
  draftState.notifications.unshift({
    id: `notif-${Date.now()}`,
    title: "مرحباً بك في مجتمع التكافل الوطني!",
    message: `تم إنشاء حسابك الجديد بنجاح بصفة (${role === 'citizen' ? 'مواطن مستفيد' : role === 'donor' ? 'متبرع' : role === 'researcher' ? 'باحث ميداني' : 'جمعية خيرية'}). يرجى استكمال ملفك الشخصي.`,
    type: "update",
    createdAt: new Date().toISOString(),
    read: false
  });

  
  res.json({ status: "success", user: newUser, token });

      });
    });

// Social Auth Check
router.post("/social-check", async (req, res) => {
      await TransactionManager.withTransaction(async (draftState) => {
        
  const { email, fullName } = req.body;
  if (!email) {
    return res.status(400).json({ status: "error", message: "البريد الإلكتروني مطلوب" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = draftState.users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    return res.json({ status: "needs_profile", email: normalizedEmail, fullName });
  }

  // Generate Session Token
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  

  res.json({ status: "success", user, token });

      });
    });

router.post("/social-register", async (req, res) => {
      await TransactionManager.withTransaction(async (draftState) => {
        
  const { email, fullName, phone, role, municipality, nationalId, address, isAnonymous, provider, uid } = req.body;
  if (!email || !fullName) {
    return res.status(400).json({ status: "error", message: "البيانات الأساسية مطلوبة" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  if (draftState.users.some((u) => u.email === normalizedEmail)) {
    return res.status(400).json({ status: "error", message: "البريد الإلكتروني مستخدم بالفعل" });
  }

  const user: User = {
    id: uid || `user-${Date.now()}`,
    email: normalizedEmail,
    fullName,
    phone,
    role: role || "donor",
    municipality: municipality || "طرابلس",
    address,
    nationalId,
    gamificationPoints: 100, // Welcome points
    isAnonymous: isAnonymous || false,
    authProvider: provider || "local"
  };

  draftState.users.push(user);

  draftState.notificationPrefs[user.id] = {
    projectUpdates: true,
    taskAssignments: true,
    mentions: true,
    deadlines: true,
    donations: true,
    soundEnabled: true
  };

  draftState.notifications.unshift({
    id: `notif-${Date.now()}`,
    title: `مرحباً بك في سجل التكافل عبر ${provider}`,
    message: `تم تسجيل حسابك بنجاح. ${isAnonymous ? "أنت الآن في الوضع المخفي." : ""}`,
    type: "update",
    createdAt: new Date().toISOString(),
    read: false
  });

  

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ status: "success", user, token });

      });
    });

router.post("/update-profile", async (req, res) => {
      await TransactionManager.withTransaction(async (draftState) => {
        
  const tokenHeader = req.headers.authorization;
  if (!tokenHeader) return res.status(401).json({ status: "error" });
  const token = tokenHeader.split(" ")[1];
  const sessionStr = draftState.sessions[token];
  if (!sessionStr) return res.status(401).json({ status: "error" });
  const user = JSON.parse(sessionStr);
  const { isAnonymous } = req.body;
  const userIndex = draftState.users.findIndex(u => u.id === user.id);
  if (userIndex > -1) {
    draftState.users[userIndex].isAnonymous = isAnonymous;
    draftState.sessions[token] = JSON.stringify(draftState.users[userIndex]);
    
    res.json({ status: "success", user: draftState.users[userIndex] });
  } else {
    res.status(404).json({ status: "error" });
  }

      });
    });

const loginSchema = z.object({
  email: z.string().min(3, "يجب إدخال معرف الدخول الصحيح"),
  password: z.string().optional()
});

router.post("/login", async (req, res) => {
      await TransactionManager.withTransaction(async (draftState) => {
        
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ status: "error", message: parsed.error.issues[0].message });
  }
  const { email, password } = parsed.data;

  const identifier = email.trim();
  const normalizedIdentifier = identifier.toLowerCase();

  // Find user by email (username), phone, or national ID
  const user = draftState.users.find(u => 
    u.email.toLowerCase() === normalizedIdentifier ||
    (u.phone && u.phone.trim() === identifier) ||
    (u.nationalId && u.nationalId.trim() === identifier)
  );

  if (!user) {
    return res.status(404).json({ status: "error", message: "المستند أو معرف الدخول غير مسجل لدينا، يرجى التأكد من البيانات المدخلة" });
  }

  if (user.isBanned) {
    return res.status(403).json({ status: "error", message: "هذا الحساب محظور من استخدام المنظومة." });
  }

  if (!password) {
      return res.status(401).json({ status: "error", message: "كلمة المرور مطلوبة" });
  }

  const userEmailKey = user.email.toLowerCase();
  const savedHash = draftState.userPasswords[userEmailKey];
  if (!verifyPassword(password, savedHash)) {
    return res.status(401).json({ status: "error", message: "كلمة المرور غير صحيحة، يرجى إعادة المحاولة" });
  }

  // Generate Session Token
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  

  res.json({ status: "success", user, token });

      });
    });

router.post("/logout", (req, res) => {
  const { token } = req.body;
  // JWT is stateless, logout handled client-side
  res.json({ status: "success" });
});

router.post("/session", (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(401).json({ status: "error", message: "جلسة غير صالحة" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = state.users.find(u => u.id === decoded.id);
    if (!user) throw new Error();
    // Refresh user object from state in case points or details changed
    const freshUser = state.users.find(u => u.id === user.id) || user;
    res.json({ status: "success", user: freshUser });
  } catch (e) {
    res.status(500).json({ status: "error", message: "خلل في معالجة الجلسة" });
  }
});



export default router;
