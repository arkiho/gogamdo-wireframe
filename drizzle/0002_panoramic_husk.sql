CREATE TABLE `ai_redesigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`originalImageUrl` text NOT NULL,
	`prompt` text NOT NULL,
	`resultImageUrl` text,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`customerName` varchar(100),
	`customerEmail` varchar(320),
	`customerPhone` varchar(30),
	`spaceType` varchar(50),
	`userIp` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_redesigns_id` PRIMARY KEY(`id`)
);
