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
