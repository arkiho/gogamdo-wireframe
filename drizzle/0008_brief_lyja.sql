CREATE TABLE `client_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`projectId` int,
	`type` enum('status_change','meeting_confirmed','meeting_cancelled','report_ready','survey_complete','system') NOT NULL,
	`title` varchar(300) NOT NULL,
	`message` text NOT NULL,
	`linkUrl` varchar(500),
	`metadata` json,
	`isRead` enum('yes','no') NOT NULL DEFAULT 'no',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_notifications_id` PRIMARY KEY(`id`)
);
