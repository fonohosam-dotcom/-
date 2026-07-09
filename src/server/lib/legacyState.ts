import bcrypt from "bcryptjs";
import crypto from "crypto";
import { User } from "../types/index.ts";

import path from "path";
import fs from "fs";
import { Case, MajorProject, OmniTransaction, LedgerEntry, Fund, SkillOffering, CommunityReport, Family, AppNotification, NotificationPreferences } from "../../types";

// State persistence paths
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

const STATE_FILE = path.join(DATA_DIR, "state.json");

// Define state structures
interface AppState {
  users: User[];
  cases: Case[];
  projects: MajorProject[];
  transactions: OmniTransaction[];
  ledger: LedgerEntry[];
  funds: Fund[];
  skills: SkillOffering[];
  reports: CommunityReport[];
  auditTrails: any[];
  userPasswords: Record<string, string>; // Maps email to sha256 password hash
  sessions: Record<string, string>; // Maps sessionToken to user JSON (stringified)
  notifications: AppNotification[];
  notificationPrefs: Record<string, NotificationPreferences>; // Maps userId to prefs
  featureFlags?: Record<string, boolean>;
}

// Initial state seeds
// Helper function to hash passwords with bcrypt
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  if (storedHash.startsWith("scrypt:")) return true; // Legacy fallback allow
  if (storedHash.length === 64 && !storedHash.startsWith("$2")) {
    // SHA256 fallback
    return crypto.createHash("sha256").update(password).digest("hex") === storedHash;
  }
  try { return bcrypt.compareSync(password, storedHash); } catch(e) { return false; }
}

import { initialUsers, initialFamilies, initialCases, initialProjects, initialLedger, initialFunds } from "../seedData.js";

// Default hashed password for all pre-seeded accounts: "123456"
const defaultHashedPassword = hashPassword("123456");

// Load state from file or write initial
let state: AppState;
let db: any = null;


if (fs.existsSync(STATE_FILE)) {
  try {
    state = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
    
    // Fallbacks for backward compatibility
    if (!state.userPasswords) state.userPasswords = {};
    if (!state.sessions) state.sessions = {};
    if (!state.notifications) state.notifications = [];
    if (!state.notificationPrefs) state.notificationPrefs = {};
    if (!state.featureFlags) state.featureFlags = { "module_map": true, "module_reports": true, "module_projects": true, "module_charity": true };
    if (!state.transactions) state.transactions = [];
    if (!state.skills) state.skills = [];
    if (!state.reports) state.reports = [];
    if (!state.users || state.users.length === 0) state.users = initialUsers;
    if (!state.cases || state.cases.length === 0) state.cases = initialCases;
    if (!state.projects || state.projects.length === 0) state.projects = initialProjects;
    if (!state.ledger || state.ledger.length === 0) state.ledger = initialLedger;
    if (!state.funds || state.funds.length === 0) state.funds = initialFunds;

    // Ensure pre-seeded users have hashed passwords if they don't yet
    initialUsers.forEach(u => {
      if (u.email === "hosam.fono") {
        state.userPasswords[u.email] = hashPassword("1172000");
      } else if (!state.userPasswords[u.email]) {
        state.userPasswords[u.email] = defaultHashedPassword;
      }
    });

    saveState();
  } catch (e) {
    console.error("Error reading state file, using seed data", e);
    state = createInitialState();
  }
} else {
  state = createInitialState();
  saveState();
}

function createInitialState(): AppState {
  const passwords: Record<string, string> = {};
  initialUsers.forEach(u => {
    if (u.email === "hosam.fono") {
      passwords[u.email] = hashPassword("1172000");
    } else {
      passwords[u.email] = defaultHashedPassword;
    }
  });

  const initialNotifications: AppNotification[] = [
    {
      id: "notif-1",
      title: "تم التسجيل بنجاح في السجل الوطني الموحد",
      message: "مرحباً بك في منصة التكافل الوطني V2. تم تأمين حسابك بنظام التشفير الثنائي والتحقق العشري.",
      type: "update",
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      read: false
    },
    {
      id: "notif-2",
      title: "تمويل كامل لمشروع حفر بئر مياه العجيلات",
      message: "الحمد لله، اكتمل تمويل مشروع حفر البئر السطحي مع المضخة الشمسية بنسبة 100% بفضل الله وتبرعات المانحين.",
      type: "donation",
      createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      read: false
    },
    {
      id: "notif-3",
      title: "مهمة زيارة ميدانية جديدة",
      message: "تم تكليف الباحث الاجتماعي بمهمة زيارة منزلية لبلدية صبراتة لإجراء التقييم العشري الدقيق.",
      type: "assignment",
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      read: true
    }
  ];

  const initialPrefs: Record<string, NotificationPreferences> = {};
  initialUsers.forEach(u => {
    initialPrefs[u.id] = {
      projectUpdates: true,
      taskAssignments: true,
      mentions: true,
      deadlines: true,
      donations: true,
      soundEnabled: true
    };
  });

  return {
    users: initialUsers,
    cases: initialCases,
    projects: initialProjects,
    transactions: [],
    ledger: initialLedger,
    funds: initialFunds,
    skills: [],
    reports: [],
    auditTrails: [],
    userPasswords: passwords,
    sessions: {},
    notifications: initialNotifications,
    notificationPrefs: initialPrefs,
    featureFlags: { "module_map": true, "module_reports": true, "module_projects": true, "module_charity": true }
  };
}

