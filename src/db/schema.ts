import { relations } from 'drizzle-orm';
import { integer, sqliteTable, text, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  role: text('role').notNull(),
  municipality: text('municipality'),
  address: text('address'),
  nationalId: text('national_id'), // Will be encrypted in app logic
  gamificationPoints: integer('gamification_points').default(0),
  status: text('status').default('active'),
  region: text('region'),
  permissions: text('permissions', { mode: 'json' }),
  allowedMunicipalities: text('allowed_municipalities', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const cases = sqliteTable('cases', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  caseId: text('case_id').notNull().unique(),
  caseNumber: text('case_number').notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  family: text('family', { mode: 'json' }).notNull(), // Family structure
  needTypes: text('need_types', { mode: 'json' }).notNull(),
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
  housingPhotos: text('housing_photos', { mode: 'json' }), // array of strings
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
  closedAt: integer('closed_at', { mode: 'timestamp' }),
});

export const majorProjects = sqliteTable('major_projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
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
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const funds = sqliteTable('funds', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fundId: text('fund_id').notNull().unique(),
  fundType: text('fund_type').notNull(),
  balance: real('balance').default(0),
  totalIn: real('total_in').default(0),
  totalOut: real('total_out').default(0),
});

export const ledgerEntries = sqliteTable('ledger_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entryId: text('entry_id').notNull().unique(),
  entryDate: integer('entry_date', { mode: 'timestamp' }).notNull(),
  description: text('description').notNull(),
  debitAccount: text('debit_account').notNull(),
  creditAccount: text('credit_account').notNull(),
  amount: real('amount').notNull(),
  createdBy: text('created_by').notNull(),
});

export const communityReports = sqliteTable('community_reports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reportId: text('report_id').notNull().unique(),
  caseId: text('case_id'),
  caseNumber: text('case_number'),
  reporterName: text('reporter_name'),
  reporterContact: text('reporter_contact'),
  reason: text('reason').notNull(),
  status: text('status').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const auditTrails = sqliteTable('audit_trails', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  actionType: text('action_type').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  actorId: integer('actor_id').references(() => users.id),
  actorRole: text('actor_role'),
  details: text('details').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
