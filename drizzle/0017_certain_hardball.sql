CREATE TABLE `ops_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int,
	`recipientId` int NOT NULL,
	`type` enum('schedule_delay','expense_submitted','expense_approved','expense_rejected','sub_quote_submitted','sub_report_submitted','meeting_scheduled','meeting_reminder','project_status','client_inquiry','approval_pending','general') NOT NULL,
	`title` varchar(300) NOT NULL,
	`message` text,
	`link` varchar(500),
	`isRead` tinyint NOT NULL DEFAULT 0,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ops_notifications_id` PRIMARY KEY(`id`)
);
