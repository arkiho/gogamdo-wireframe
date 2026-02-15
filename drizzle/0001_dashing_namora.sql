CREATE TABLE `clients_auth` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`name` varchar(100) NOT NULL,
	`company` varchar(200),
	`phone` varchar(20),
	`emailVerified` enum('yes','no') NOT NULL DEFAULT 'no',
	`emailVerifyToken` varchar(64),
	`emailVerifyExpires` timestamp,
	`passwordResetToken` varchar(64),
	`passwordResetExpires` timestamp,
	`status` enum('active','suspended','pending') NOT NULL DEFAULT 'pending',
	`assignedProjectIds` json,
	`lastLoginAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_auth_id` PRIMARY KEY(`id`),
	CONSTRAINT `clients_auth_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `sensor_api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`apiKey` varchar(64) NOT NULL,
	`active` enum('yes','no') NOT NULL DEFAULT 'yes',
	`lastUsedAt` timestamp,
	`requestCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sensor_api_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `sensor_api_keys_apiKey_unique` UNIQUE(`apiKey`)
);
