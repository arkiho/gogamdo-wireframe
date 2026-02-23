CREATE TABLE `purchase_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`poNumber` varchar(50) NOT NULL,
	`title` varchar(300) NOT NULL,
	`items` json,
	`estimatedTotal` decimal(15,0),
	`requiredDate` varchar(20),
	`deliveryAddress` text,
	`authorId` int NOT NULL,
	`authorName` varchar(100),
	`status` enum('draft','rfq_sent','quotes_received','quote_selected','ordered','delivered','cancelled') NOT NULL DEFAULT 'draft',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchase_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rfq_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`purchaseOrderId` int NOT NULL,
	`subcontractorId` int NOT NULL,
	`itemIds` json,
	`status` enum('sent','viewed','quoted','selected','not_selected','expired') NOT NULL DEFAULT 'sent',
	`quotedItems` json,
	`quotedTotal` decimal(15,0),
	`quotedAt` timestamp,
	`token` varchar(64) NOT NULL,
	`expiresAt` timestamp,
	`sentAt` timestamp,
	`viewedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rfq_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `rfq_requests_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `sub_contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subcontractorId` int NOT NULL,
	`tradeCategoryId` int NOT NULL,
	`templateId` int,
	`contractNumber` varchar(50) NOT NULL,
	`title` varchar(300) NOT NULL,
	`content` longtext NOT NULL,
	`partyA` varchar(200) NOT NULL DEFAULT '주식회사 고감도',
	`partyB` varchar(200) NOT NULL,
	`startDate` varchar(20) NOT NULL,
	`endDate` varchar(20) NOT NULL,
	`partyASignatureUrl` text,
	`partyASignatureKey` varchar(500),
	`partyBSignatureUrl` text,
	`partyBSignatureKey` varchar(500),
	`partyASignedAt` timestamp,
	`partyBSignedAt` timestamp,
	`partyASignedBy` int,
	`partyBSignerName` varchar(100),
	`pdfUrl` text,
	`pdfKey` varchar(500),
	`status` enum('draft','pending_b','pending_a','active','expired','terminated') NOT NULL DEFAULT 'draft',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sub_contracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sub_registration_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(200) NOT NULL,
	`businessNumber` varchar(20),
	`representativeName` varchar(100),
	`contactName` varchar(100),
	`contactPhone` varchar(30),
	`contactEmail` varchar(320),
	`address` text,
	`tradeIds` json,
	`specialty` varchar(500),
	`bankName` varchar(100),
	`bankAccount` varchar(50),
	`bankHolder` varchar(100),
	`businessLicenseUrl` text,
	`businessLicenseKey` varchar(500),
	`status` enum('pending','staff_approved','approved','rejected') NOT NULL DEFAULT 'pending',
	`requestedBy` int NOT NULL,
	`requestedByName` varchar(100),
	`staffApprovedBy` int,
	`staffApprovedByName` varchar(100),
	`staffApprovedAt` timestamp,
	`staffComment` text,
	`adminApprovedBy` int,
	`adminApprovedByName` varchar(100),
	`adminApprovedAt` timestamp,
	`adminComment` text,
	`rejectedBy` int,
	`rejectedByName` varchar(100),
	`rejectedAt` timestamp,
	`rejectionReason` text,
	`subcontractorId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sub_registration_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subcontractor_trades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subcontractorId` int NOT NULL,
	`tradeCategoryId` int NOT NULL,
	`isPrimary` tinyint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subcontractor_trades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trade_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(20) NOT NULL,
	`description` text,
	`parentId` int,
	`sortOrder` int DEFAULT 0,
	`isActive` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trade_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `trade_categories_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `trade_contract_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tradeCategoryId` int NOT NULL,
	`name` varchar(300) NOT NULL,
	`content` longtext NOT NULL,
	`validityMonths` int NOT NULL DEFAULT 12,
	`version` int DEFAULT 1,
	`isActive` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trade_contract_templates_id` PRIMARY KEY(`id`)
);
