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
