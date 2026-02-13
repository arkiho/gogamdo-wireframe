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
