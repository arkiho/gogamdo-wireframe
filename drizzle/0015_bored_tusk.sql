CREATE TABLE `ops_approval_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`documentType` enum('expense','contract','estimate','general') NOT NULL DEFAULT 'expense',
	`steps` json NOT NULL,
	`isDefault` tinyint DEFAULT 0,
	`isActive` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ops_approval_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ops_approval_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentType` enum('expense','contract','estimate','general') NOT NULL,
	`documentId` int NOT NULL,
	`stepOrder` int NOT NULL,
	`approverId` int NOT NULL,
	`approverName` varchar(100) NOT NULL,
	`status` enum('pending','approved','rejected','skipped') NOT NULL DEFAULT 'pending',
	`comment` text,
	`actionAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ops_approval_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ops_cameras` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`location` varchar(300),
	`streamUrl` text,
	`thumbnailUrl` text,
	`isOnline` tinyint DEFAULT 0,
	`lastOnlineAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ops_cameras_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ops_client_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`clientName` varchar(200) NOT NULL,
	`clientEmail` varchar(320),
	`token` varchar(64) NOT NULL,
	`permissions` json,
	`expiresAt` timestamp,
	`isActive` tinyint NOT NULL DEFAULT 1,
	`lastAccessedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ops_client_invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `ops_client_invites_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `ops_contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`authorId` int NOT NULL,
	`contractNumber` varchar(50) NOT NULL,
	`title` varchar(300) NOT NULL,
	`contractType` enum('main','subcontract','design','consulting','maintenance','other') NOT NULL DEFAULT 'main',
	`partyA` varchar(200) NOT NULL,
	`partyB` varchar(200) NOT NULL,
	`contractAmount` decimal(15,0),
	`startDate` varchar(20),
	`endDate` varchar(20),
	`paymentTerms` text,
	`specialTerms` text,
	`fileUrl` text,
	`fileKey` varchar(500),
	`attachmentUrls` json,
	`status` enum('draft','reviewing','signed','active','completed','terminated') NOT NULL DEFAULT 'draft',
	`signedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ops_contracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ops_cost_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`category` enum('material','labor','subcontract','equipment','overhead','design','permit','other') NOT NULL,
	`subcategory` varchar(200),
	`description` varchar(500) NOT NULL,
	`budgetAmount` decimal(15,0),
	`actualAmount` decimal(15,0),
	`paidAmount` decimal(15,0),
	`vendor` varchar(200),
	`expenseId` int,
	`invoiceDate` varchar(20),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ops_cost_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ops_estimates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`authorId` int NOT NULL,
	`estimateNumber` varchar(50) NOT NULL,
	`title` varchar(300) NOT NULL,
	`version` int DEFAULT 1,
	`items` json,
	`subtotal` decimal(15,0),
	`overhead` decimal(15,0),
	`profit` decimal(15,0),
	`vat` decimal(15,0),
	`grandTotal` decimal(15,0),
	`fileUrl` text,
	`fileKey` varchar(500),
	`notes` text,
	`validUntil` varchar(20),
	`status` enum('draft','submitted','approved','rejected','sent') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ops_estimates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ops_expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`authorId` int NOT NULL,
	`approvalLineId` int,
	`expenseNumber` varchar(50) NOT NULL,
	`title` varchar(300) NOT NULL,
	`category` enum('material','labor','subcontract','equipment','transportation','utility','office','meal','other') NOT NULL DEFAULT 'other',
	`items` json NOT NULL,
	`totalAmount` decimal(15,0) NOT NULL,
	`paymentMethod` enum('bank_transfer','card','cash','check') DEFAULT 'bank_transfer',
	`payeeName` varchar(200),
	`payeeBank` varchar(100),
	`payeeAccount` varchar(50),
	`receiptUrls` json,
	`attachmentUrls` json,
	`notes` text,
	`status` enum('draft','submitted','in_review','approved','rejected','paid') NOT NULL DEFAULT 'draft',
	`submittedAt` timestamp,
	`approvedAt` timestamp,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ops_expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ops_meeting_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`authorId` int NOT NULL,
	`title` varchar(300) NOT NULL,
	`meetingDate` varchar(20) NOT NULL,
	`meetingTime` varchar(10),
	`location` varchar(200),
	`meetingType` enum('internal','client','subcontractor','inspection') NOT NULL DEFAULT 'internal',
	`attendees` json,
	`agenda` text,
	`content` text NOT NULL,
	`decisions` json,
	`actionItems` json,
	`attachmentUrls` json,
	`status` enum('draft','finalized') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ops_meeting_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ops_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(300) NOT NULL,
	`code` varchar(50) NOT NULL,
	`clientName` varchar(200) NOT NULL,
	`clientContact` varchar(100),
	`clientEmail` varchar(320),
	`clientPhone` varchar(30),
	`siteAddress` text,
	`totalArea` decimal(10,2),
	`contractAmount` decimal(15,0),
	`startDate` varchar(20),
	`endDate` varchar(20),
	`status` enum('planning','designing','permit','construction','inspection','completed','warranty','closed') NOT NULL DEFAULT 'planning',
	`managerId` int,
	`teamMembers` json,
	`description` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ops_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ops_schedule_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`parentId` int,
	`name` varchar(300) NOT NULL,
	`category` varchar(100),
	`startDate` varchar(20),
	`endDate` varchar(20),
	`progress` int DEFAULT 0,
	`status` enum('not_started','in_progress','delayed','completed','on_hold') NOT NULL DEFAULT 'not_started',
	`assignedTo` varchar(200),
	`subcontractorId` int,
	`sortOrder` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ops_schedule_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ops_sub_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`subcontractorId` int NOT NULL,
	`token` varchar(64) NOT NULL,
	`expiresAt` timestamp,
	`isActive` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ops_sub_invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `ops_sub_invites_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `ops_sub_quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`subcontractorId` int NOT NULL,
	`title` varchar(300) NOT NULL,
	`items` json,
	`totalAmount` decimal(15,0),
	`fileUrl` text,
	`fileKey` varchar(500),
	`notes` text,
	`status` enum('submitted','reviewing','approved','rejected','revised') NOT NULL DEFAULT 'submitted',
	`reviewComment` text,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ops_sub_quotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ops_sub_work_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`subcontractorId` int NOT NULL,
	`reportDate` varchar(20) NOT NULL,
	`workDescription` text NOT NULL,
	`workersCount` int,
	`materialsUsed` text,
	`photoUrls` json,
	`issues` text,
	`status` enum('submitted','acknowledged','approved','rejected') NOT NULL DEFAULT 'submitted',
	`approvedBy` int,
	`approvedAt` timestamp,
	`approvalComment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ops_sub_work_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ops_subcontractors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(200) NOT NULL,
	`businessNumber` varchar(20),
	`representativeName` varchar(100),
	`contactName` varchar(100),
	`contactPhone` varchar(30),
	`contactEmail` varchar(320),
	`specialty` varchar(200),
	`bankName` varchar(100),
	`bankAccount` varchar(50),
	`bankHolder` varchar(100),
	`rating` int,
	`notes` text,
	`isActive` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ops_subcontractors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ops_work_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`authorId` int NOT NULL,
	`authorName` varchar(100),
	`reportDate` varchar(20) NOT NULL,
	`reportType` enum('daily','weekly','special') NOT NULL DEFAULT 'daily',
	`title` varchar(300) NOT NULL,
	`content` text NOT NULL,
	`weatherCondition` varchar(50),
	`workersCount` int,
	`safetyIssues` text,
	`photoUrls` json,
	`attachmentUrls` json,
	`status` enum('draft','submitted','reviewed') NOT NULL DEFAULT 'draft',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ops_work_reports_id` PRIMARY KEY(`id`)
);
