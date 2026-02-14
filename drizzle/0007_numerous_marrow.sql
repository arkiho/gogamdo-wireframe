CREATE TABLE `sensor_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sensorId` int NOT NULL,
	`projectId` int NOT NULL,
	`value` varchar(50) NOT NULL,
	`recordedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sensor_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sensors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`type` enum('temperature','humidity','illuminance','co2','noise','occupancy','motion','air_quality','power') NOT NULL,
	`unit` varchar(20),
	`posX` int,
	`posY` int,
	`zone` varchar(100),
	`deviceId` varchar(100),
	`active` enum('yes','no') NOT NULL DEFAULT 'yes',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sensors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `space_analysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`zone` varchar(100),
	`analysisType` enum('occupancy_pattern','environmental','energy','comfort','traffic_flow') NOT NULL,
	`summary` text,
	`dataJson` json,
	`recommendations` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `space_analysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `space_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(300) NOT NULL,
	`client` varchar(200),
	`location` varchar(300),
	`area` varchar(50),
	`floorPlanUrl` text,
	`floorPlanWidth` int,
	`floorPlanHeight` int,
	`description` text,
	`status` enum('setup','collecting','analyzing','completed') NOT NULL DEFAULT 'setup',
	`analysisReport` json,
	`startDate` timestamp,
	`endDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `space_projects_id` PRIMARY KEY(`id`)
);
