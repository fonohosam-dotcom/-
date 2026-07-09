
import { Router } from "express";
import { z } from "zod";
import { state, TransactionManager, logAudit, calculateNeedScore, determinePriorityLevel, auditLedger } from "../lib/legacyState.js";
import { Case, Family, LedgerEntry, OmniTransaction } from "../types/index.js";
import { logger } from "../lib/logger.js";

const router = Router();

// Define schemas that were used in legacy for cases
const familySchema = z.object({
  headId: z.string().optional(),
  spouseCount: z.number().min(0).default(0),
  childrenCount: z.number().min(0).default(0),
  dependentsCount: z.number().min(0).default(0),
  notes: z.string().optional()
});

const newCaseSchema = z.object({
  userId: z.string(),
  family: familySchema,
  needTypes: z.array(z.string()).min(1),
  description: z.string().min(10),
  amountRequired: z.number().min(0),
  municipality: z.string(),
  latitude: z.number(),
  longitude: z.number()
});

router.post("/cases", async (req, res) => {
      await TransactionManager.withTransaction(async (draftState) => {
        
  const parseResult = createCaseSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ status: "error", errors: parseResult.error.format() });
  }

  const { userId, family, needTypes, description, amountRequired, municipality, bioVerification, latitude, longitude, housingPhotos } = parseResult.data;
  
  logAudit(userId || "Anonymous", "CREATE_CASE", "Case Registration", `New case registered for municipality ${municipality}`);
  
  const score = calculateNeedScore(family);
  const priority = determinePriorityLevel(score);
  const count = draftState.cases.length + 1;
  const caseNumber = `LY-2026-${String(count).padStart(4, "0")}`;

  const newCase: Case = {
    id: `case-${Date.now()}`,
    caseNumber,
    userId,
    family,
    needTypes,
    description,
    amountRequired,
    amountCollected: 0,
    needScore: score,
    priorityLevel: priority,
    status: "submitted",
    municipality: municipality || "صبراتة",
    latitude: latitude || (32.793 + (Math.random() - 0.5) * 0.05),
    longitude: longitude || (12.482 + (Math.random() - 0.5) * 0.05),
    housingPhotos,
    bioVerification,
    createdAt: new Date().toISOString()
  };

  draftState.cases.push(newCase);
  
  res.json({ status: "success", case: newCase });

      });
    });

// Update/Edit family status by Citizen
router.put("/cases/:id/family", async (req, res) => {
      await TransactionManager.withTransaction(async (draftState) => {
        
  const { id } = req.params;
  const { family } = req.body;
  const caseObj = draftState.cases.find(c => c.id === id);
  if (!caseObj) {
    return res.status(404).json({ error: "الحالة غير موجودة" });
  }

  caseObj.family = family;
  caseObj.needScore = calculateNeedScore(family);
  caseObj.priorityLevel = determinePriorityLevel(caseObj.needScore);
  
  res.json({ status: "success", case: caseObj });

      });
    });

// Fetch all cases
// 1. الربط مع السجل المدني (Integration & Validation)
router.get("/civil-registry/verify/:nationalId", async (req, res) => {
  const { nationalId } = req.params;
  
  // Simulate delay for API
  await new Promise(r => setTimeout(r, 600));

  // In a real system, this would make an mTLS or VPN-secured call to the Civil Registry API
  // For demonstration, we simulate checking if nationalId is valid, active, and return family status
  if (!nationalId || nationalId.length !== 12) {
    return res.status(400).json({ status: "error", message: "رقم وطني غير صحيح. يجب أن يتكون من 12 رقم." });
  }

  // Simulate fraud detection (e.g. deceased citizen or fake ID)
  if (nationalId.startsWith("1111")) {
    return res.status(403).json({ status: "error", message: "تنبيه أمني: الرقم الوطني مسجل كحالة (وفاة) في السجل المدني. المعاملة مرفوضة." });
  }

  res.json({
    status: "success",
    data: {
      isValid: true,
      familyName: "عائلة افتراضية",
      activeMembers: 5,
      isFlagged: false,
      lastUpdated: new Date().toISOString()
    }
  });
});

// 2. الربط مع المنظومة المصرفية (Bank System Integration)
router.post("/bank/disburse", async (req, res) => {
  const { caseId, amount, iban } = req.body;
  if (!iban || iban.length < 15) {
    return res.status(400).json({ status: "error", message: "رقم IBAN غير صحيح أو مفقود." });
  }
  
  // Simulate bank API call
  await new Promise(r => setTimeout(r, 800));

  res.json({
    status: "success",
    transactionId: "TRX-BANK-" + Date.now(),
    message: "تم إصدار أمر الدفع للمنظومة المصرفية بنجاح."
  });
});

