CREATE TABLE `lead_downloads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(100),
	`company` varchar(200),
	`resourceId` varchar(50) NOT NULL,
	`resourceTitle` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lead_downloads_id` PRIMARY KEY(`id`)
);
