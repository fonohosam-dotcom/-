import { relations } from 'drizzle-orm';
import { integer, serial, pgTable, text, real, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), 
  email: text('email').notNull(),
  passwordHash: text('password_hash'),
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  role: text('role').notNull(),
  municipality: text('municipality'),
  address: text('address'),
  nationalId: text('national_id'),
  gamificationPoints: integer('gamification_points').default(0),
  status: text('status').default('active'),
  region: text('region'),
  permissions: jsonb('permissions'),
  allowedMunicipalities: jsonb('allowed_municipalities'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const cases = pgTable('cases', {
  id: serial('id').primaryKey(),
  caseId: text('case_id').notNull().unique(),
  caseNumber: text('case_number').notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  family: jsonb('family').notNull(),
  needTypes: jsonb('need_types').notNull(),
  description: text('description').notNull(),
  amountRequired: real('amount_required').notNull(),
  amountCollected: real('amount_collected').default(0),
  needScore: integer('need_score').notNull(),
  priorityLevel: text('priority_level').notNull(),
  status: text('status').notNull(),
  municipality: text('municipality').notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  assignedResearcherId: integer('assigned_researcher_id').references(() => users.id),
  rejectionReason: text('rejection_reason'),
  housingPhotos: jsonb('housing_photos'), 
  createdAt: timestamp('created_at').defaultNow(),
  approvedAt: timestamp('approved_at'),
  closedAt: timestamp('closed_at'),
});

export const majorProjects = pgTable('major_projects', {
  id: serial('id').primaryKey(),
  projectId: text('project_id').notNull().unique(),
  projectNumber: text('project_number').notNull(),
  category: text('category').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  municipality: text('municipality').notNull(),
  targetAmount: real('target_amount').notNull(),
  collectedAmount: real('collected_amount').default(0),
  coverImage: text('cover_image'),
  status: text('status').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const funds = pgTable('funds', {
  id: serial('id').primaryKey(),
  fundId: text('fund_id').notNull().unique(),
  fundType: text('fund_type').notNull(),
  balance: real('balance').default(0),
  totalIn: real('total_in').default(0),
  totalOut: real('total_out').default(0),
});

export const ledgerEntries = pgTable('ledger_entries', {
  id: serial('id').primaryKey(),
  entryId: text('entry_id').notNull().unique(),
  entryDate: timestamp('entry_date').notNull(),
  description: text('description').notNull(),
  debitAccount: text('debit_account').notNull(),
  creditAccount: text('credit_account').notNull(),
  amount: real('amount').notNull(),
  createdBy: text('created_by').notNull(),
});

export const communityReports = pgTable('community_reports', {
  id: serial('id').primaryKey(),
  reportId: text('report_id').notNull().unique(),
  caseId: text('case_id'),
  caseNumber: text('case_number'),
  reporterName: text('reporter_name'),
  reporterContact: text('reporter_contact'),
  reason: text('reason').notNull(),
  status: text('status').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const auditTrails = pgTable('audit_trails', {
  id: serial('id').primaryKey(),
  actionType: text('action_type').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  actorId: integer('actor_id').references(() => users.id),
  actorRole: text('actor_role'),
  details: text('details').notNull(),
  timestamp: timestamp('timestamp').defaultNow(),
});
