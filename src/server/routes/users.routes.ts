import crypto from 'crypto';
import { z } from "zod";

import { Router } from "express";
import { state, TransactionManager, logAudit } from "../lib/legacyState";
import { db } from "../../db/index";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { User, AppNotification } from "../types/index.js";
import { logger } from "../lib/logger.js";

const router = Router();

// Users & Role-Based Access Control (RBAC) API
router.get("/users/gamification", async (req, res) => {
  try {
    // In a real scenario, this would compute points from the ledger and cases
    // We will return a simulated gamification object for now.
    res.json({
      success: true,
      data: {
        points: 850,
        level: 4,
        nextLevel: 1000,
        badges: [
          { id: 1, name: "مبادر الخير", icon: "Star", desc: "أول تبرع لك على المنصة" },
          { id: 2, name: "داعم متواصل", icon: "Zap", desc: "تبرع لثلاثة أشهر متتالية" },
          { id: 3, name: "مساهم مجتمعي", icon: "Star", desc: "أبلغت عن 3 حالات تم التحقق منها" }
        ]
      }
    });
  } catch(e) {
    res.status(500).json({ success: false });
  }
});

router.get("/users", async (req, res) => {
  try {
    const allUsers = await db.select().from(users);
    res.json(allUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ status: "error" });
  }
});

router.post("/users", async (req, res) => {
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
    id: newUser.id || `user-${Date.now()}`,
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
    });

router.put("/users/:id", async (req, res) => {
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
    });


router.delete("/users/:id", async (req, res) => {
      await TransactionManager.withTransaction(async (draftState) => {
        
  const { id } = req.params;
  const initialLength = draftState.users.length;
  draftState.users = draftState.users.filter(u => u.id !== id);
  if (draftState.users.length === initialLength) {
    return res.status(404).json({ status: "error", message: "المستخدم غير موجود" });
  }
  
  res.json({ status: "success", message: "تم حذف المستخدم بنجاح" });

      });
    });

// Feature Flags APIs
router.get("/feature-flags", (req, res) => {
  res.json({ status: "success", flags: state.featureFlags || {} });
});

router.put("/feature-flags", async (req, res) => {
      await TransactionManager.withTransaction(async (draftState) => {
        
  draftState.featureFlags = { ...draftState.featureFlags, ...req.body };
  
  res.json({ status: "success", flags: draftState.featureFlags });

      });
    });

// Notifications API

router.get("/notifications", (req, res) => {
  res.json(state.notifications);
});

router.post("/notifications/read", async (req, res) => {
      await TransactionManager.withTransaction(async (draftState) => {
        
  const { id } = req.body;
  const notif = draftState.notifications.find(n => n.id === id);
  if (notif) {
    notif.read = true;
    
    res.json({ status: "success" });
  } else {
    res.status(404).json({ status: "error", message: "الإشعار غير موجود" });
  }

      });
    });

router.post("/notifications/read-all", async (req, res) => {
      await TransactionManager.withTransaction(async (draftState) => {
        
  draftState.notifications.forEach(n => {
    n.read = true;
  });
  
  res.json({ status: "success" });

      });
    });

router.post("/notifications/pref", async (req, res) => {
      await TransactionManager.withTransaction(async (draftState) => {
        
  const { userId, prefs } = req.body;
  if (!userId || !prefs) {
    return res.status(400).json({ status: "error", message: "البيانات غير مكتملة" });
  }
  draftState.notificationPrefs[userId] = prefs;
  
  res.json({ status: "success", prefs });

      });
    });

// Post a manual simulated notification
router.post("/notifications/simulate", async (req, res) => {
      await TransactionManager.withTransaction(async (draftState) => {
        
  const { title, message, type } = req.body;
  const newNotif: AppNotification = {
    id: `notif-${Date.now()}`,
    title,
    message,
    type: type || "update",
    createdAt: new Date().toISOString(),
    read: false
  };
  draftState.notifications.unshift(newNotif);
  
  res.json({ status: "success", notification: newNotif });

      });
    });

// Broadcast push notification reminders to target families
router.post("/notifications/broadcast-reminder", async (req, res) => {
      await TransactionManager.withTransaction(async (draftState) => {
        
  const { title, message, targetMunicipality, type } = req.body;
  if (!title || !message) {
    return res.status(400).json({ status: "error", message: "العنوان والرسالة مطلوبان لبث التنبيه" });
  }

  const notificationType = type || "deadline";
  const nowStr = new Date().toISOString();

  // Find target users (citizens / families in need) matching the criteria
  const targetCitizens = draftState.users.filter(u => {
    const matchesRole = u.role === "citizen";
    const matchesMuni = !targetMunicipality || targetMunicipality === "all" || u.municipality === targetMunicipality;
    return matchesRole && matchesMuni;
  });

  const createdNotifications: AppNotification[] = [];

  // 1. Create a public broadcast notification tagged with target municipality info
  const broadcastNotif: AppNotification = {
    id: `notif-broadcast-${Date.now()}`,
    title: `📢 ${title}`,
    message: `${message} [المستهدفون: ${targetMunicipality === 'all' || !targetMunicipality ? 'جميع البلديات' : `بلدية ${targetMunicipality}`}]`,
    type: notificationType,
    createdAt: nowStr,
    read: false
  };
  draftState.notifications.unshift(broadcastNotif);
  createdNotifications.push(broadcastNotif);

  // 2. Also inject individual notifications for each matched citizen to ensure it pops up in their private dashboard
  targetCitizens.forEach(citizen => {
    const personalNotif: AppNotification = {
      id: `notif-personal-${citizen.id}-${Date.now()}`,
      userId: citizen.id,
      title: title,
      message: message,
      type: notificationType,
      createdAt: nowStr,
      read: false
    };
    draftState.notifications.unshift(personalNotif);
    createdNotifications.push(personalNotif);
  });

  // Keep notifications list bounded to avoid memory bloating
  if (draftState.notifications.length > 200) {
    draftState.notifications.splice(200);
  }

  

  res.json({
    status: "success",
    message: `تم بث التنبيه بنجاح إلى (${targetCitizens.length}) أسرة مستهدفة ببلدية ${targetMunicipality === 'all' ? 'جميع البلديات' : targetMunicipality}.`,
    targetCount: targetCitizens.length,
    broadcastNotification: broadcastNotif
  });

      });
    });

const createCaseSchema = z.object({
  userId: z.string().optional(),
  municipality: z.string(),
  description: z.string(),
  amountRequired: z.number().positive(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  needTypes: z.array(z.string()),
  housingPhotos: z.array(z.string()).optional(),
  bioVerification: z.any().optional(),
  family: z.object({
    totalMembers: z.number().min(1),
    childrenCount: z.number().min(0),
    elderlyCount: z.number().min(0),
    disabledCount: z.number().min(0),
    monthlyIncome: z.number().min(0),
    rentAmount: z.number().min(0),
    housingCondition: z.enum(["جيد", "متوسط", "غير صالح"]),
    evictionRisk: z.boolean(),
    maritalStatus: z.enum(["متزوج", "أرملة", "مطلقة", "أعزب"]),
    chronicIllnesses: z.boolean(),
    incomeSources: z.array(z.string())
  })
});

// Create/Register citizen request


export default router;
