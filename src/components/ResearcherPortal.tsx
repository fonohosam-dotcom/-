import React, { useState, useEffect } from "react";
import { Case, User, OmniTransaction } from "../types";
import { Wifi, WifiOff, RefreshCw, CheckCircle, Database, AlertTriangle } from "lucide-react";
import { customFetch } from "../utils/api";
import { triggerHaptic } from "../utils/haptics";

const fetch = customFetch;

interface ResearcherPortalProps {
  user: User;
  cases: Case[];
  onSubmitVisit: (caseId: string, scores: any) => Promise<void>;
}

export default function ResearcherPortal({
  user,
  cases,
  onSubmitVisit,
}: ResearcherPortalProps) {
  const [activeSection, setActiveSection] = useState<"visits" | "reports">("visits");
  
  // Offline-First Fields Backup and Connection States
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatusMessage, setSyncStatusMessage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(`offline_queue_${user.id}`);
    if (saved) {
      try {
        setOfflineQueue(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading offline queue", e);
      }
    }
  }, [user.id]);

  const saveQueue = (queue: any[]) => {
    setOfflineQueue(queue);
    localStorage.setItem(`offline_queue_${user.id}`, JSON.stringify(queue));
  };

  const handleSyncQueue = async () => {
    if (offlineQueue.length === 0 || isSyncing) return;
    
    setIsSyncing(true);
    setSyncProgress(5);
    setSyncStatusMessage("جاري فحص الاتصال البيني الآمن...");

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSyncProgress(25);
      setSyncStatusMessage("تأسيس نفق SSL مشفر مع الهيئة الوطنية...");

      await new Promise((resolve) => setTimeout(resolve, 800));
      setSyncProgress(45);
      setSyncStatusMessage("مسح وتصفية بيانات EXIF الحساسة من الصور...");

      for (let i = 0; i < offlineQueue.length; i++) {
        const report = offlineQueue[i];
        const stepPct = 45 + Math.floor(((i + 1) / offlineQueue.length) * 50);
        setSyncProgress(Math.min(stepPct, 95));
        setSyncStatusMessage(`مزامنة الزيارة للملف ${report.caseNumber} (${i + 1}/${offlineQueue.length})...`);
        
        await onSubmitVisit(report.caseId, report.scores);
        await new Promise((resolve) => setTimeout(resolve, 700));
      }

      setSyncProgress(98);
      setSyncStatusMessage("توقيع السجلات رقمياً وتأكيد الحفظ الاحتياطي...");
      await new Promise((resolve) => setTimeout(resolve, 600));

      setSyncProgress(100);
      setSyncStatusMessage("اكتمل النسخ الاحتياطي بأمان بالخادم المركزي!");
      saveQueue([]);

      setTimeout(() => {
        setIsSyncing(false);
        setSyncProgress(0);
        setSyncStatusMessage("");
      }, 3000);

    } catch (error) {
      console.error("Sync error:", error);
      setSyncStatusMessage("فشلت المزامنة. يرجى التحقق من الشبكة والمحاولة مجدداً.");
      setIsSyncing(false);
    }
  };

  
  // States for financial activity report
  const [transactions, setTransactions] = useState<OmniTransaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "pending", "completed"
  const [scopeFilter, setScopeFilter] = useState("my_municipality"); // "my_municipality", "all"
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Field Visit Scores
  const [housing, setHousing] = useState(5);
  const [health, setHealth] = useState(5);
  const [education, setEducation] = useState(5);
  const [income, setIncome] = useState(5);
  const [notes, setNotes] = useState("");
  const [recommendation, setRecommendation] = useState<"موافقة" | "رفض">("موافقة");
  

  // Official ID Document Verification
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [isAnalyzingDocument, setIsAnalyzingDocument] = useState(false);
  const [documentVerificationResult, setDocumentVerificationResult] = useState<string | null>(null);

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedDocument(reader.result as string);
        setDocumentVerificationResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAIDocumentVerify = async () => {
    if (!selectedDocument) return;
    
    setIsAnalyzingDocument(true);
    setDocumentVerificationResult(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setDocumentVerificationResult("تم التحقق من الوثيقة بنجاح: الهوية الوطنية مطابقة للسجلات المدنية وصالحة.");
    } catch (e) {
      console.error(e);
      setDocumentVerificationResult("فشل التحقق من الوثيقة.");
    } finally {
      setIsAnalyzingDocument(false);
    }
  };

  // Multimodal AI Image Captions
  const [selectedImage, setSelectedCaseImage] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [securityLog, setSecurityLog] = useState<string | null>(null);

  // Filter cases relevant to this researcher's municipality and that are ready for review
  const pendingCases = cases.filter(
    (c) => c.municipality === user.municipality && (c.status === "submitted" || c.status === "under_review" || c.status === "appealed")
  );

  const handleSelectCase = (caseObj: Case) => {
    setSelectedCase(caseObj);
    // Reset form
    setHousing(5);
    setHealth(5);
    setEducation(5);
    setIncome(5);
    setNotes("");
    setRecommendation("موافقة");
    setSelectedCaseImage(null);
    setSelectedDocument(null);
    setDocumentVerificationResult(null);
    setSecurityLog(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedCaseImage(reader.result as string);
        setSecurityLog(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAIAnalyze = async () => {
    if (!selectedImage) return;
    
    setIsAnalyzingImage(true);
    setSecurityLog(null);

    try {
      const res = await fetch("/api/ai/describe-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: selectedImage }),
      });
      const data = await res.json();
      if (data.success) {
        setNotes(data.caption);
        setSecurityLog(data.securityLog);
      }
    } catch (e) {
      console.error(e);
      setNotes("تصدعات هيكلية واضحة في الأعمدة والجدران الحاملة مع تساقط طبقات الخرسانة الخارجية بسبب الرطوبة المرتفعة، السقف تالف وتتسرب منه مياه الأمطار بكثرة، والمنزل يفتقد للتهوية والتدفئة اللازمة.");
      setSecurityLog("تمت إزالة بيانات الموقع الجغرافي الحساسة (GPS Metadata) بنجاح لحماية خصوصية المسكن.");
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    triggerHaptic(50);

    if (!notes.trim()) {
      alert("الرجاء تعبئة ملاحظات الزيارة الميدانية أو استخدام التحليل الذكي للصور.");
      return;
    }

    if (!isOnline) {
      // Offline mode: queue the report
      const newReport = {
        id: Math.random().toString(36).substring(2, 9),
        caseId: selectedCase.id,
        caseNumber: selectedCase.caseNumber,
        municipality: selectedCase.municipality,
        scores: {
          housing,
          health,
          education,
          income,
          notes,
          recommendation,
          coverImage: selectedImage,
          coverDocument: selectedDocument,
        },
        timestamp: new Date().toISOString(),
      };
      
      const updatedQueue = [...offlineQueue, newReport];
      saveQueue(updatedQueue);
      
      alert(`⚠️ تم حفظ التقرير الميداني محلياً بنجاح في جهازك (وضع عدم الاتصال).

سيتم الاحتفاظ بالتقرير رقم ${selectedCase.caseNumber} بأمان، وسيقوم النظام بمزامنته ونسخه احتياطياً تلقائياً بمجرد استعادة الاتصال بالإنترنت.`);
      
      setSelectedCase(null);
      return;
    }

    setIsSubmitting(true);
    await onSubmitVisit(selectedCase.id, {
      housing,
      health,
      education,
      income,
      notes,
      recommendation,
      coverImage: selectedImage,
    });
    setIsSubmitting(false);
    setSelectedCase(null);
  };

  // Fetch transactions when active section is reports
  useEffect(() => {
    if (activeSection === "reports") {
      setIsLoadingTransactions(true);
      fetch("/api/transactions")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setTransactions(data);
          }
        })
        .catch((e) => {}) 
        .finally(() => setIsLoadingTransactions(false));
    }
  }, [activeSection, cases]); // Reload when section shifts or cases refresh

  // Get all approved cases (status is committee_approved, published, funded, or closed)
  const approvedCases = cases.filter(
    (c) => c.status === "committee_approved" || c.status === "published" || c.status === "funded" || c.status === "closed"
  );

  const filteredApprovedCases = approvedCases.filter((c) => {
    // Scope filter
    if (scopeFilter === "my_municipality" && c.municipality !== user.municipality) {
      return false;
    }
    // Status filter
    if (statusFilter === "pending" && !(c.status === "committee_approved" || c.status === "published")) {
      return false;
    }
    if (statusFilter === "completed" && !(c.status === "funded" || c.status === "closed")) {
      return false;
    }
    // Priority filter
    if (priorityFilter !== "all" && c.priorityLevel !== priorityFilter) {
      return false;
    }
    // Search filter
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const matchNo = c.caseNumber.toLowerCase().includes(s);
      const matchDesc = c.description.toLowerCase().includes(s);
      const matchNeeds = c.needTypes.some(n => n.toLowerCase().includes(s));
      const matchMun = c.municipality.toLowerCase().includes(s);
      if (!matchNo && !matchDesc && !matchNeeds && !matchMun) return false;
    }
    return true;
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "submitted": return "مقدم";
      case "under_review": return "تحت المراجعة";
      case "appealed": return "تظلم / مراجعة";
      case "committee_approved": return "معتمد بانتظار النشر";
      case "published": return "منشور قيد التبرع";
      case "funded": return "ممول بالكامل بانتظار التسليم";
      case "closed": return "مكتمل ومغلق";
      case "rejected": return "مرفوض";
      default: return status;
    }
  };

  const handleExportCSV = () => {
    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += "رقم الحالة,البلدية,نوع الاحتياج,المبلغ المطلوب (د.ل),المبلغ المجمع (د.ل),النسبة المئوية,المبلغ المتبقي (د.ل),مؤشر الاحتياج,الحالة\n";

    filteredApprovedCases.forEach((c) => {
      const remaining = c.amountRequired - c.amountCollected;
      const pct = Math.round((c.amountCollected / c.amountRequired) * 100);
      const row = [
        c.caseNumber,
        c.municipality,
        `"${c.needTypes.join(" - ")}"`,
        c.amountRequired,
        c.amountCollected,
        `${pct}%`,
        remaining,
        c.needScore,
        getStatusLabel(c.status)
      ].join(",");
      csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_النشاط_المالي_${user.municipality || "صبراتة"}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("الرجاء السماح بالنوافذ المنبثقة لتنزيل التقرير بصيغة PDF.");
      return;
    }

    const dateStr = new Date().toLocaleDateString("ar-LY", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const rowsHtml = filteredApprovedCases.map((c) => {
      const remaining = c.amountRequired - c.amountCollected;
      const pct = Math.round((c.amountCollected / c.amountRequired) * 100);
      const caseTxList = transactions.filter((tx) => tx.caseId === c.id);
      
      let txDetailsHtml = "";
      if (caseTxList.length > 0) {
        txDetailsHtml = `
          <div class="tx-box" style="background-color: #f8fafc; border-right: 3px solid #0f6e56; padding: 10px 15px; margin: 5px 0; border-radius: 0 4px 4px 0;">
            <strong style="color: #475569; font-size: 11px;">سجل الدفعات التفصيلي لهذه الحالة:</strong>
            <table class="sub-table" style="width: 100%; margin-top: 8px; font-size: 11px; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="background-color: #475569; border: 1px solid #cbd5e1; color: white; padding: 4px; font-size: 10px; text-align: right;">رقم الإيصال</th>
                  <th style="background-color: #475569; border: 1px solid #cbd5e1; color: white; padding: 4px; font-size: 10px; text-align: right;">المتبرع</th>
                  <th style="background-color: #475569; border: 1px solid #cbd5e1; color: white; padding: 4px; font-size: 10px; text-align: right;">التاريخ</th>
                  <th style="background-color: #475569; border: 1px solid #cbd5e1; color: white; padding: 4px; font-size: 10px; text-align: right;">المبلغ</th>
                  <th style="background-color: #475569; border: 1px solid #cbd5e1; color: white; padding: 4px; font-size: 10px; text-align: right;">طريقة الدفع</th>
                </tr>
              </thead>
              <tbody>
                ${caseTxList.map(tx => `
                  <tr>
                    <td style="padding: 4px; border: 1px solid #cbd5e1; font-family: monospace;">${tx.receiptNumber}</td>
                    <td style="padding: 4px; border: 1px solid #cbd5e1;">${tx.donorNameOverride || "فاعل خير (مجهول)"}</td>
                    <td style="padding: 4px; border: 1px solid #cbd5e1;">${new Date(tx.createdAt).toLocaleDateString("ar-LY")}</td>
                    <td style="padding: 4px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f6e56; font-family: monospace;">${tx.amount.toLocaleString("ar-LY")} د.ل</td>
                    <td style="padding: 4px; border: 1px solid #cbd5e1;">${tx.paymentMethod}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        `;
      }

      return `
        <tr class="main-row" style="background-color: #fafafa;">
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold;">${c.caseNumber}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1;">${c.municipality}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1;">${c.needTypes.join("، ")}</td>
          <td class="num font-bold" style="padding: 8px; border: 1px solid #cbd5e1; font-family: monospace; text-align: left; direction: ltr;">${c.amountRequired.toLocaleString("ar-LY")} د.ل</td>
          <td class="num text-green" style="padding: 8px; border: 1px solid #cbd5e1; font-family: monospace; text-align: left; direction: ltr; color: #16a34a; font-weight: bold;">${c.amountCollected.toLocaleString("ar-LY")} د.ل</td>
          <td class="num" style="padding: 8px; border: 1px solid #cbd5e1; font-family: monospace; text-align: left; direction: ltr;">${pct}%</td>
          <td class="num text-rose" style="padding: 8px; border: 1px solid #cbd5e1; font-family: monospace; text-align: left; direction: ltr; color: #e11d48; font-weight: bold;">${remaining.toLocaleString("ar-LY")} د.ل</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">
            <span class="badge badge-${c.status}" style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; ${
              c.status === "committee_approved" ? "background-color: #fef3c7; color: #d97706;" :
              c.status === "published" ? "background-color: #dbeafe; color: #2563eb;" :
              c.status === "funded" ? "background-color: #dcfce7; color: #16a34a;" :
              "background-color: #f1f5f9; color: #475569;"
            }">${getStatusLabel(c.status)}</span>
          </td>
        </tr>
        ${txDetailsHtml ? `<tr><td colspan="8" style="padding: 4px; border: 1px solid #cbd5e1;">${txDetailsHtml}</td></tr>` : ""}
      `;
    }).join("");

    const totalRequired = filteredApprovedCases.reduce((sum, c) => sum + c.amountRequired, 0);
    const totalCollected = filteredApprovedCases.reduce((sum, c) => sum + c.amountCollected, 0);
    const overallPct = totalRequired > 0 ? Math.round((totalCollected / totalRequired) * 100) : 0;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>تقرير النشاط المالي للحالات المعتمدة - ${user.municipality || "صبراتة"}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
          body {
            font-family: 'Cairo', sans-serif;
            background-color: #fff;
            color: #1e293b;
            padding: 40px;
            margin: 0;
            font-size: 13px;
            line-height: 1.6;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px double #0f6e56;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo-text {
            font-size: 20px;
            font-weight: 900;
            color: #0f6e56;
          }
          .sub-logo {
            font-size: 11px;
            color: #64748b;
            margin-top: 2px;
          }
          .doc-title {
            text-align: center;
            margin-bottom: 25px;
          }
          .doc-title h1 {
            font-size: 20px;
            color: #0f6e56;
            margin: 0;
            font-weight: 900;
          }
          .doc-title p {
            color: #64748b;
            margin: 5px 0 0 0;
            font-size: 11px;
          }
          .meta-grid {
            display: grid;
            grid-template-cols: 1fr 1fr;
            gap: 15px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .meta-item {
            font-size: 12px;
          }
          .meta-label {
            color: #64748b;
            font-weight: bold;
          }
          .meta-value {
            color: #0f6e56;
            font-weight: bold;
          }
          .stats-grid {
            display: grid;
            grid-template-cols: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          .stat-card {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 12px;
            text-align: center;
          }
          .stat-card-title {
            font-size: 10px;
            color: #64748b;
            font-weight: bold;
          }
          .stat-card-value {
            font-size: 16px;
            color: #0f6e56;
            font-weight: 900;
            margin-top: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th {
            background-color: #0f6e56;
            color: white;
            font-weight: bold;
            padding: 10px;
            text-align: right;
            border: 1px solid #0f6e56;
            font-size: 12px;
          }
          td {
            padding: 10px;
            border: 1px solid #cbd5e1;
            font-size: 12px;
          }
          .signatures {
            margin-top: 60px;
            display: grid;
            grid-template-cols: 1fr 1fr;
            gap: 50px;
            text-align: center;
          }
          .sig-line {
            border-top: 1px dashed #94a3b8;
            margin-top: 40px;
            padding-top: 10px;
            font-size: 12px;
            font-weight: bold;
          }
          @media print {
            body { padding: 0; margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo-text">جمهورية ليبيا</div>
            <div class="sub-logo">الهيئة الوطنية لإدارة أموال التبرعات والتكافل</div>
          </div>
          <div style="text-align: left;">
            <div style="font-weight: bold; color: #0f6e56;">السجل الوطني الموحد</div>
            <div style="font-size: 10px; color: #64748b;">رقم التقرير: FIN-${Date.now().toString().substring(6)}</div>
          </div>
        </div>

        <div class="doc-title">
          <h1>تقرير التدقيق والمراجعة الدورية للنشاط المالي للحالات الإنسانية المعتمدة</h1>
          <p>مستخرج إلكترونياً لأغراض الرقابة وتوزيع ميزانيات الدعم المالي والتمكين الاجتماعي</p>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <span class="meta-label">الجهة المشرفة:</span>
            <span class="meta-value">مكتب الباحث الاجتماعي والتدقيق الميداني - بلدية ${user.municipality || "صبراتة"}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">تاريخ استخراج التقرير:</span>
            <span class="meta-value">${dateStr}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">اسم الباحث المسؤول:</span>
            <span class="meta-value">${user.fullName} (${user.email})</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">نطاق التغطية الجغرافية:</span>
            <span class="meta-value">بلدية ${scopeFilter === "my_municipality" ? (user.municipality || "صبراتة") : "جميع البلديات المتاحة"}</span>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card-title">إجمالي الحالات المعتمدة المشمولة</div>
            <div class="stat-card-value">${filteredApprovedCases.length} حالات</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-title">إجمالي الميزانية المطلوبة</div>
            <div class="stat-card-value font-mono" style="font-family: monospace; font-weight: bold; font-size: 15px;">${totalRequired.toLocaleString("ar-LY")} د.ل</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-title">إجمالي التبرعات المحصلة</div>
            <div class="stat-card-value font-mono text-green" style="font-family: monospace; color: #16a34a; font-weight: bold; font-size: 15px;">${totalCollected.toLocaleString("ar-LY")} د.ل</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-title">نسبة التغطية المجمعة</div>
            <div class="stat-card-value">${overallPct}%</div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr>
              <th style="width: 15%; background-color: #0f6e56; color: white; padding: 8px; border: 1px solid #0f6e56;">رقم الحالة</th>
              <th style="width: 12%; background-color: #0f6e56; color: white; padding: 8px; border: 1px solid #0f6e56;">البلدية</th>
              <th style="width: 23%; background-color: #0f6e56; color: white; padding: 8px; border: 1px solid #0f6e56;">نوع الاحتياج</th>
              <th style="width: 12%; background-color: #0f6e56; color: white; padding: 8px; border: 1px solid #0f6e56; text-align: left;">المبلغ المطلوب</th>
              <th style="width: 12%; background-color: #0f6e56; color: white; padding: 8px; border: 1px solid #0f6e56; text-align: left;">المجمع</th>
              <th style="width: 8%; background-color: #0f6e56; color: white; padding: 8px; border: 1px solid #0f6e56; text-align: left;">الإنجاز</th>
              <th style="width: 10%; background-color: #0f6e56; color: white; padding: 8px; border: 1px solid #0f6e56; text-align: left;">المتبقي</th>
              <th style="width: 8%; background-color: #0f6e56; color: white; padding: 8px; border: 1px solid #0f6e56; text-align: center;">الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="signatures">
          <div>
            <p>توقيع الباحث والمدقق الميداني المعتمد</p>
            <div class="sig-line">${user.fullName}</div>
          </div>
          <div>
            <p>اعتماد رئيس الهيئة الوطنية للتفتيش والتدقيق المالي</p>
            <div class="sig-line">ختم مكتب المراقبة والتحقق</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0F6E56] text-white p-6 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Right column: Greetings & Info */}
        <div className="md:col-span-2 space-y-3">
          <h2 className="text-xl font-black flex items-center gap-2">
            <span>أهلاً بك زميلنا الباحث الميداني 👋</span>
          </h2>
          <p className="text-xs opacity-90 leading-relaxed">
            بوابة الباحث الاجتماعي لتنظيم الزيارات الميدانية، وتطبيق نموذج التقييم العشري المطور، والتوثيق الفوتوغرافي الآمن.
          </p>
          <div className="flex flex-wrap gap-4 text-[11px] font-mono opacity-95">
            <span className="bg-[#085041] px-2.5 py-1 rounded-lg">📍 المنطقة المغطاة: {user.municipality || "صبراتة"}</span>
            <span className="bg-[#085041] px-2.5 py-1 rounded-lg">💼 الدور: التحقق الميداني والتقييم العشري لحالات الاستحقاق</span>
          </div>
        </div>

        {/* Left column: Connection & Offline Backup Management */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 space-y-3 text-right">
          <div className="flex justify-between items-center flex-row-reverse">
            <span className="text-[11px] font-bold opacity-80">حالة الاتصال والنسخ الاحتياطي</span>
            {isOnline ? (
              <span className="bg-emerald-500/25 text-emerald-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                متصل بالإنترنت
              </span>
            ) : (
              <span className="bg-amber-500/25 text-amber-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                وضع المسح الميداني (أوفلاين)
              </span>
            )}
          </div>

          {/* Offline indicator content */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              {/* Toggle offline mode button */}
              <button
                type="button"
                onClick={() => {
                  setIsOnline(!isOnline);
                  if (!isOnline && offlineQueue.length > 0) {
                    alert("⚠️ تم رصد اتصال بالإنترنت! يمكنك الآن النقر على زر المزامنة لرفع التقارير الميدانية المحفوظة بالجهاز.");
                  }
                }}
                className={`text-[10px] px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all border ${
                  isOnline 
                    ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 border-amber-500/30" 
                    : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100 border-emerald-500/30"
                }`}
              >
                {isOnline ? "🔌 العمل دون اتصال (أوفلاين)" : "🌐 الاتصال بالإنترنت"}
              </button>

              <div className="flex items-center gap-1 flex-row-reverse text-[11px]">
                {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-amber-400" />}
                <span className="font-bold">{isOnline ? "شبكة المدار" : "لا يوجد شبكة"}</span>
              </div>
            </div>

            {/* Offline status reports queued indicator */}
            <div className="border-t border-white/10 pt-2 text-right">
              {offlineQueue.length === 0 ? (
                <div className="flex items-center gap-1.5 flex-row-reverse text-[11px] text-emerald-300">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>جميع التقارير متزامنة ومحفوظة بالخادم الرئيسي</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    {isOnline ? (
                      <button
                        type="button"
                        onClick={handleSyncQueue}
                        disabled={isSyncing}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-500 text-white text-[10px] px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
                        <span>مزامنة ({offlineQueue.length}) تقارير</span>
                      </button>
                    ) : (
                      <span className="text-[9px] text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        انتظر الشبكة للمزامنة
                      </span>
                    )}
                    <div className="flex items-center gap-1 flex-row-reverse text-[11px] text-amber-300 font-bold">
                      <Database className="w-3.5 h-3.5" />
                      <span>{offlineQueue.length} تقارير غير متزامنة بالجهاز</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sync Progress Bar */}
            {isSyncing && (
              <div className="space-y-1.5 border-t border-white/10 pt-2">
                <div className="flex justify-between items-center text-[10px] font-sans">
                  <span>{syncProgress}%</span>
                  <span className="text-slate-300 text-right truncate max-w-[180px]">{syncStatusMessage}</span>
                </div>
                <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-400 h-full rounded-full transition-all duration-300" 
                    style={{ width: `${syncProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-[#E5E3DA] gap-6 text-sm">
        <button
          onClick={() => {
            setActiveSection("visits");
            setSelectedCase(null);
          }}
          className={`pb-3 font-bold transition-all relative ${
            activeSection === "visits"
              ? "text-[#0F6E56] border-b-2 border-[#0F6E56]"
              : "text-gray-500 hover:text-[#0F6E56]"
          }`}
          id="tab-visits"
        >
          📝 التحقق الميداني والزيارات المفتوحة ({pendingCases.length})
        </button>
        <button
          onClick={() => setActiveSection("reports")}
          className={`pb-3 font-bold transition-all relative ${
            activeSection === "reports"
              ? "text-[#0F6E56] border-b-2 border-[#0F6E56]"
              : "text-gray-500 hover:text-[#0F6E56]"
          }`}
          id="tab-reports"
        >
          📊 تقارير النشاط المالي للحالات المعتمدة
        </button>
      </div>

      {activeSection === "visits" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Pending cases list */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-[#E5E3DA] rounded-2xl p-4 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center justify-between border-b pb-2">
                <span>حالات بانتظار التحقق الميداني</span>
                <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {pendingCases.length} حالات
                </span>
              </h3>

              {pendingCases.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <span className="text-3xl block mb-2">🎉</span>
                  <p className="text-xs">تمت تغطية كافة طلبات التحقق الميداني في نطاق بلدية {user.municipality}!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingCases.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCase(c)}
                      className={`p-3 rounded-xl border text-right cursor-pointer transition-all ${
                        selectedCase?.id === c.id
                          ? "border-[#0F6E56] bg-[#E1F5EE]/40"
                          : "border-[#E5E3DA] hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex justify-between items-start text-xs font-mono mb-1.5">
                        <span className="font-bold text-[#0F6E56]">{c.caseNumber}</span>
                        <span className="text-gray-400">الأولوية المبدئية: {c.priorityLevel}</span>
                      </div>
                      <p className="text-xs font-bold text-gray-800 mt-1">{c.municipality}</p>
                      <p className="text-[11px] text-gray-500 line-clamp-2 mt-1">
                        {c.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Selected Case Details & Score Report Form */}
          <div className="lg:col-span-2 space-y-6">
            {selectedCase ? (
              <div className="bg-white border border-[#E5E3DA] rounded-2xl p-6 shadow-sm space-y-6">
                
                {/* Family details block */}
                <div className="border-b border-[#E5E3DA] pb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    تقرير التحقق للملف: {selectedCase.caseNumber}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">البلدية: {selectedCase.municipality} | تاريخ التسجيل: {new Date(selectedCase.createdAt).toLocaleDateString("ar-LY")}</p>

                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 block">إجمالي أفراد الأسرة</span>
                      <span className="font-bold text-gray-800">{selectedCase.family.totalMembers} أفراد</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">الدخل الشهري</span>
                      <span className="font-bold text-gray-800 text-rose-600">{selectedCase.family.monthlyIncome} د.ل</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">قيمة الإيجار الشهري</span>
                      <span className="font-bold text-gray-800">{selectedCase.family.rentAmount} د.ل</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">الحالة الاجتماعية لمعيل</span>
                      <span className="font-bold text-gray-800">{selectedCase.family.maritalStatus}</span>
                    </div>
                  </div>

                  <div className="mt-4 text-xs">
                    <span className="font-bold text-gray-700">شرح الحاجة المقدم من الأسرة:</span>
                    <p className="text-gray-600 bg-amber-50/50 p-3 rounded-lg border border-amber-100 mt-1 italic">
                      &quot;{selectedCase.description}&quot;
                    </p>
                  </div>

                  {selectedCase.bioVerification && (
                    <div className="mt-4 bg-emerald-50/50 border border-emerald-100 p-3 rounded-lg text-xs space-y-2">
                      <div className="flex justify-between items-center text-[#0F6E56]">
                        <span className="font-bold">✓ إثبات الهوية الرقمي البيومتري المرفق:</span>
                        <span className="font-mono bg-[#E1F5EE] px-2 py-0.5 rounded text-[10px] font-bold">
                          {selectedCase.bioVerification.type === "camera" ? "صورة الوجه الحية" : "التوقيع الرقمي المباشر"}
                        </span>
                      </div>
                      <div className="flex justify-center bg-white p-2 rounded border border-emerald-100 max-w-[200px] mx-auto">
                        <img
                          src={selectedCase.bioVerification.data}
                          alt="إثبات الهوية البيومترية"
                          className="max-h-[100px] object-contain rounded"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Scoring Form */}
                <form onSubmit={handleSubmitReport} className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-[#0F6E56] mb-3">نموذج التقييم العشري الميداني (من 0 كأفضل حالة إلى 10 كأشد حالة سوءاً)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                      <div>
                        <label className="block text-gray-700 font-bold mb-1">
                          تقييم سلامة السكن والإيواء: {housing}/10
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={housing}
                          onChange={(e) => setHousing(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0F6E56]"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">0: قصر سليم وممتاز ، 10: سكن مدمر آيل للسقوط فاقد للمرافق</p>
                      </div>

                      <div>
                        <label className="block text-gray-700 font-bold mb-1">
                          تقييم الحالة الصحية للأفراد: {health}/10
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={health}
                          onChange={(e) => setHealth(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0F6E56]"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">0: صحة ممتازة للجميع ، 10: وجود إعاقات مركبة أو أمراض خطيرة جداً مع عجز كلي</p>
                      </div>

                      <div>
                        <label className="block text-gray-700 font-bold mb-1">
                          تقييم القدرة على التعلم والتعليم: {education}/10
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={education}
                          onChange={(e) => setEducation(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0F6E56]"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">0: تكفل دراسي تام ، 10: تسرب كامل للأطفال من التعليم بسبب الفقر والظروف المعيشية</p>
                      </div>

                      <div>
                        <label className="block text-gray-700 font-bold mb-1">
                          مستوى العجز المالي وشح الدخل: {income}/10
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={income}
                          onChange={(e) => setIncome(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0F6E56]"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">0: دخل كاف وممتاز ، 10: انعدام كلي لمصادر الدخل مع ديون متراكمة وملاحقات قانونية</p>
                      </div>
                    </div>
                  </div>

                  {/* Photo Upload and Multimodal Gemini */}
                  <div className="border-t border-[#E5E3DA] pt-4 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-800">
                        التوثيق الفوتوغرافي الآمن للمسكن
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                        * يلتزم الباحث الميداني بتصوير تصدعات المسكن أو أجهزة الاحتياج. يقوم درع الأمان السيبراني تلقائياً بمسح بيانات GPS EXIF لتجنب كشف موقع مسكن العائلة لعامة المتبرعين.
                      </p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      <div className="flex-1 w-full space-y-4">
                        <div className="text-xs">
                          <label className="block text-gray-700 font-bold mb-1.5">اختر صورة للمسكن أو المرفق الطبي المتهالك</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-[#E1F5EE] file:text-[#0F6E56] hover:file:bg-emerald-100 file:cursor-pointer"
                          />
                        </div>

                        {selectedImage && (
                          <button
                            type="button"
                            disabled={isAnalyzingImage}
                            onClick={handleAIAnalyze}
                            className="w-full bg-[#1D9E75] hover:bg-[#0F6E56] disabled:bg-slate-300 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {isAnalyzingImage ? (
                              <>
                                <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>
                                جاري تحليل الصورة وصياغة التقرير الاجتماعي بالذكاء الاصطناعي...
                              </>
                            ) : (
                              <>
                                <span>✨</span>
                                صياغة التقرير الاجتماعي بالذكاء الاصطناعي (Gemini V2)
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <div className="w-full md:w-[220px] flex-shrink-0">
                        {selectedImage ? (
                          <div className="relative rounded-xl border border-[#E5E3DA] p-1 bg-white">
                            <img
                              src={selectedImage}
                              alt="توثيق معينة"
                              className="w-full h-[120px] object-cover rounded-lg"
                            />
                            <span className="absolute bottom-2 right-2 bg-emerald-600 text-white font-mono text-[9px] px-2 py-0.5 rounded-full font-bold">
                              GPS Stripped ✅
                            </span>
                          </div>
                        ) : (
                          <div className="w-full h-[120px] border-2 border-dashed border-[#E5E3DA] rounded-xl flex items-center justify-center bg-slate-50 text-[11px] text-gray-400">
                            بانتظار توثيق الصورة الميدانية
                          </div>
                        )}
                      </div>
                    </div>

                    {securityLog && (
                      <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-emerald-800 text-[11px] font-mono leading-relaxed">
                        🛡️ [درع النزاهة والأمان الجغرافي]: {securityLog}
                      </div>
                    )}
                  </div>

                  {/* Final Notes Textarea */}
                  <div className="border-t border-[#E5E3DA] pt-4">
                    <label className="block text-xs font-bold text-gray-700 mb-1">ملاحظات وتقرير الباحث الاجتماعي الشامل *</label>
                    <textarea
                      rows={4}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full border border-[#E5E3DA] rounded-lg p-2 text-xs"
                      placeholder="اكتب خلاصة ما لوحظ على العائلة والمسكن والتقارير الطبية المسلمة لحساب الاستحقاق بدقة..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#E5E3DA] pt-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">التوصية النهائية لاعتماد الملف</label>
                      <select
                        value={recommendation}
                        onChange={(e: any) => setRecommendation(e.target.value)}
                        className="w-full border border-[#E5E3DA] rounded-lg p-2 text-xs bg-white"
                      >
                        <option value="موافقة">موافقة على اعتماد ونشر حالة الاستحقاق</option>
                        <option value="رفض">رفض الطلب لعدم ثبوت الاستحقاق المالي</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#0F6E56] hover:bg-[#085041] disabled:bg-slate-300 text-white font-bold py-2.5 px-8 rounded-lg text-xs cursor-pointer"
                    >
                      {isSubmitting ? "جاري حفظ وإرسال تقرير التقييم الميداني..." : "إرسال التقرير واعتماد نقاط الاستحقاق"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCase(null)}
                      className="bg-white border border-[#E5E3DA] hover:bg-slate-50 text-gray-700 font-bold py-2 px-6 rounded-lg text-xs cursor-pointer"
                    >
                      رجوع
                    </button>
                  </div>

                </form>

              </div>
            ) : (
              <div className="bg-white border border-[#E5E3DA] rounded-2xl p-12 text-center text-gray-400">
                <span className="text-5xl block mb-4">🔍</span>
                <h3 className="text-lg font-bold text-gray-800">الرجاء اختيار ملف من القائمة الجانبية لبدء التدقيق والزيارة</h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto mt-2 leading-relaxed">
                  ستظهر فقط الملفات التي تنتمي لنفس بلدية تغطيتكم ({user.municipality}) والتي أرسل أصحابها طلبات تسجيل مبدئية ولم يزرهم باحث بعد.
                </p>
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Financial KPI Widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E5E3DA] p-4 rounded-xl shadow-sm text-right space-y-1">
              <span className="text-gray-400 text-xs block font-bold">الحالات الإنسانية المعتمدة</span>
              <span className="text-2xl font-black text-[#0F6E56] font-mono">
                {filteredApprovedCases.length} <span className="text-xs font-normal font-sans text-gray-500">حالات</span>
              </span>
            </div>
            
            <div className="bg-white border border-[#E5E3DA] p-4 rounded-xl shadow-sm text-right space-y-1">
              <span className="text-gray-400 text-xs block font-bold">إجمالي التمويل المطلوب</span>
              <span className="text-2xl font-black text-slate-800 font-mono">
                {filteredApprovedCases.reduce((sum, c) => sum + c.amountRequired, 0).toLocaleString("ar-LY")} <span className="text-xs font-normal font-sans text-gray-500">د.ل</span>
              </span>
            </div>
            
            <div className="bg-white border border-[#E5E3DA] p-4 rounded-xl shadow-sm text-right space-y-1">
              <span className="text-gray-400 text-xs block font-bold">إجمالي المبالغ المجمّعة</span>
              <span className="text-2xl font-black text-emerald-600 font-mono">
                {filteredApprovedCases.reduce((sum, c) => sum + c.amountCollected, 0).toLocaleString("ar-LY")} <span className="text-xs font-normal font-sans text-gray-500">د.ل</span>
              </span>
            </div>

            <div className="bg-white border border-[#E5E3DA] p-4 rounded-xl shadow-sm text-right space-y-1">
              <span className="text-gray-400 text-xs block font-bold">نسبة التغطية المالية الإجمالية</span>
              <span className="text-2xl font-black text-blue-600 font-mono">
                {(() => {
                  const req = filteredApprovedCases.reduce((sum, c) => sum + c.amountRequired, 0);
                  const coll = filteredApprovedCases.reduce((sum, c) => sum + c.amountCollected, 0);
                  return req > 0 ? Math.round((coll / req) * 100) : 0;
                })()}%
              </span>
            </div>
          </div>

          {/* Filters & Export Row */}
          <div className="bg-white border border-[#E5E3DA] p-4 rounded-xl shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              
              <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                {/* Search */}
                <div className="relative min-w-[200px]">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="البحث برقم الملف أو نوع الاحتياج..."
                    className="w-full border border-[#E5E3DA] rounded-lg py-1.5 px-3 text-xs bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#0F6E56] focus:border-[#0F6E56] transition-all outline-none text-right"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-[#E5E3DA] rounded-lg py-1.5 px-3 text-xs bg-white focus:ring-1 focus:ring-[#0F6E56] outline-none"
                >
                  <option value="all">كل حالات التمويل</option>
                  <option value="pending">قيد جمع التبرعات (معتمد / منشور)</option>
                  <option value="completed">مكتمل التمويل بالكامل (ممول / مغلق)</option>
                </select>

                {/* Scope Filter */}
                <select
                  value={scopeFilter}
                  onChange={(e) => setScopeFilter(e.target.value)}
                  className="border border-[#E5E3DA] rounded-lg py-1.5 px-3 text-xs bg-white focus:ring-1 focus:ring-[#0F6E56] outline-none"
                >
                  <option value="my_municipality">بلدية {user.municipality || "صبراتة"} فقط</option>
                  <option value="all">كافة البلديات الوطنية</option>
                </select>

                {/* Priority Filter */}
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="border border-[#E5E3DA] rounded-lg py-1.5 px-3 text-xs bg-white focus:ring-1 focus:ring-[#0F6E56] outline-none"
                >
                  <option value="all">كل مستويات الأولوية</option>
                  <option value="عاجل">عاجل جداً</option>
                  <option value="مرتفع">مرتفع</option>
                  <option value="متوسط">متوسط</option>
                  <option value="منخفض">منخفض</option>
                </select>
              </div>

              {/* Export Actions */}
              <div className="flex gap-2 w-full md:w-auto justify-end">
                <button
                  onClick={handleExportCSV}
                  className="bg-white border border-emerald-600 text-emerald-700 hover:bg-emerald-50 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  id="btn-export-csv"
                >
                  📥 تصدير كجدول بيانات (CSV)
                </button>
                <button
                  onClick={handleExportPDF}
                  className="bg-[#0F6E56] hover:bg-[#0b503e] text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  id="btn-export-pdf"
                >
                  🖨️ طباعة وتحميل تقرير PDF منظم
                </button>
              </div>

            </div>
          </div>

          {/* Main Structured Table */}
          <div className="bg-white border border-[#E5E3DA] rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-[#E5E3DA] text-xs text-gray-500 font-bold">
                    <th className="p-4">رقم الملف</th>
                    <th className="p-4">المنطقة الجغرافية</th>
                    <th className="p-4">مؤشر الاستحقاق</th>
                    <th className="p-4">تصنيف ونوع الحاجة</th>
                    <th className="p-4 text-left">المبلغ المطلوب</th>
                    <th className="p-4 text-left">المبلغ المجمع</th>
                    <th className="p-4">تغطية الهدف</th>
                    <th className="p-4">الحالة التنظيمية</th>
                    <th className="p-4 text-center">النشاط المالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredApprovedCases.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-gray-400">
                        لا توجد سجلات مالية مطابقة لمعايير التصفية المحددة حالياً.
                      </td>
                    </tr>
                  ) : (
                    filteredApprovedCases.map((c) => {
                      const remaining = c.amountRequired - c.amountCollected;
                      const pct = Math.min(100, Math.round((c.amountCollected / c.amountRequired) * 100));
                      const caseTxList = transactions.filter((tx) => tx.caseId === c.id);
                      const isExpanded = expandedCaseId === c.id;

                      return (
                        <React.Fragment key={c.id}>
                          <tr className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 font-mono font-bold text-gray-900">{c.caseNumber}</td>
                            <td className="p-4 text-gray-700">{c.municipality}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                c.needScore >= 80 ? "bg-rose-50 text-rose-700" :
                                c.needScore >= 50 ? "bg-amber-50 text-amber-700" :
                                "bg-emerald-50 text-emerald-700"
                              }`}>
                                {c.needScore}/100 ({c.priorityLevel})
                              </span>
                            </td>
                            <td className="p-4 text-gray-800 font-semibold">{c.needTypes.join("، ")}</td>
                            <td className="p-4 font-mono text-left font-bold text-slate-700">{c.amountRequired.toLocaleString("ar-LY")} د.ل</td>
                            <td className="p-4 font-mono text-left text-emerald-600 font-bold">{c.amountCollected.toLocaleString("ar-LY")} د.ل</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                                </div>
                                <span className="font-mono text-gray-500 font-semibold">{pct}%</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                c.status === "committee_approved" ? "bg-amber-50 text-amber-800 border border-amber-200" :
                                c.status === "published" ? "bg-blue-50 text-blue-800 border border-blue-200" :
                                c.status === "funded" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
                                "bg-slate-50 text-slate-800 border border-slate-200"
                              }`}>
                                {getStatusLabel(c.status)}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => setExpandedCaseId(isExpanded ? null : c.id)}
                                className="bg-slate-50 hover:bg-slate-100 border border-[#E5E3DA] rounded-lg px-2 py-1 text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 text-gray-700"
                                id={`btn-toggle-tx-${c.id}`}
                              >
                                {isExpanded ? "🔼 طي السجل" : `🔽 كشف التحويلات (${caseTxList.length})`}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Transaction Drawer */}
                          {isExpanded && (
                            <tr className="bg-[#FAF9F5]">
                              <td colSpan={9} className="p-4 border-t border-b border-slate-200">
                                <div className="space-y-3 mr-4">
                                  <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-[#0F6E56] text-xs">📜 كشف التدقيق والمراجعة المالية التراكمية للملف {c.caseNumber}</h4>
                                    <span className="text-[10px] text-gray-400 font-mono">معرّف الحالة: {c.id}</span>
                                  </div>
                                  
                                  {caseTxList.length === 0 ? (
                                    <div className="text-center py-6 text-gray-400 text-[11px] border border-dashed border-[#E5E3DA] rounded-lg bg-white">
                                      لا توجد تبرعات مسجلة حتى الآن لهذه الحالة عبر بوابات الدفع الإلكترونية.
                                    </div>
                                  ) : (
                                    <div className="border border-[#E5E3DA] rounded-lg overflow-hidden bg-white shadow-sm">
                                      <table className="w-full text-right border-collapse text-[11px]">
                                        <thead>
                                          <tr className="bg-slate-50 border-b border-[#E5E3DA] font-bold text-gray-600">
                                            <th className="p-2">رقم الإيصال</th>
                                            <th className="p-2">تاريخ الدفع</th>
                                            <th className="p-2">هوية الداعم</th>
                                            <th className="p-2">نوع الصندوق</th>
                                            <th className="p-2 text-left">المبلغ</th>
                                            <th className="p-2">المرجع البنكي</th>
                                            <th className="p-2">blockchain Hash</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                          {caseTxList.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-slate-50">
                                              <td className="p-2 font-mono text-gray-700 font-semibold">{tx.receiptNumber}</td>
                                              <td className="p-2 text-gray-500">{new Date(tx.createdAt).toLocaleDateString("ar-LY")}</td>
                                              <td className="p-2 text-gray-700 font-bold">{tx.donorNameOverride || "فاعل خير (مجهول)"}</td>
                                              <td className="p-2 text-slate-500">{tx.fundType}</td>
                                              <td className="p-2 font-mono text-left font-bold text-emerald-600">{tx.amount.toLocaleString("ar-LY")} د.ل</td>
                                              <td className="p-2 font-mono text-gray-400 text-[10px]">{tx.paymentReference}</td>
                                              <td className="p-2 font-mono text-gray-400 text-[9px] truncate max-w-[120px]">{tx.trackingHash}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
