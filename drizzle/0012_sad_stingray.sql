CREATE TABLE `bid_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bidId` int NOT NULL,
	`photoUrl` text NOT NULL,
	`photoKey` varchar(512) NOT NULL,
	`caption` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bid_photos_id` PRIMARY KEY(`id`)
);
