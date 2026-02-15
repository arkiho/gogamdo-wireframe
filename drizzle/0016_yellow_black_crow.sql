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
