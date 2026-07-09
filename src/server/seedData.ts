import { User, Case, MajorProject, Fund, LedgerEntry, Family } from "../types";

export const initialUsers: User[] = [
  { id: "super-admin", email: "hosam.fono", fullName: "حسام الدين الفيتوري احميد فونو", role: "admin", gamificationPoints: 1000, municipality: "طرابلس", isSuperAdmin: true },
  { id: "1", email: "admin@takaful.ly", fullName: "فريق الإدارة الوطنية العليا", role: "admin", gamificationPoints: 500, municipality: "صبراتة" },
  { id: "2", email: "citizen1@takaful.ly", fullName: "حسام فوزي غانم", role: "citizen", municipality: "صبراتة", nationalId: "119950123456", phone: "0912345678", address: "شارع الآثار، وسط المدينة", gamificationPoints: 0 },
  { id: "3", email: "researcher1@takaful.ly", fullName: "أ. خليل التواتي", role: "researcher", municipality: "صبراتة", nationalId: "219800654321", phone: "0923456789", address: "محلة غوط الرمان", gamificationPoints: 0 },
  { id: "4", email: "charity1@takaful.ly", fullName: "جمعية سبل السلام الخيرية الوطنية", role: "charity", municipality: "صبراتة", phone: "0945678901", address: "طريق الساحل", gamificationPoints: 0 },
  { id: "5", email: "donor1@takaful.ly", fullName: "أبو بكر محمد السنوسي", role: "donor", gamificationPoints: 120, phone: "0956789012" }
];

export const initialFamilies: Family[] = [
  {
    totalMembers: 7,
    childrenCount: 4,
    elderlyCount: 1,
    disabledCount: 1,
    monthlyIncome: 450,
    rentAmount: 350,
    housingCondition: "متوسط",
    evictionRisk: true,
    maritalStatus: "متزوج",
    chronicIllnesses: true,
    incomeSources: ["عمل غير ثابت"]
  }
];

