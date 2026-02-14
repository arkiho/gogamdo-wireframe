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
