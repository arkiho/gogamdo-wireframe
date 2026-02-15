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