export const initialCases: Case[] = [
  {
    id: "case-001",
    caseNumber: "LY-2026-0001",
    userId: "2",
    family: initialFamilies[0],
    needTypes: ["غذاء", "ترميم منازل", "أجهزة طبية"],
    description: "أسرة من 7 أفراد في صبراتة، المعيل الرئيسي يعاني من بتر في الساق وإعاقة دائمة، السكن الحالي متصدع الجدران ومسقوف بصفائح صفيح تسرب مياه الأمطار في الشتاء. قيمة الدخل الشهري لا تتعدى منحة التضامن البسيطة.",
    amountRequired: 12500,
    amountCollected: 0,
    needScore: 84,
    priorityLevel: "عاجل",
    status: "submitted",
    municipality: "صبراتة",
    latitude: 32.793,
    longitude: 12.482,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    // Hidden attributes for fraud detection testing
    iban: "LY9300001234567890",
    phone: "0911234567"
  } as any,
  {
    id: "case-002",
    caseNumber: "LY-2026-0002",
    userId: "3", // Made userId 3 so it's a different user
    family: {
      totalMembers: 5,
      childrenCount: 4,
      elderlyCount: 0,
      disabledCount: 0,
      monthlyIncome: 0,
      rentAmount: 500,
      housingCondition: "جيد",
      evictionRisk: true,
      maritalStatus: "أرملة",
      chronicIllnesses: false,
      incomeSources: ["لا يوجد دخل"]
    },
    needTypes: ["إيجار", "كفالة أيتام"],
    description: "أرملة توفي زوجها إثر حادث سير، تعول أربعة أطفال أكبرهم يبلغ من العمر 9 سنوات. الأسرة مهددة بالطرد من المنزل في صرمان بسبب عجزها عن دفع قيمة الإيجار المتراكم لستة أشهر متتالية.",
    amountRequired: 3000,
    amountCollected: 1800,
    needScore: 78,
    priorityLevel: "مرتفع",
    status: "published",
    municipality: "صرمان",
    latitude: 32.756,
    longitude: 12.573,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    // Hidden attributes for fraud detection testing
    iban: "LY9300001234567890", // Duplicate IBAN across different municipality
    phone: "0911234567" // Duplicate Phone across different user
  } as any,
  {
    id: "case-003",
    caseNumber: "LY-2026-0003",
    userId: "2",
    family: {
      totalMembers: 3,
      childrenCount: 1,
      elderlyCount: 0,
      disabledCount: 1,
      monthlyIncome: 600,
      rentAmount: 0,
      housingCondition: "جيد",
      evictionRisk: false,
      maritalStatus: "متزوج",
      chronicIllnesses: true,
      incomeSources: ["معاش"]
    },
    needTypes: ["علاج", "أجهزة طبية"],
    description: "طفل يبلغ من العمر 5 سنوات يحتاج عاجلاً لاستبدال جهاز قوقعة الأذن التالف لمتابعة النطق والتعليم، والأسرة عاجزة تماماً عن سداد قيمته الباهظة في عيادات العجيلات التخصصية.",
    amountRequired: 7500,
    amountCollected: 7500,
    needScore: 92,
    priorityLevel: "عاجل",
    status: "funded",
    municipality: "العجيلات",
    latitude: 32.721,
    longitude: 12.378,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "case-004",
    caseNumber: "LY-2026-0004",
    userId: "2",
    family: {
      totalMembers: 4,
      childrenCount: 2,
      elderlyCount: 2,
      disabledCount: 0,
      monthlyIncome: 900,
      rentAmount: 0,
      housingCondition: "متوسط",
      evictionRisk: false,
      maritalStatus: "متزوج",
      chronicIllnesses: false,
      incomeSources: ["راتب خاص"]
    },
    needTypes: ["غذاء", "ملابس"],
    description: "توفير السلات الغذائية الرمضانية والملابس الأساسية لعائلة متضررة من تدني القدرة الشرائية في صبراتة.",
    amountRequired: 800,
    amountCollected: 800,
    needScore: 32,
    priorityLevel: "منخفض",
    status: "closed",
    municipality: "صبراتة",
    latitude: 32.788,
    longitude: 12.478,
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    closedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const initialProjects: MajorProject[] = [
  {
    id: "proj-001",
    projectNumber: "MP-2026-0001",
    category: "well",
    title: "حفر بئر مياه سطحي مع مضخة شمسية وخزان سعة 10 آلاف لتر",
    description: "يهدف المشروع إلى توفير مياه صالحة للشرب والري لقرية نائية في محيط بلدية العجيلات تعاني من شح مياه الآبار وانقطاع الكهرباء المستمر عن مضخات المياه التقليدية. سيخدم هذا المشروع قرابة 40 عائلة وعابري السبيل.",
    municipality: "العجيلات",
    targetAmount: 25000,
    collectedAmount: 18500,
    coverImage: "https://images.unsplash.com/photo-1541944743827-e04aa6427c33?w=800&auto=format&fit=crop&q=60",
    status: "active",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "proj-002",
    projectNumber: "MP-2026-0002",
    category: "mosque",
    title: "ترميم الجدران وصيانة الأسقف المتصدعة لمسجد صبراتة العتيق",
    description: "مشروع صيانة وتجديد التصدعات الخطيرة في القبة والأسقف لمسجد تاريخي يجمع المصلين ببلدية صبراتة، لحماية حرمة المسجد وحماية المصلين من خطر سقوط الكتل الخرسانية المتضررة من عوامل الطقس والرطوبة العالية.",
    municipality: "صبراتة",
    targetAmount: 45000,
    collectedAmount: 12000,
    coverImage: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&auto=format&fit=crop&q=60",
    status: "active",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "proj-003",
    projectNumber: "MP-2026-0003",
    category: "orphan_care",
    title: "تجهيز وتأثيث دار كفالة ورعاية لليتامى والقصر ببلدية صبراتة",
    description: "توفير غرف نوم كاملة، ومطعم مركزي، وفصول دراسية وتأثيث صالات ألعاب وأجهزة تكييف لمقر رعاية اليتامى الذي يخدم أكثر من 35 طفلاً فاقداً للأهلية الاجتماعية بالمنطقة الغربية.",
    municipality: "صبراتة",
    targetAmount: 60000,
    collectedAmount: 41000,
    coverImage: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800&auto=format&fit=crop&q=60",
    status: "active",
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const initialFunds: Fund[] = [
  { id: "f1", fundType: "زكاة", balance: 15400, totalIn: 18400, totalOut: 3000 },
  { id: "f2", fundType: "صدقة", balance: 9800, totalIn: 11000, totalOut: 1200 },
  { id: "f3", fundType: "كفالة_يتيم", balance: 5500, totalIn: 5500, totalOut: 0 },
  { id: "f4", fundType: "صدقة_جارية", balance: 22000, totalIn: 25000, totalOut: 3000 },
  { id: "f5", fundType: "طوارئ", balance: 12500, totalIn: 12500, totalOut: 0 }
];

export const initialLedger: LedgerEntry[] = [
  { id: "le-001", entryDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), description: "تأسيس صندوق زكاة المال بتمويل أولي", debitAccount: "الصندوق زكاة", creditAccount: "أرصدة المانحين التأسيسية", amount: 15400, createdBy: "النظام الآلي" },
  { id: "le-002", entryDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), description: "تأسيس صندوق الصدقات العامة بتمويل أولي", debitAccount: "الصندوق صدقة", creditAccount: "أرصدة المانحين التأسيسية", amount: 9800, createdBy: "النظام الآلي" },
  { id: "le-003", entryDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), description: "تمويل بئر المياه - مشروع MP-2026-0001", debitAccount: "الصندوق صدقة_جارية", creditAccount: "أرصدة المانحين التأسيسية", amount: 18500, createdBy: "النظام الآلي" }
];

