CREATE TABLE `calendar_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientId` int,
	`title` varchar(255) NOT NULL,
	`eventType` enum('client_work','marketing','side_gig','off_day','emergency') NOT NULL DEFAULT 'client_work',
	`date` date NOT NULL,
	`startTime` varchar(10),
	`endTime` varchar(10),
	`isRecurring` boolean NOT NULL DEFAULT false,
	`recurringDay` enum('monday','tuesday','wednesday','thursday','friday','saturday','sunday'),
	`location` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calendar_events_id` PRIMARY KEY(`id`)
);
