CREATE TABLE `rewall_comparisons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientProjectId` int,
	`userId` int,
	`traditionalCost` int DEFAULT 0,
	`rewallCost` int DEFAULT 0,
	`savingsAmount` int DEFAULT 0,
	`savingsPercent` int DEFAULT 0,
	`comparisonDetails` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rewall_comparisons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rewall_inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`warehouseLocation` varchar(200),
	`quantity` int NOT NULL DEFAULT 0,
	`reservedQuantity` int NOT NULL DEFAULT 0,
	`lastRestockedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rewall_inventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rewall_pricing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`pricingType` enum('daily','weekly','monthly','purchase') NOT NULL DEFAULT 'monthly',
	`price` int NOT NULL DEFAULT 0,
	`discountPercent` int DEFAULT 0,
	`validFrom` timestamp,
	`validTo` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rewall_pricing_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rewall_reservation_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reservationId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`unitPrice` int NOT NULL DEFAULT 0,
	`subtotal` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rewall_reservation_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rewall_reservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientProjectId` int,
	`userId` int NOT NULL,
	`reservationStatus` enum('draft','confirmed','in_progress','completed','cancelled') NOT NULL DEFAULT 'draft',
	`installDate` varchar(10),
	`returnDate` varchar(10),
	`totalAmount` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rewall_reservations_id` PRIMARY KEY(`id`)
);
