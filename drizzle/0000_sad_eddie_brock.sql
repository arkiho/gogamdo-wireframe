CREATE TABLE `ai_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`type` enum('analysis','proposal') NOT NULL,
	`title` varchar(300) NOT NULL,
	`content` longtext NOT NULL,
	`summary` text,
	`emailSentAt` timestamp,
	`emailSentTo` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`message` text NOT NULL,
	`linkUrl` varchar(500),
	`linkText` varchar(100),
	`bgColor` varchar(20) DEFAULT '#111111',
	`textColor` varchar(20) DEFAULT '#ffffff',
	`active` enum('yes','no') NOT NULL DEFAULT 'yes',
	`priority` int DEFAULT 0,
	`startsAt` timestamp,
	`endsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`messages` json,
	`contactEmail` varchar(320),
	`contactName` varchar(100),
	`contactPhone` varchar(30),
	`summary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chat_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `chat_sessions_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
CREATE TABLE `client_floor_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`fileName` varchar(500) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileType` varchar(50) NOT NULL,
	`fileSize` int,
	`floorNumber` int,
	`floorName` varchar(100),
	`totalArea` decimal(10,2),
	`aiAnalysis` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_floor_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyName` varchar(200) NOT NULL,
	`contactName` varchar(100) NOT NULL,
	`contactEmail` varchar(320) NOT NULL,
	`contactPhone` varchar(30),
	`employeeCount` int,
	`currentAddress` text,
	`desiredMoveDate` varchar(50),
	`budgetRange` varchar(100),
	`status` enum('created','floor_plan_uploaded','survey_completed','report_generated','report_sent','company_survey_shared','company_survey_done','meeting_requested','meeting_confirmed','completed') NOT NULL DEFAULT 'created',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `company_survey_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`surveyId` int NOT NULL,
	`department` varchar(100),
	`role` varchar(100),
	`tenure` enum('less_1y','1_3y','3_5y','5_10y','over_10y'),
	`overallSatisfaction` int,
	`noiseSatisfaction` int,
	`lightingSatisfaction` int,
	`temperatureSatisfaction` int,
	`spaceSatisfaction` int,
	`privacySatisfaction` int,
	`deskUsageHours` int,
	`meetingHoursPerDay` decimal(3,1),
	`collaborationFrequency` enum('rarely','sometimes','often','always'),
	`focusWorkNeed` enum('low','medium','high','critical'),
	`desiredSpaces` json,
	`improvementSuggestions` text,
	`additionalComments` text,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `company_survey_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `company_wide_surveys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`token` varchar(64) NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`expiresAt` timestamp,
	`maxResponses` int,
	`isActive` tinyint NOT NULL DEFAULT 1,
	`responseCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `company_wide_surveys_id` PRIMARY KEY(`id`),
	CONSTRAINT `company_wide_surveys_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `crm_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int,
	`clientId` int,
	`type` enum('stage_change','note','task','file_upload','email_sent','call_logged','meeting_scheduled') NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text,
	`metadata` json,
	`createdBy` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(200) NOT NULL,
	`contactName` varchar(100) NOT NULL,
	`contactTitle` varchar(100),
	`email` varchar(320),
	`phone` varchar(30),
	`address` text,
	`industry` varchar(100),
	`companySize` varchar(50),
	`source` enum('website','referral','cold_call','exhibition','sns','other') DEFAULT 'website',
	`notes` text,
	`tags` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crm_clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_deals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`title` varchar(300) NOT NULL,
	`stage` enum('lead','consultation','proposal','negotiation','contract','design','construction','completed','lost') NOT NULL DEFAULT 'lead',
	`estimatedValue` int,
	`actualValue` int,
	`area` varchar(50),
	`spaceType` enum('office','commercial','medical','education','residential','other'),
	`startDate` timestamp,
	`expectedEndDate` timestamp,
	`actualEndDate` timestamp,
	`assignedTo` varchar(100),
	`probability` int,
	`description` text,
	`lostReason` text,
	`tags` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crm_deals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_interactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`type` enum('phone_call','email','meeting','site_visit','video_call','kakao','note') NOT NULL,
	`subject` varchar(300) NOT NULL,
	`content` text,
	`outcome` text,
	`nextAction` text,
	`nextActionDate` timestamp,
	`assignedTo` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_interactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `design_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(300) NOT NULL,
	`clientId` int,
	`crmDealId` int,
	`companyName` varchar(200),
	`contactName` varchar(100),
	`contactEmail` varchar(320),
	`contactPhone` varchar(30),
	`stage` enum('floorplan','rfp','analysis','layout','rendering','proposal','estimate','completed') NOT NULL DEFAULT 'floorplan',
	`status` enum('active','paused','completed','archived') NOT NULL DEFAULT 'active',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `design_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `detailed_estimates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`proposalId` int,
	`version` int DEFAULT 1,
	`title` varchar(300) NOT NULL,
	`items` json,
	`subtotal` int,
	`vat` int,
	`totalAmount` int,
	`optionItems` json,
	`pdfUrl` text,
	`excelUrl` text,
	`notes` text,
	`validUntil` timestamp,
	`status` enum('draft','generating','review','final','sent') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `detailed_estimates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `download_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`userName` varchar(255),
	`userEmail` varchar(255),
	`fileType` enum('estimate_pdf','expense_pdf','project_report_pdf','proposal_pdf','lead_magnet','ai_estimate_result','design_auto_result','other') NOT NULL,
	`fileName` varchar(500),
	`projectId` int,
	`projectName` varchar(255),
	`trackingCode` varchar(64) NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`consentGiven` enum('yes','no') NOT NULL DEFAULT 'no',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `download_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `draft_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`draftId` int NOT NULL,
	`originalUrl` text NOT NULL,
	`beforeUrl` text,
	`processedUrl` text,
	`watermarkedUrl` text,
	`thumbnailUrl` text,
	`filename` varchar(300),
	`driveFileId` varchar(200),
	`aiProcessed` enum('yes','no') NOT NULL DEFAULT 'no',
	`processingStatus` enum('pending','processing','done','error') NOT NULL DEFAULT 'pending',
	`sortOrder` int DEFAULT 0,
	`isCover` enum('yes','no') NOT NULL DEFAULT 'no',
	`caption` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `draft_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drive_sync_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`folderId` varchar(200) NOT NULL,
	`folderPath` varchar(500),
	`fileCount` int DEFAULT 0,
	`draftId` int,
	`syncStatus` enum('syncing','done','error') NOT NULL DEFAULT 'syncing',
	`lastSyncAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `drive_sync_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `estimates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64),
	`spaceType` varchar(50),
	`area` int,
	`grade` varchar(30),
	`resultJson` json,
	`totalMin` int,
	`totalMax` int,
	`contactEmail` varchar(320),
	`contactName` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `estimates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `floor_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(500),
	`fileName` varchar(300),
	`fileType` varchar(50),
	`fileSize` int,
	`totalArea` varchar(50),
	`floors` int,
	`roomCount` int,
	`aiAnalysis` json,
	`analysisStatus` enum('pending','analyzing','done','error') NOT NULL DEFAULT 'pending',
	`analysisError` text,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `floor_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`company` varchar(200),
	`email` varchar(320) NOT NULL,
	`phone` varchar(30),
	`type` varchar(50),
	`budget` varchar(50),
	`area` varchar(50),
	`message` text NOT NULL,
	`status` enum('new','contacted','in_progress','completed') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `insight_articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(200) NOT NULL,
	`title` varchar(500) NOT NULL,
	`subtitle` varchar(500),
	`category` enum('trend','cost_guide','case_study','tip','news') NOT NULL,
	`excerpt` text NOT NULL,
	`content` text NOT NULL,
	`coverImageUrl` text,
	`author` varchar(100) DEFAULT '고감도 편집팀',
	`readTimeMinutes` int DEFAULT 5,
	`tags` json,
	`metaTitle` varchar(200),
	`metaDescription` text,
	`featured` boolean DEFAULT false,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`publishedAt` timestamp,
	`viewCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `insight_articles_id` PRIMARY KEY(`id`),
	CONSTRAINT `insight_articles_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `layout_options` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`optionName` varchar(100) NOT NULL,
	`concept` text,
	`layoutImageUrl` text,
	`layoutData` json,
	`spaceAllocation` json,
	`pros` json,
	`cons` json,
	`aiScore` int,
	`isSelected` enum('yes','no') NOT NULL DEFAULT 'no',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `layout_options_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_downloads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(100),
	`company` varchar(200),
	`resourceId` varchar(50) NOT NULL,
	`resourceTitle` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lead_downloads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meeting_bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`requestedDate` varchar(20) NOT NULL,
	`requestedTime` varchar(10) NOT NULL,
	`duration` int NOT NULL DEFAULT 60,
	`meetingType` enum('online','visit','office') NOT NULL DEFAULT 'office',
	`location` text,
	`agenda` text,
	`status` enum('requested','confirmed','rescheduled','cancelled','completed') NOT NULL DEFAULT 'requested',
	`confirmedDate` varchar(20),
	`confirmedTime` varchar(10),
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meeting_bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsletter_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`previewText` varchar(300),
	`articleIds` json,
	`customContent` text,
	`htmlContent` text,
	`segmentId` int,
	`status` enum('draft','scheduled','sending','sent','failed') NOT NULL DEFAULT 'draft',
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`recipientCount` int DEFAULT 0,
	`openCount` int DEFAULT 0,
	`clickCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `newsletter_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsletter_subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(100),
	`company` varchar(200),
	`status` enum('active','unsubscribed','bounced') NOT NULL DEFAULT 'active',
	`unsubscribeToken` varchar(64) NOT NULL,
	`source` enum('website','contact_form','manual','lead_magnet','estimator','portfolio','insight','ai_chat','style_quiz') DEFAULT 'website',
	`subscribedAt` timestamp NOT NULL DEFAULT (now()),
	`unsubscribedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `newsletter_subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `newsletter_subscribers_email_unique` UNIQUE(`email`),
	CONSTRAINT `newsletter_subscribers_unsubscribeToken_unique` UNIQUE(`unsubscribeToken`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('inquiry','estimate','crm_deal','crm_stage_change','newsletter','chat','system') NOT NULL,
	`title` varchar(300) NOT NULL,
	`message` text NOT NULL,
	`linkUrl` varchar(500),
	`metadata` json,
	`isRead` enum('yes','no') NOT NULL DEFAULT 'no',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `occupancy_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`sensorId` int NOT NULL,
	`zoneId` int,
	`eventType` enum('enter','exit','count_change') NOT NULL,
	`count` int DEFAULT 0,
	`eventAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `occupancy_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `ops_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int,
	`recipientId` int NOT NULL,
	`type` enum('schedule_delay','expense_submitted','expense_approved','expense_rejected','sub_quote_submitted','sub_report_submitted','meeting_scheduled','meeting_reminder','project_status','client_inquiry','approval_pending','general') NOT NULL,
	`title` varchar(300) NOT NULL,
	`message` text,
	`link` varchar(500),
	`isRead` tinyint NOT NULL DEFAULT 0,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ops_notifications_id` PRIMARY KEY(`id`)
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
CREATE TABLE `ops_sub_evaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`subcontractorId` int NOT NULL,
	`evaluatorId` int NOT NULL,
	`qualityScore` int NOT NULL,
	`scheduleScore` int NOT NULL,
	`safetyScore` int NOT NULL,
	`communicationScore` int NOT NULL,
	`cleanupScore` int NOT NULL,
	`overallScore` decimal(3,1),
	`strengths` text,
	`improvements` text,
	`recommendation` enum('highly_recommended','recommended','neutral','not_recommended') NOT NULL DEFAULT 'neutral',
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ops_sub_evaluations_id` PRIMARY KEY(`id`)
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
--> statement-breakpoint
CREATE TABLE `popups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`content` text NOT NULL,
	`imageUrl` text,
	`linkUrl` varchar(500),
	`linkText` varchar(100),
	`position` enum('center','bottom_right','bottom_left') NOT NULL DEFAULT 'center',
	`showOnce` enum('yes','no') NOT NULL DEFAULT 'no',
	`active` enum('yes','no') NOT NULL DEFAULT 'yes',
	`priority` int DEFAULT 0,
	`startsAt` timestamp,
	`endsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `popups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolio_drafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(300) NOT NULL,
	`projectName` varchar(200),
	`category` varchar(100),
	`client` varchar(200),
	`area` varchar(50),
	`location` varchar(200),
	`duration` varchar(100),
	`description` text,
	`aiDescription` text,
	`tags` json,
	`status` enum('draft','review','published','archived') NOT NULL DEFAULT 'draft',
	`driveFolder` varchar(500),
	`driveFolderId` varchar(200),
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolio_drafts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolio_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portfolioId` int NOT NULL,
	`reviewerName` varchar(100) NOT NULL,
	`reviewerTitle` varchar(100),
	`reviewerCompany` varchar(200),
	`reviewerEmail` varchar(320),
	`reviewerPhone` varchar(30),
	`reviewerPhotoUrl` text,
	`rating` int,
	`title` varchar(300),
	`content` text,
	`highlights` json,
	`accessToken` varchar(64) NOT NULL,
	`tokenExpiresAt` timestamp,
	`status` enum('pending','submitted','approved','rejected') NOT NULL DEFAULT 'pending',
	`adminNote` text,
	`approvedAt` timestamp,
	`submittedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolio_reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `portfolio_reviews_accessToken_unique` UNIQUE(`accessToken`)
);
--> statement-breakpoint
CREATE TABLE `proposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`version` int DEFAULT 1,
	`title` varchar(300) NOT NULL,
	`clientAnalysis` json,
	`designConcept` text,
	`spaceProgram` json,
	`materialPlan` json,
	`furniturePlan` json,
	`projectTimeline` json,
	`companyIntro` text,
	`differentiators` json,
	`pdfUrl` text,
	`pptUrl` text,
	`status` enum('draft','generating','review','final') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `proposals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `renderings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`layoutId` int,
	`spaceType` varchar(100) NOT NULL,
	`spaceName` varchar(200),
	`prompt` text,
	`imageUrl` text,
	`thumbnailUrl` text,
	`style` varchar(100),
	`status` enum('pending','generating','done','error') NOT NULL DEFAULT 'pending',
	`error` text,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `renderings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rfp_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`collectionMethod` enum('form','ai_generator','chatbot') NOT NULL DEFAULT 'form',
	`companyName` varchar(200),
	`industry` varchar(100),
	`foundedYear` int,
	`projectType` enum('new_office','relocation','renovation','expansion'),
	`currentAddress` text,
	`newAddress` text,
	`totalArea` varchar(50),
	`currentHeadcount` int,
	`plannedHeadcount1y` int,
	`plannedHeadcount3y` int,
	`departments` json,
	`spaceRequirements` json,
	`preferredStyle` varchar(100),
	`brandColors` json,
	`brandGuidelineUrl` text,
	`referenceImages` json,
	`referenceUrls` json,
	`preferredMaterials` json,
	`lightingPreference` varchar(200),
	`avItRequirements` text,
	`networkInfra` text,
	`securitySystem` text,
	`acousticPrivacy` varchar(100),
	`hvacRequirements` text,
	`esgRequirements` text,
	`budgetRange` varchar(100),
	`budgetInclDesign` enum('yes','no','separate'),
	`priorityOrder` varchar(200),
	`desiredStartDate` timestamp,
	`desiredEndDate` timestamp,
	`occupiedDuringWork` enum('yes','no','partial'),
	`buildingRestrictions` text,
	`reuseExistingFurniture` enum('yes','no','partial'),
	`specialRequests` text,
	`competitorBenchmarks` text,
	`aiSummary` text,
	`completionRate` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rfp_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sensor_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sensorId` int NOT NULL,
	`projectId` int NOT NULL,
	`value` varchar(50) NOT NULL,
	`recordedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sensor_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sensors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`type` enum('temperature','humidity','illuminance','co2','noise','occupancy','motion','air_quality','power') NOT NULL,
	`unit` varchar(20),
	`posX` int,
	`posY` int,
	`zone` varchar(100),
	`deviceId` varchar(100),
	`active` enum('yes','no') NOT NULL DEFAULT 'yes',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sensors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `space_analysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`zone` varchar(100),
	`analysisType` enum('occupancy_pattern','environmental','energy','comfort','traffic_flow') NOT NULL,
	`summary` text,
	`dataJson` json,
	`recommendations` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `space_analysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `space_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(300) NOT NULL,
	`client` varchar(200),
	`location` varchar(300),
	`area` varchar(50),
	`floorPlanUrl` text,
	`floorPlanWidth` int,
	`floorPlanHeight` int,
	`description` text,
	`status` enum('setup','collecting','analyzing','completed') NOT NULL DEFAULT 'setup',
	`analysisReport` json,
	`startDate` timestamp,
	`endDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `space_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `space_zones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`color` varchar(20) DEFAULT '#3b82f6',
	`polygon` json,
	`zoneType` enum('office','meeting','corridor','lounge','restroom','kitchen','storage','other') DEFAULT 'office',
	`capacity` int,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `space_zones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `style_recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`industry` varchar(100),
	`teamSize` varchar(50),
	`mood` varchar(100),
	`budget` varchar(50),
	`priorities` json,
	`resultJson` json,
	`imageUrl` text,
	`contactEmail` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `style_recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriber_segments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`color` varchar(20) DEFAULT '#b8860b',
	`filterConditions` json,
	`matchCount` int DEFAULT 0,
	`lastCalculatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriber_segments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriber_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriberId` int NOT NULL,
	`tag` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscriber_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(100),
	`company` varchar(200),
	`source` varchar(50) DEFAULT 'footer',
	`active` enum('yes','no') NOT NULL DEFAULT 'yes',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscribers_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `tour_videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(300),
	`videoUrl` text,
	`thumbnailUrl` text,
	`duration` int,
	`renderingIds` json,
	`status` enum('pending','generating','done','error') NOT NULL DEFAULT 'pending',
	`error` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tour_videos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`department` enum('design','construction','accounting','management','sales','none') DEFAULT 'none',
	`opsRole` enum('pm','designer','site_manager','accountant','director','staff') DEFAULT 'staff',
	`phone` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `work_surveys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`respondentName` varchar(100) NOT NULL,
	`respondentRole` varchar(100),
	`respondentEmail` varchar(320),
	`workStyle` enum('collaborative','focused','hybrid','flexible'),
	`remoteWorkRatio` int,
	`meetingFrequency` enum('rarely','few_weekly','daily','very_frequent'),
	`privateOfficeCount` int,
	`meetingRoomCount` int,
	`needsLounge` tinyint,
	`needsCafeteria` tinyint,
	`needsPhoneBooth` tinyint,
	`needsLibrary` tinyint,
	`needsGym` tinyint,
	`needsNapRoom` tinyint,
	`specialSpaces` text,
	`designStyle` enum('modern','minimal','warm','industrial','natural','luxury','creative'),
	`colorPreference` varchar(200),
	`brandColors` varchar(200),
	`inspirationNotes` text,
	`currentPainPoints` json,
	`priorityAreas` json,
	`acRequirements` text,
	`lightingPreference` enum('natural','warm','cool','mixed'),
	`noiseControl` enum('critical','important','moderate','not_important'),
	`storageNeeds` enum('minimal','moderate','extensive'),
	`techRequirements` text,
	`budgetPriority` enum('cost_saving','balanced','quality_first'),
	`timelineUrgency` enum('flexible','within_6months','within_3months','urgent'),
	`additionalNotes` text,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `work_surveys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `zone_occupancy_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`zoneId` int NOT NULL,
	`bucketHour` timestamp NOT NULL,
	`avgOccupancy` int DEFAULT 0,
	`maxOccupancy` int DEFAULT 0,
	`totalMinutesOccupied` int DEFAULT 0,
	`enterCount` int DEFAULT 0,
	`exitCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `zone_occupancy_stats_id` PRIMARY KEY(`id`)
);
