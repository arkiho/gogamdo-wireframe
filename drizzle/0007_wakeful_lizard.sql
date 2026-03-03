CREATE TABLE `field_measurement_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectName` varchar(200) NOT NULL,
	`location` varchar(500),
	`description` text,
	`opsProjectId` int,
	`clientProjectId` int,
	`createdBy` int,
	`createdByName` varchar(100),
	`status` enum('active','completed','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `field_measurement_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `field_measurements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`panoramaId` int NOT NULL,
	`sessionId` int NOT NULL,
	`type` enum('distance','height','area','reference') NOT NULL DEFAULT 'distance',
	`label` varchar(200),
	`points` json NOT NULL,
	`rawAngle` decimal(10,6),
	`calibratedValue` decimal(10,3),
	`unit` varchar(10) DEFAULT 'm',
	`isReference` boolean DEFAULT false,
	`referenceRealValue` decimal(10,3),
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `field_measurements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `measurement_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`totalArea` decimal(10,2),
	`roomCount` int,
	`spaceSummary` json,
	`aiAnalysis` longtext,
	`pdfUrl` text,
	`pointCloudData` json,
	`digitalTwinStatus` enum('none','processing','ready') DEFAULT 'none',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `measurement_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `panorama_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`thumbnailUrl` text,
	`spotName` varchar(200) NOT NULL,
	`spotOrder` int DEFAULT 0,
	`cameraHeight` decimal(6,3),
	`calibrationData` json,
	`exifData` json,
	`imageWidth` int,
	`imageHeight` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `panorama_images_id` PRIMARY KEY(`id`)
);