// 5. التحليلات ودعم القرار (Analytics & BI)
router.get("/analytics/dashboard", (req, res) => {
  // Aggregate data for BI Dashboard
  const activeCases = state.cases.filter(c => c.status === "published" || c.status === "funded").length;
  const criticalCases = state.cases.filter(c => c.priorityLevel === "عاجل").length;
  const totalFunds = state.funds.reduce((acc, f) => acc + f.balance, 0);

  // Example of predictive/analytical insights
  const insights = [
    { type: "warning", message: "تتركز حالات العوز الشديد (70%) في بلديات الأطراف والمناطق النائية." },
    { type: "alert", message: "هناك نقص حاد في تبرعات (صندوق الطوارئ) هذا الشهر مقارنة بالحاجة الميدانية." },
    { type: "success", message: "ارتفاع معدل التبرع بنسبة 15% بعد إطلاق حملة الشفافية." }
  ];

  res.json({
    status: "success",
    data: {
      activeCases,
      criticalCases,
      totalFunds,
      insights
    }
  });
});
router.get("/cases", (req, res) => {
  const tokenHeader = req.headers.authorization;
  let userRole = "guest";
  if (tokenHeader) {
    const token = tokenHeader.split(" ")[1];
    const sessionStr = state.sessions[token];
    if (sessionStr) {
      userRole = JSON.parse(sessionStr).role;
    }
  }

  // Filter or Mask based on RBAC
  let returnCases = [...state.cases];
  
  if (userRole === "evaluation_committee") {
    // Mask names and National IDs
    returnCases = returnCases.map(c => ({
      ...c,
      userId: "***",
      description: c.description.replace(/\d{12}/g, "************"),
    }));
  }

  res.json(returnCases);
});

// Delete a case
router.delete("/cases/:id", async (req, res) => {
      await TransactionManager.withTransaction(async (draftState) => {
        
  const { id } = req.params;
  const initialLength = draftState.cases.length;
  draftState.cases = draftState.cases.filter(c => c.id !== id);
  if (draftState.cases.length === initialLength) {
    return res.status(404).json({ error: "Case not found" });
  }
  
  res.json({ status: "success", message: "Case deleted successfully" });

      });
    });

// Update/Customize a case
router.put("/cases/:id", async (req, res) => {
      await TransactionManager.withTransaction(async (draftState) => {
        
  const { id } = req.params;
  const caseIndex = draftState.cases.findIndex(c => c.id === id);
  if (caseIndex === -1) {
    return res.status(404).json({ error: "Case not found" });
  }
  
  // Merge incoming updates
  draftState.cases[caseIndex] = {
    ...draftState.cases[caseIndex],
    ...req.body,
    // Keep immutable values
    id: draftState.cases[caseIndex].id,
    caseNumber: draftState.cases[caseIndex].caseNumber,
    createdAt: draftState.cases[caseIndex].createdAt
  };
  
  
  res.json({ status: "success", case: draftState.cases[caseIndex] });

      });
    });

// Get single case details
router.get("/cases/:id", (req, res) => {
  const c = state.cases.find(item => item.id === req.params.id);
  if (!c) {
    return res.status(404).json({ error: "Case not found" });
  }
  res.json(c);
});

// Researcher scores / field visit report
router.post("/cases/:id/visit", async (req, res) => {
      await TransactionManager.withTransaction(async (draftState) => {
        
  const { id } = req.params;
  const { researcherScores, researcherId } = req.body;
  const caseObj = draftState.cases.find(c => c.id === id);
  if (!caseObj) {
    return res.status(404).json({ error: "Case not found" });
  }

  // Recalculate score combining family self-reported income + researcher's actual scores
  const scoreBase = caseObj.needScore;
  const researcherMod = (10 - researcherScores.housing) * 1.5 + (10 - researcherScores.health) * 1.5;
  const finalScore = Math.min(Math.round(scoreBase + researcherMod), 100);

  caseObj.needScore = finalScore;
  caseObj.priorityLevel = determinePriorityLevel(finalScore);
  caseObj.status = "field_visit_done";
  caseObj.assignedResearcherId = researcherId;
  caseObj.researcherScores = researcherScores;
  
  
  res.json({ status: "success", case: caseObj });

      });
    });

// Admin approves case -> moves to committee_approved
router.post("/cases/:id/approve", async (req, res) => {
      await TransactionManager.withTransaction(async (draftState) => {
        
  const { id } = req.params;
  const caseObj = draftState.cases.find(c => c.id === id);
  if (!caseObj) {
    return res.status(404).json({ error: "Case not found" });
  }

  caseObj.status = "committee_approved";
  caseObj.approvedAt = new Date().toISOString();
  
  res.json({ status: "success", case: caseObj });

      });
    });

