CREATE TABLE `occupancy_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`sensorId` int NOT NULL,
	`zoneId` int,
	`eventType` enum('enter','exit','count_change') NOT NULL,
	`count` int DEFAULT 0,
	`eventAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `occupancy_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `space_zones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`color` varchar(20) DEFAULT '#3b82f6',
	`polygon` json,
	`zoneType` enum('office','meeting','corridor','lounge','restroom','kitchen','storage','other') DEFAULT 'office',
	`capacity` int,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `space_zones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `zone_occupancy_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`zoneId` int NOT NULL,
	`bucketHour` timestamp NOT NULL,
	`avgOccupancy` int DEFAULT 0,
	`maxOccupancy` int DEFAULT 0,
	`totalMinutesOccupied` int DEFAULT 0,
	`enterCount` int DEFAULT 0,
	`exitCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `zone_occupancy_stats_id` PRIMARY KEY(`id`)
);
