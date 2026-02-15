CREATE TABLE `insight_articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(200) NOT NULL,
	`title` varchar(500) NOT NULL,
	`subtitle` varchar(500),
	`category` enum('trend','cost_guide','case_study','tip','news') NOT NULL,
	`excerpt` text NOT NULL,
	`content` text NOT NULL,
	`coverImageUrl` text,
	`author` varchar(100) DEFAULT '고감도 편집팀',
	`readTimeMinutes` int DEFAULT 5,
	`tags` json,
	`metaTitle` varchar(200),
	`metaDescription` text,
	`featured` boolean DEFAULT false,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`publishedAt` timestamp,
	`viewCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `insight_articles_id` PRIMARY KEY(`id`),
	CONSTRAINT `insight_articles_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `newsletter_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`previewText` varchar(300),
	`articleIds` json,
	`customContent` text,
	`htmlContent` text,
	`status` enum('draft','scheduled','sending','sent','failed') NOT NULL DEFAULT 'draft',
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`recipientCount` int DEFAULT 0,
	`openCount` int DEFAULT 0,
	`clickCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `newsletter_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsletter_subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(100),
	`company` varchar(200),
	`status` enum('active','unsubscribed','bounced') NOT NULL DEFAULT 'active',
	`unsubscribeToken` varchar(64) NOT NULL,
	`source` enum('website','contact_form','manual','lead_magnet') DEFAULT 'website',
	`subscribedAt` timestamp NOT NULL DEFAULT (now()),
	`unsubscribedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `newsletter_subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `newsletter_subscribers_email_unique` UNIQUE(`email`),
	CONSTRAINT `newsletter_subscribers_unsubscribeToken_unique` UNIQUE(`unsubscribeToken`)
);