// Admin rejects case
router.post("/cases/:id/reject", async (req, res) => {
      await TransactionManager.withTransaction(async (draftState) => {
        
  const { id } = req.params;
  const { reason } = req.body;
  const caseObj = draftState.cases.find(c => c.id === id);
  if (!caseObj) {
    return res.status(404).json({ error: "Case not found" });
  }

  caseObj.status = "rejected";
  caseObj.rejectionReason = reason;
  
  res.json({ status: "success", case: caseObj });

      });
    });

router.post("/cases/:id/delivery", async (req, res) => {
      await TransactionManager.withTransaction(async (draftState) => {
        
  const { id } = req.params;
  const { volunteerId, bioVerification } = req.body;
  const caseObj = draftState.cases.find(c => c.id === id);
  if (!caseObj) {
    return res.status(404).json({ error: "Case not found" });
  }

  caseObj.assignedVolunteerId = volunteerId;
  caseObj.deliveryBioVerification = bioVerification;
  caseObj.deliveryConfirmedAt = new Date().toISOString();
  caseObj.status = "closed";
  caseObj.closedAt = new Date().toISOString();

  // Create an automated donor impact report if it has a donor
  // (We'll check if there are transactions for this case)
  // Let's add a general app notification
  draftState.notifications.push({
    id: "notif-" + Date.now().toString(),
    title: "تقرير أثر: تم إيصال المساعدة",
    message: `بفضل الله ثم تبرعاتكم، تم إيصال المساعدة للحالة رقم ${caseObj.caseNumber}.`,
    type: "donation",
    createdAt: new Date().toISOString(),
    read: false,
    userId: "" // Broadcast to those who care, or we could target donors directly
  });

  
  res.json({ status: "success", case: caseObj });

      });
    });

router.post("/cases/:id/appeal", async (req, res) => {
      await TransactionManager.withTransaction(async (draftState) => {
        
  const { id } = req.params;
  const { reason } = req.body;
  const caseObj = draftState.cases.find(c => c.id === id);
  if (!caseObj) {
    return res.status(404).json({ error: "Case not found" });
  }

  caseObj.status = "appealed";
  caseObj.appealReason = reason;
  caseObj.appealedAt = new Date().toISOString();
  
  res.json({ status: "success", case: caseObj });

      });
    });

// Charity adopts case -> publishes it
router.post("/cases/:id/adopt", async (req, res) => {
      await TransactionManager.withTransaction(async (draftState) => {
        
  const { id } = req.params;
  const { charityId } = req.body;
  const caseObj = draftState.cases.find(c => c.id === id);
  if (!caseObj) {
    return res.status(404).json({ error: "Case not found" });
  }

  caseObj.status = "published";
  caseObj.assignedCharityId = charityId;
  
  res.json({ status: "success", case: caseObj });

      });
    });

