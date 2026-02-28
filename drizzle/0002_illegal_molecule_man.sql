CREATE TABLE `deletion_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tableName` varchar(100) NOT NULL,
	`recordId` int NOT NULL,
	`recordData` json NOT NULL,
	`deletedByUserId` int NOT NULL,
	`deletedByUserName` varchar(200),
	`reason` text,
	`restored` enum('yes','no') NOT NULL DEFAULT 'no',
	`restoredByUserId` int,
	`restoredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deletion_logs_id` PRIMARY KEY(`id`)
);
