CREATE TABLE `hour_bank_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workOrderId` int,
	`type` enum('banked','borrowed','adjustment') NOT NULL,
	`hours` decimal(6,2) NOT NULL,
	`billedHours` decimal(6,2),
	`actualHours` decimal(6,2),
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hour_bank_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inviteCode` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` enum('owner','admin','technician','customer','user') NOT NULL DEFAULT 'user',
	`email` varchar(320),
	`createdBy` int NOT NULL,
	`claimedBy` int,
	`status` enum('pending','claimed','expired') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`claimedAt` timestamp,
	CONSTRAINT `user_invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_invites_inviteCode_unique` UNIQUE(`inviteCode`)
);