// Process donation (with double-entry ledger tracking)
router.post("/donations", async (req, res) => {
      await TransactionManager.withTransaction(async (draftState) => {
        
  const { donorId, donorNameOverride, caseId, projectId, fundType, amount, currency, paymentMethod } = req.body;

  const rate = currency === "USD" ? 4.85 : currency === "EUR" ? 5.25 : 1.0; // Mock exchange rate to Libyan Dinar (LYD)
  const displayAmount = amount;
  const amountLYD = Math.round(amount * rate);

  const count = draftState.transactions.length + 1;
  const receiptNumber = `RCV-2026-${String(count).padStart(6, "0")}`;
  const trackingHash = `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`;

  const tx: OmniTransaction = {
    id: `tx-${Date.now()}`,
    receiptNumber,
    donorId,
    donorNameOverride,
    caseId,
    projectId,
    fundType,
    amount: amountLYD,
    currency,
    displayAmount,
    exchangeRate: rate,
    paymentMethod,
    paymentReference: `${paymentMethod.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
    trackingHash,
    createdAt: new Date().toISOString()
  };

  draftState.transactions.push(tx);
  
  logAudit(donorId || donorNameOverride || "Anonymous", "DONATION_RECEIVED", receiptNumber, `Received ${displayAmount} ${currency} for ${caseId || projectId || fundType}. Hash: ${trackingHash}`);

  // Update target
  if (caseId) {
    const caseObj = draftState.cases.find(c => c.id === caseId);
    if (caseObj) {
      caseObj.amountCollected = Math.min(caseObj.amountCollected + amountLYD, caseObj.amountRequired);
      if (caseObj.amountCollected >= caseObj.amountRequired) {
        caseObj.status = "funded";
      }
    }
  } else if (projectId) {
    const proj = draftState.projects.find(p => p.id === projectId);
    if (proj) {
      proj.collectedAmount = Math.min(proj.collectedAmount + amountLYD, proj.targetAmount);
      if (proj.collectedAmount >= proj.targetAmount) {
        proj.status = "completed";
      }
    }
  }

  // Update central fund balance
  const fund = draftState.funds.find(f => f.fundType === fundType);
  if (fund) {
    fund.balance += amountLYD;
    fund.totalIn += amountLYD;
  }

  // Double-entry accounting ledger record
  const creditAccount = `حساب تبرعات الصندوق (${fundType})`;
  const debitAccount = caseId 
    ? `حساب مستحقات الحالات النشطة (${caseId})`
    : projectId
    ? `حساب مستحقات المشاريع الكبرى (${projectId})`
    : `أرصدة الصندوق البنكية (${paymentMethod})`;

  const ledgerEntry: LedgerEntry = {
    id: `le-${Date.now()}`,
    entryDate: new Date().toISOString(),
    description: `استلام تبرع بقيمة ${amountLYD} د.ل لصندوق ${fundType} عبر ${paymentMethod} (${caseId ? 'إعانة حالة' : projectId ? 'مساهمة مشروع' : 'تبرع عام'})`,
    debitAccount,
    creditAccount,
    amount: amountLYD,
    relatedDonationId: tx.id,
    createdBy: donorNameOverride || "فاعل خير"
  };

  draftState.ledger.push(ledgerEntry);

  // Reward Gamification points if logged-in donor
  if (donorId) {
    const user = draftState.users.find(u => u.id === donorId);
    if (user) {
      user.gamificationPoints += Math.round(amountLYD / 10);
    }
  }

  
  res.json({ status: "success", transaction: tx });

      });
    });

// Charity safe disbursement (Anti-Double-Withdrawal Prevention)
router.post("/cases/:id/disburse", async (req, res) => {
      await TransactionManager.withTransaction(async (draftState) => {
        
  const { id } = req.params;
  const { charityId } = req.body;
  const caseObj = draftState.cases.find(c => c.id === id);
  if (!caseObj) {
    return res.status(404).json({ error: "Case not found" });
  }

  // Guard: Safe disbursement checks
  if (caseObj.status !== "funded") {
    return res.status(400).json({ error: "محاولة صرف غير آمنة: هذه الحالة لم تكتمل تبرعاتها بعد أو تم صرفها مسبقاً!" });
  }

  // Update case status
  caseObj.status = "closed";
  caseObj.closedAt = new Date().toISOString();
  // --- 2. الربط مع المنظومة المصرفية (Bank System Integration) ---
  // In a real scenario, we would trigger an external bank API here using (caseObj as any).iban
  if ((caseObj as any).iban) {
    try {
      console.log(`[BANK_API] Initiating transfer of ${caseObj.amountCollected} to IBAN ${(caseObj as any).iban}`);
      // Simulate bank network delay
      // await new Promise(r => setTimeout(r, 800));
      console.log(`[BANK_API] Transfer successful. TxID: TRX-BANK-${Date.now()}`);
    } catch (e) {
      console.error("[BANK_API] Transfer failed", e);
      return res.status(500).json({ error: "فشل التحويل المصرفي، يرجى المحاولة لاحقاً." });
    }
  } else {
    // Some cases might be disbursed in cash or kind, depending on type
    console.log(`[BANK_API] No IBAN provided, proceeding with manual/in-kind disbursement.`);
  }
  // ---------------------------------------------------------------

  // Deduct from fund balance (using the case's corresponding fund)
  // Standard is Sadakah/Zakat
  const targetFund = caseObj.needTypes.includes("علاج") || caseObj.needTypes.includes("أجهزة طبية") ? "طوارئ" : "صدقة";
  const fund = draftState.funds.find(f => f.fundType === targetFund);
  if (fund) {
    fund.balance = Math.max(fund.balance - caseObj.amountRequired, 0);
    fund.totalOut += caseObj.amountRequired;
  }

  // Create disbursement accounting log
  const ledgerEntry: LedgerEntry = {
    id: `le-${Date.now()}`,
    entryDate: new Date().toISOString(),
    description: `صرف المساعدات النقدية والنهائية للحالة (${caseObj.caseNumber}) بواسطة الجمعية الخيرية`,
    debitAccount: `حساب تسوية المساعدات المدفوعة`,
    creditAccount: `أرصدة الصندوق البنكية (${targetFund})`,
    amount: caseObj.amountRequired,
    createdBy: charityId
  };

  draftState.ledger.push(ledgerEntry);

  
  res.json({ status: "success", case: caseObj });

      });
    });

// Submit Community report / Anti-fraud


export default router;
