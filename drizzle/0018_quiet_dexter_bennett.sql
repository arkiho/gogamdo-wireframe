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
