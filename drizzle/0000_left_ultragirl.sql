CREATE TABLE `audit_trails` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`action_type` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`actor_id` integer,
	`actor_role` text,
	`details` text NOT NULL,
	`timestamp` integer,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`case_id` text NOT NULL,
	`case_number` text NOT NULL,
	`user_id` integer NOT NULL,
	`family` text NOT NULL,
	`need_types` text NOT NULL,
	`description` text NOT NULL,
	`amount_required` real NOT NULL,
	`amount_collected` real DEFAULT 0,
	`need_score` integer NOT NULL,
	`priority_level` text NOT NULL,
	`status` text NOT NULL,
	`municipality` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`assigned_researcher_id` integer,
	`rejection_reason` text,
	`housing_photos` text,
	`created_at` integer,
	`approved_at` integer,
	`closed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_researcher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cases_case_id_unique` ON `cases` (`case_id`);--> statement-breakpoint
CREATE TABLE `community_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`report_id` text NOT NULL,
	`case_id` text,
	`case_number` text,
	`reporter_name` text,
	`reporter_contact` text,
	`reason` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_reports_report_id_unique` ON `community_reports` (`report_id`);--> statement-breakpoint
CREATE TABLE `funds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fund_id` text NOT NULL,
	`fund_type` text NOT NULL,
	`balance` real DEFAULT 0,
	`total_in` real DEFAULT 0,
	`total_out` real DEFAULT 0
);
--> statement-breakpoint
CREATE UNIQUE INDEX `funds_fund_id_unique` ON `funds` (`fund_id`);--> statement-breakpoint
CREATE TABLE `ledger_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entry_id` text NOT NULL,
	`entry_date` integer NOT NULL,
	`description` text NOT NULL,
	`debit_account` text NOT NULL,
	`credit_account` text NOT NULL,
	`amount` real NOT NULL,
	`created_by` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ledger_entries_entry_id_unique` ON `ledger_entries` (`entry_id`);--> statement-breakpoint
CREATE TABLE `major_projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` text NOT NULL,
	`project_number` text NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`municipality` text NOT NULL,
	`target_amount` real NOT NULL,
	`collected_amount` real DEFAULT 0,
	`cover_image` text,
	`status` text NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `major_projects_project_id_unique` ON `major_projects` (`project_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uid` text NOT NULL,
	`email` text NOT NULL,
	`full_name` text NOT NULL,
	`phone` text,
	`role` text NOT NULL,
	`municipality` text,
	`address` text,
	`national_id` text,
	`gamification_points` integer DEFAULT 0,
	`status` text DEFAULT 'active',
	`region` text,
	`permissions` text,
	`allowed_municipalities` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_uid_unique` ON `users` (`uid`);