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
