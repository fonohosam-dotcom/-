CREATE TABLE "audit_trails" (
	"id" integer PRIMARY KEY NOT NULL,
	"action_type" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"actor_id" integer,
	"actor_role" text,
	"details" text NOT NULL,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" integer PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"case_number" text NOT NULL,
	"user_id" integer NOT NULL,
	"family" jsonb NOT NULL,
	"need_types" jsonb NOT NULL,
	"description" text NOT NULL,
	"amount_required" real NOT NULL,
	"amount_collected" real DEFAULT 0,
	"need_score" integer NOT NULL,
	"priority_level" text NOT NULL,
	"status" text NOT NULL,
	"municipality" text NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"assigned_researcher_id" integer,
	"rejection_reason" text,
	"housing_photos" jsonb,
	"created_at" timestamp DEFAULT now(),
	"approved_at" timestamp,
	"closed_at" timestamp,
	CONSTRAINT "cases_case_id_unique" UNIQUE("case_id")
);
--> statement-breakpoint
CREATE TABLE "community_reports" (
	"id" integer PRIMARY KEY NOT NULL,
	"report_id" text NOT NULL,
	"case_id" text,
	"case_number" text,
	"reporter_name" text,
	"reporter_contact" text,
	"reason" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "community_reports_report_id_unique" UNIQUE("report_id")
);
--> statement-breakpoint
CREATE TABLE "funds" (
	"id" integer PRIMARY KEY NOT NULL,
	"fund_id" text NOT NULL,
	"fund_type" text NOT NULL,
	"balance" real DEFAULT 0,
	"total_in" real DEFAULT 0,
	"total_out" real DEFAULT 0,
	CONSTRAINT "funds_fund_id_unique" UNIQUE("fund_id")
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" integer PRIMARY KEY NOT NULL,
	"entry_id" text NOT NULL,
	"entry_date" timestamp NOT NULL,
	"description" text NOT NULL,
	"debit_account" text NOT NULL,
	"credit_account" text NOT NULL,
	"amount" real NOT NULL,
	"created_by" text NOT NULL,
	CONSTRAINT "ledger_entries_entry_id_unique" UNIQUE("entry_id")
);
--> statement-breakpoint
CREATE TABLE "major_projects" (
	"id" integer PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"project_number" text NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"municipality" text NOT NULL,
	"target_amount" real NOT NULL,
	"collected_amount" real DEFAULT 0,
	"cover_image" text,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "major_projects_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" text,
	"role" text NOT NULL,
	"municipality" text,
	"address" text,
	"national_id" text,
	"gamification_points" integer DEFAULT 0,
	"status" text DEFAULT 'active',
	"region" text,
	"permissions" jsonb,
	"allowed_municipalities" jsonb,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
ALTER TABLE "audit_trails" ADD CONSTRAINT "audit_trails_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_assigned_researcher_id_users_id_fk" FOREIGN KEY ("assigned_researcher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;