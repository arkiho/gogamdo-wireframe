ALTER TABLE `users` ADD `department` enum('design','construction','accounting','management','sales','none') DEFAULT 'none';--> statement-breakpoint
ALTER TABLE `users` ADD `opsRole` enum('pm','designer','site_manager','accountant','director','staff') DEFAULT 'staff';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);