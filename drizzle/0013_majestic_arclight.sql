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
ALTER TABLE `newsletter_subscribers` MODIFY COLUMN `source` enum('website','contact_form','manual','lead_magnet','estimator','portfolio','insight','ai_chat','style_quiz') DEFAULT 'website';--> statement-breakpoint
ALTER TABLE `newsletter_campaigns` ADD `segmentId` int;