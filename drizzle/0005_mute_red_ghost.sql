CREATE TABLE `draft_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`draftId` int NOT NULL,
	`originalUrl` text NOT NULL,
	`processedUrl` text,
	`watermarkedUrl` text,
	`thumbnailUrl` text,
	`filename` varchar(300),
	`driveFileId` varchar(200),
	`aiProcessed` enum('yes','no') NOT NULL DEFAULT 'no',
	`processingStatus` enum('pending','processing','done','error') NOT NULL DEFAULT 'pending',
	`sortOrder` int DEFAULT 0,
	`isCover` enum('yes','no') NOT NULL DEFAULT 'no',
	`caption` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `draft_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drive_sync_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`folderId` varchar(200) NOT NULL,
	`folderPath` varchar(500),
	`fileCount` int DEFAULT 0,
	`draftId` int,
	`syncStatus` enum('syncing','done','error') NOT NULL DEFAULT 'syncing',
	`lastSyncAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `drive_sync_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolio_drafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(300) NOT NULL,
	`projectName` varchar(200),
	`category` varchar(100),
	`client` varchar(200),
	`area` varchar(50),
	`location` varchar(200),
	`duration` varchar(100),
	`description` text,
	`aiDescription` text,
	`tags` json,
	`status` enum('draft','review','published','archived') NOT NULL DEFAULT 'draft',
	`driveFolder` varchar(500),
	`driveFolderId` varchar(200),
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolio_drafts_id` PRIMARY KEY(`id`)
);
