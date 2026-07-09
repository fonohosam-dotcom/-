export type UserRole = "admin" | "citizen" | "researcher" | "donor" | "charity" | "evaluation_committee" | "finance_manager" | "volunteer" | "auditor" | "support" | "content_manager" | "field_coordinator" | "data_analyst" | "system_architect";

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  municipality?: string;
  address?: string;
  nationalId?: string;
  gamificationPoints: number;
  isSuperAdmin?: boolean;
  status?: string;
  region?: string;
  permissions?: string[];
  allowedMunicipalities?: string[];
  isAnonymous?: boolean;
  isBanned?: boolean;
  isHidden?: boolean;
  authProvider?: "local" | "google" | "apple";
}

export interface Family {
  totalMembers: number;
  childrenCount: number;
  elderlyCount: number;
  disabledCount: number;
  monthlyIncome: number;
  rentAmount: number;
  housingCondition: "جيد" | "متوسط" | "غير صالح";
  evictionRisk: boolean;
  maritalStatus: "متزوج" | "أرملة" | "مطلقة" | "أعزب";
  chronicIllnesses: boolean;
  incomeSources: string[];
}

export interface Case {
  id: string;
  caseNumber: string;
  userId: string;
  family: Family;
  needTypes: string[];
  description: string;
  amountRequired: number;
  amountCollected: number;
  needScore: number;
  priorityLevel: "عاجل" | "مرتفع" | "متوسط" | "منخفض";
  status: "submitted" | "under_review" | "field_visit_done" | "committee_approved" | "published" | "funded" | "appealed" | "closed" | "rejected";
  municipality: string;
  latitude: number;
  longitude: number;
  assignedResearcherId?: string;
  scheduledVisitDate?: string;
  assignedCharityId?: string;
  assignedVolunteerId?: string;
  rejectionReason?: string;
  appealReason?: string;
  appealedAt?: string;
  deliveryConfirmedAt?: string;
  deliveryBioVerification?: {
    type: "camera" | "signature";
    data: string;
    verifiedAt: string;
  };
  coverImage?: string;
  imageCaption?: string;
  housingPhotos?: string[];
  createdAt: string;
  approvedAt?: string;
  closedAt?: string;
  bioVerification?: {
    type: "camera" | "signature";
    data: string; // base64 representation of facial capture or signature
    verifiedAt: string;
  };
  researcherScores?: {
    housing: number; // 0-10
    health: number;  // 0-10
    education: number; // 0-10
    income: number;   // 0-10
    notes: string;
    recommendation: "موافقة" | "رفض";
  };
}

export interface MajorProject {
  id: string;
  projectNumber: string;
  category: "mosque" | "well" | "hospital" | "school" | "orphan_care" | "housing";
  title: string;
  description: string;
  municipality: string;
  targetAmount: number;
  collectedAmount: number;
  coverImage?: string;
  status: "pending" | "active" | "completed" | "rejected";
  createdAt: string;
}

export interface OmniTransaction {
  id: string;
  receiptNumber: string;
  donorId?: string;
  donorNameOverride?: string;
  caseId?: string;
  projectId?: string;
  fundType: "زكاة" | "صدقة" | "كفالة_يتيم" | "صدقة_جارية" | "طوارئ";
  amount: number;
  currency: string;
  displayAmount: number;
  exchangeRate: number;
  isRecurring?: boolean;
  recurringInterval?: "monthly" | "weekly" | "yearly";
  paymentMethod: string;
  paymentReference: string;
  trackingHash: string;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  entryDate: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  relatedDonationId?: string;
  relatedDisbursementId?: string;
  createdBy: string;
}

export interface Fund {
  id: string;
  fundType: "زكاة" | "صدقة" | "كفالة_يتيم" | "صدقة_جارية" | "طوارئ";
  balance: number;
  totalIn: number;
  totalOut: number;
}

export interface SkillOffering {
  id: string;
  providerName: string;
  providerContact: string;
  specialty: string;
  offeringType: "medical" | "engineering" | "renovation" | "appliance";
  description: string;
  matchedCaseId?: string;
  matchedCaseNumber?: string;
  createdAt: string;
}

export interface CommunityReport {
  id: string;
  caseId?: string;
  caseNumber?: string;
  reporterName?: string;
  reporterContact?: string;
  reason: string;
  status: "pending" | "investigated" | "resolved";
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId?: string; // Empty means public / broadcast to everyone
  title: string;
  message: string;
  type: "update" | "assignment" | "mention" | "deadline" | "donation" | "sos";
  createdAt: string;
  read: boolean;
}

export interface NotificationPreferences {
  projectUpdates: boolean;
  taskAssignments: boolean;
  mentions: boolean;
  deadlines: boolean;
  donations: boolean;
  soundEnabled: boolean;
}

