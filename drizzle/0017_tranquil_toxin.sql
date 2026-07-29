ALTER TABLE `calendar_events` MODIFY COLUMN `eventType` enum('client_work','marketing','side_gig','off_day','emergency','personal','meeting','appointment') NOT NULL DEFAULT 'personal';--> statement-breakpoint
ALTER TABLE `calendar_events` ADD `allDay` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `calendar_events` ADD `recurrenceRule` varchar(100);--> statement-breakpoint
ALTER TABLE `calendar_events` ADD `recurrenceEndDate` date;--> statement-breakpoint
ALTER TABLE `calendar_events` ADD `color` varchar(20);--> statement-breakpoint
ALTER TABLE `calendar_events` ADD `googleEventId` varchar(255);