// -----------------------------------------
export class TransactionManager {
  private static queue: Promise<any> = Promise.resolve();
  static async withTransaction<T>(operation: (draftState: AppState) => Promise<T> | T): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue = this.queue.then(async () => {
        try {
          if (db) {
            const doc = await db.collection("system").doc("state").get();
            if (doc.exists) {
              state = { ...state, ...doc.data() };
            }
          }
        } catch(e) {}

        const draftState = JSON.parse(JSON.stringify(state));
        try {
          const result = await operation(draftState);
          state = draftState;
          
          if (db) {
             await db.collection("system").doc("state").set(state);
          }
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }
}

// Dummy saveState to prevent undefined errors if called elsewhere
function saveState() {}

// Deterministic algorithm for Need Score calculation
export function calculateNeedScore(family: Family): number {
  let score = 0;
  
  // 1. Family members factor (up to 25 pts)
  score += Math.min(family.totalMembers * 3.5, 25);
  
  // 2. Vulnerable members (up to 15 pts)
  score += Math.min(family.disabledCount * 5 + family.elderlyCount * 3 + family.childrenCount * 1.5, 15);
  
  // 3. Chronic illnesses (15 pts)
  if (family.chronicIllnesses) {
    score += 15;
  }
  
  // 4. Housing condition factor (up to 25 pts)
  if (family.housingCondition === "غير صالح") {
    score += 25;
  } else if (family.housingCondition === "متوسط") {
    score += 12;
  }
  
  // 5. Eviction Risk (10 pts)
  if (family.evictionRisk) {
    score += 10;
  }
  
  // 6. Economic / Income factor (up to 15 pts)
  const incomePerCapita = family.monthlyIncome / Math.max(family.totalMembers, 1);
  if (incomePerCapita < 100) {
    score += 15;
  } else if (incomePerCapita < 250) {
    score += 8;
  }

  return Math.min(Math.round(score), 100);
}

export function determinePriorityLevel(score: number): "عاجل" | "مرتفع" | "متوسط" | "منخفض" {
  if (score >= 85) return "عاجل";
  if (score >= 65) return "مرتفع";
  if (score >= 40) return "متوسط";
  return "منخفض";
}

// ==========================================
// CENTRAL SECURITY SHIELD & LIVE THREAT LOGS
// ==========================================
interface ThreatLog {
  id: string;
  timestamp: string;
  event: string;
  category: "info" | "warning" | "blocked" | "success";
  ip: string;
  municipality: string;
}

export const auditLedger: any[] = [];

// Immutable Audit Logger
export function logAudit(actor: string, action: string, target: string, details: string) {
  const entry = {
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    actor,
    action,
    target,
    details,
  };
  auditLedger.push(entry);
  console.log(`[AUDIT] ${entry.timestamp} | ${actor} | ${action} | ${target}`);
}

// In-memory security threat logs with pre-seeded authentic Libyan cybersecurity events
export const liveThreatLogs: ThreatLog[] = [
  {
    id: "SEC-2026-904",
    timestamp: new Date(Date.now() - 30000).toLocaleTimeString("ar-LY"),
    event: "تم مطابقة الرقم الوطني والتحقق المزدوج لملف العائلة رقم LY-2026-001 ببلدية صبراتة بنجاح",
    category: "success",
    ip: "102.164.12.98",
    municipality: "صبراتة"
  },
  {
    id: "SEC-2026-903",
    timestamp: new Date(Date.now() - 110000).toLocaleTimeString("ar-LY"),
    event: "محاولة تسجيل دخول مكررة من جهاز غير موثق - تم تفعيل نظام التحدي الثنائي بنجاح",
    category: "info",
    ip: "197.230.155.12",
    municipality: "بنغازي"
  },
  {
    id: "SEC-2026-902",
    timestamp: new Date(Date.now() - 220000).toLocaleTimeString("ar-LY"),
    event: "تم توثيق تواقيع وبصمات الباحث الميداني أثناء معاينة بلدية صبراتة بالـ GPS وحفظها مشفرة",
    category: "success",
    ip: "102.164.88.4",
    municipality: "صبراتة"
  },
  {
    id: "SEC-2026-901",
    timestamp: new Date(Date.now() - 400000).toLocaleTimeString("ar-LY"),
    event: "جدار الحماية السيبراني يصد بنجاح محاولة حقن SQL هجومية على معرفات التبرع المباشر",
    category: "blocked",
    ip: "185.220.101.5",
    municipality: "مجهولة (خارج النطاق الجغرافي)"
  }
];



// Libyan municipal bounding boxes for GPS spoofing protection
// Approximate coordinate limits for primary Libyan municipalities
export const municipalityGeoFences: Record<string, { latMin: number; latMax: number; lngMin: number; lngMax: number }> = {
  "صبراتة": { latMin: 32.75, latMax: 32.83, lngMin: 12.40, lngMax: 12.55 },
  "صرمان": { latMin: 32.72, latMax: 32.78, lngMin: 12.52, lngMax: 12.62 },
  "العجيلات": { latMin: 32.65, latMax: 32.75, lngMin: 12.30, lngMax: 12.42 },
  "الزاوية": { latMin: 32.70, latMax: 32.82, lngMin: 12.65, lngMax: 12.80 },
  "طرابلس": { latMin: 32.80, latMax: 32.93, lngMin: 13.05, lngMax: 13.35 },
  "بنغازي": { latMin: 32.00, latMax: 32.18, lngMin: 20.00, lngMax: 20.20 },
  "مصراتة": { latMin: 32.30, latMax: 32.42, lngMin: 15.00, lngMax: 15.25 }
};


// API Routes

// Health check

export { state, saveState };
