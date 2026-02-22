CREATE TABLE `auto_email_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientProjectId` int,
	`recipientEmail` varchar(320) NOT NULL,
	`recipientName` varchar(200),
	`emailType` enum('initial_survey','survey_reminder','analysis_report','company_survey_link','company_survey_updated','realestate_matches','proposal','post_occupancy','optimization_report') NOT NULL,
	`subject` varchar(500) NOT NULL,
	`status` enum('queued','sent','delivered','failed','bounced') NOT NULL DEFAULT 'queued',
	`metadata` json,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auto_email_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_site_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`authorId` int NOT NULL,
	`reportDate` varchar(20) NOT NULL,
	`weather` varchar(50),
	`temperature` varchar(20),
	`workersInternal` int DEFAULT 0,
	`workersExternal` int DEFAULT 0,
	`workerDetails` json,
	`workCompleted` text NOT NULL,
	`workPlanned` text,
	`materialsReceived` json,
	`safetyChecklist` json,
	`qualityIssues` text,
	`specialNotes` text,
	`clientRequests` text,
	`photoUrls` json,
	`overallProgress` int,
	`scheduleStatus` enum('on_track','ahead','delayed') DEFAULT 'on_track',
	`status` enum('draft','submitted','reviewed','approved') NOT NULL DEFAULT 'draft',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`reviewNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_site_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `insight_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientProjectId` int NOT NULL,
	`opsProjectId` int,
	`clientUserId` int,
	`plan` enum('basic','standard','premium') NOT NULL DEFAULT 'basic',
	`status` enum('active','paused','cancelled','expired') NOT NULL DEFAULT 'active',
	`startDate` varchar(20) NOT NULL,
	`endDate` varchar(20),
	`nextReportDate` varchar(20),
	`monthlyFee` decimal,
	`sensorProjectId` int,
	`sensorsInstalled` json,
	`lastReportId` int,
	`totalReports` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `insight_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kpi_definitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(300) NOT NULL,
	`description` text,
	`category` varchar(100),
	`department` varchar(100),
	`measureUnit` varchar(50),
	`targetValue` decimal(15,2),
	`weight` int DEFAULT 100,
	`frequency` enum('daily','weekly','monthly','quarterly','yearly') NOT NULL DEFAULT 'monthly',
	`calculationMethod` enum('manual','auto_count','auto_sum','auto_avg','formula') NOT NULL DEFAULT 'manual',
	`autoQuery` text,
	`isActive` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kpi_definitions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kpi_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kpiId` int NOT NULL,
	`userId` int NOT NULL,
	`period` varchar(20) NOT NULL,
	`targetValue` decimal(15,2),
	`actualValue` decimal(15,2),
	`achievementRate` decimal(5,2),
	`notes` text,
	`evidence` json,
	`status` enum('pending','submitted','approved','rejected') NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kpi_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `maintenance_visits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientProjectId` int NOT NULL,
	`opsProjectId` int,
	`visitType` enum('fine_tuning','warranty','optimization','inspection') NOT NULL,
	`scheduledDate` varchar(20) NOT NULL,
	`scheduledTime` varchar(10),
	`technicianId` int,
	`technicianName` varchar(200),
	`description` text,
	`workPerformed` text,
	`issuesFound` json,
	`photoUrls` json,
	`clientSignature` text,
	`status` enum('scheduled','confirmed','in_progress','completed','cancelled','rescheduled') NOT NULL DEFAULT 'scheduled',
	`completedAt` timestamp,
	`clientFeedback` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `maintenance_visits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `material_price_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`materialCode` varchar(100) NOT NULL,
	`materialName` varchar(300) NOT NULL,
	`category` varchar(100),
	`avgPrice` decimal(15,0),
	`minPrice` decimal(15,0),
	`maxPrice` decimal(15,0),
	`priceChangeRate` decimal(5,2),
	`sampleCount` int DEFAULT 0,
	`trendDirection` enum('rising','stable','falling') DEFAULT 'stable',
	`aiInsight` text,
	`alertLevel` enum('normal','watch','alert') DEFAULT 'normal',
	`periodStart` varchar(20),
	`periodEnd` varchar(20),
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `material_price_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `material_price_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`materialCode` varchar(100) NOT NULL,
	`materialName` varchar(300) NOT NULL,
	`category` varchar(100),
	`specification` text,
	`unit` varchar(50),
	`unitPrice` decimal(15,0) NOT NULL,
	`vendorName` varchar(200),
	`vendorQuoteId` int,
	`projectId` int,
	`priceDate` varchar(20) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `material_price_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `okr_key_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`objectiveId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`measureType` enum('number','percentage','currency','boolean') NOT NULL DEFAULT 'number',
	`startValue` decimal(15,2) DEFAULT '0',
	`targetValue` decimal(15,2) NOT NULL,
	`currentValue` decimal(15,2) DEFAULT '0',
	`progress` int DEFAULT 0,
	`confidence` enum('on_track','at_risk','off_track') DEFAULT 'on_track',
	`notes` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `okr_key_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `okr_objectives` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`parentId` int,
	`level` enum('company','department','team','individual') NOT NULL DEFAULT 'individual',
	`title` varchar(500) NOT NULL,
	`description` text,
	`period` varchar(20) NOT NULL,
	`progress` int DEFAULT 0,
	`status` enum('draft','active','completed','cancelled') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `okr_objectives_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_occupancy_surveys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientProjectId` int NOT NULL,
	`opsProjectId` int,
	`surveyInstanceId` int,
	`overallSatisfaction` int,
	`designSatisfaction` int,
	`constructionSatisfaction` int,
	`communicationSatisfaction` int,
	`timelineSatisfaction` int,
	`issuesReported` json,
	`positiveComments` text,
	`improvementSuggestions` text,
	`wouldRecommend` tinyint,
	`status` enum('pending','sent','completed','follow_up_needed') NOT NULL DEFAULT 'pending',
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `post_occupancy_surveys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `program_diagrams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientProjectId` int NOT NULL,
	`realestateMatchId` int,
	`floorPlanId` int,
	`title` varchar(300) NOT NULL,
	`diagramData` json NOT NULL,
	`aiAnalysis` text,
	`version` int DEFAULT 1,
	`isSelected` tinyint DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `program_diagrams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `realestate_matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`searchCriteriaId` int NOT NULL,
	`clientProjectId` int NOT NULL,
	`propertyName` varchar(300) NOT NULL,
	`address` text NOT NULL,
	`totalArea` decimal(10,2),
	`usableArea` decimal(10,2),
	`floor` varchar(50),
	`buildingName` varchar(200),
	`monthlyRent` decimal(15,0),
	`deposit` decimal(15,0),
	`managementFee` decimal(15,0),
	`floorPlanUrl` text,
	`photoUrls` json,
	`matchScore` int,
	`matchReasons` json,
	`status` enum('matched','shortlisted','viewing_scheduled','viewed','selected','rejected') NOT NULL DEFAULT 'matched',
	`clientNotes` text,
	`viewingDate` varchar(20),
	`externalSource` varchar(100),
	`externalId` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `realestate_matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `realestate_search_criteria` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientProjectId` int NOT NULL,
	`projectType` enum('relocation','renovation') NOT NULL,
	`desiredArea` decimal(10,2),
	`minArea` decimal(10,2),
	`maxArea` decimal(10,2),
	`desiredLocation` text,
	`budgetMin` decimal(15,0),
	`budgetMax` decimal(15,0),
	`moveInDate` varchar(20),
	`floorPreference` varchar(100),
	`buildingType` varchar(100),
	`parkingNeeded` int,
	`additionalRequirements` text,
	`status` enum('searching','matched','viewing','selected','closed') NOT NULL DEFAULT 'searching',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `realestate_search_criteria_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rewall_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(300) NOT NULL,
	`sku` varchar(100),
	`category` varchar(100),
	`description` text,
	`specifications` json,
	`pricePerUnit` decimal(15,0),
	`unit` varchar(50),
	`imageUrls` json,
	`isActive` tinyint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rewall_products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rewall_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientProjectId` int,
	`clientUserId` int,
	`plan` enum('purchase','lease','rental') NOT NULL DEFAULT 'rental',
	`monthlyFee` decimal(15,0),
	`contractMonths` int,
	`totalValue` decimal(15,0),
	`status` enum('draft','active','paused','cancelled','expired') NOT NULL DEFAULT 'draft',
	`startDate` varchar(20),
	`endDate` varchar(20),
	`items` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rewall_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `space_optimization_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriptionId` int NOT NULL,
	`clientProjectId` int NOT NULL,
	`reportPeriod` varchar(50) NOT NULL,
	`occupancyAnalysis` json,
	`environmentAnalysis` json,
	`trafficAnalysis` json,
	`optimizationSuggestions` json,
	`summary` text,
	`fullReport` longtext,
	`status` enum('generating','ready','sent','reviewed') NOT NULL DEFAULT 'generating',
	`sentAt` timestamp,
	`viewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `space_optimization_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `survey_analysis_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instanceId` int NOT NULL,
	`clientProjectId` int,
	`reportType` enum('initial_analysis','company_analysis','space_requirement','optimization') NOT NULL,
	`title` varchar(300) NOT NULL,
	`summary` text,
	`content` longtext NOT NULL,
	`insights` json,
	`spaceRequirements` json,
	`isBlurred` tinyint NOT NULL DEFAULT 1,
	`viewCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `survey_analysis_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `survey_instances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`clientProjectId` int,
	`token` varchar(128) NOT NULL,
	`type` enum('initial_manager','company_wide','post_occupancy') NOT NULL,
	`recipientEmail` varchar(320),
	`recipientName` varchar(200),
	`status` enum('pending','sent','opened','in_progress','completed','expired') NOT NULL DEFAULT 'pending',
	`customQuestions` json,
	`responseCount` int DEFAULT 0,
	`sentAt` timestamp,
	`completedAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `survey_instances_id` PRIMARY KEY(`id`),
	CONSTRAINT `survey_instances_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `survey_question_options` (
	`id` int AUTO_INCREMENT NOT NULL,
	`questionId` int NOT NULL,
	`optionText` varchar(500) NOT NULL,
	`optionValue` varchar(200),
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `survey_question_options_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `survey_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`sectionTitle` varchar(200),
	`questionText` text NOT NULL,
	`questionType` enum('single_choice','multiple_choice','scale','text','number','matrix') NOT NULL,
	`isRequired` tinyint NOT NULL DEFAULT 1,
	`sortOrder` int NOT NULL DEFAULT 0,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `survey_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `survey_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instanceId` int NOT NULL,
	`respondentName` varchar(200),
	`respondentEmail` varchar(320),
	`respondentDepartment` varchar(200),
	`respondentRole` varchar(200),
	`answers` json NOT NULL,
	`completedAt` timestamp,
	`ipAddress` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `survey_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `survey_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(300) NOT NULL,
	`type` enum('initial_manager','company_wide','post_occupancy','custom') NOT NULL,
	`description` text,
	`isDefault` tinyint DEFAULT 0,
	`isActive` tinyint NOT NULL DEFAULT 1,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `survey_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vendor_quote_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quoteId` int NOT NULL,
	`itemName` varchar(300) NOT NULL,
	`specification` text,
	`unit` varchar(50),
	`quantity` decimal(10,2),
	`unitPrice` decimal(15,0),
	`amount` decimal(15,0),
	`category` varchar(100),
	`materialCode` varchar(100),
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vendor_quote_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vendor_quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`subcontractorId` int,
	`vendorName` varchar(200) NOT NULL,
	`vendorContact` varchar(200),
	`vendorEmail` varchar(320),
	`vendorPhone` varchar(30),
	`quoteNumber` varchar(100),
	`quoteDate` varchar(20),
	`validUntil` varchar(20),
	`fileUrl` text,
	`fileKey` varchar(500),
	`fileName` varchar(300),
	`fileType` varchar(50),
	`totalAmount` decimal(15,0),
	`vatAmount` decimal(15,0),
	`aiParsed` tinyint DEFAULT 0,
	`aiParsedData` json,
	`status` enum('submitted','reviewing','accepted','rejected','revised') NOT NULL DEFAULT 'submitted',
	`reviewNotes` text,
	`category` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vendor_quotes_id` PRIMARY KEY(`id`)
);
