CREATE TABLE `ops_camera_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cameraId` int NOT NULL,
	`eventType` enum('online','offline','snapshot','motion','error') NOT NULL,
	`message` text,
	`snapshotUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ops_camera_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staff_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(30),
	`department` enum('design','construction','accounting','management','sales','none') DEFAULT 'none',
	`message` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`rejectReason` text,
	`createdUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `staff_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staff_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`invitedByUserId` int NOT NULL,
	`token` varchar(128) NOT NULL,
	`department` enum('design','construction','accounting','management','sales','none') DEFAULT 'none',
	`opsRole` enum('pm','designer','site_manager','accountant','director','staff') DEFAULT 'staff',
	`status` enum('pending','accepted','expired','cancelled') NOT NULL DEFAULT 'pending',
	`acceptedUserId` int,
	`acceptedAt` timestamp,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `staff_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `staff_invitations_token_unique` UNIQUE(`token`)
);
