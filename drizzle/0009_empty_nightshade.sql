CREATE TABLE `work_order_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workOrderId` int NOT NULL,
	`photoUrl` text NOT NULL,
	`photoKey` varchar(512) NOT NULL,
	`caption` varchar(255),
	`photoType` enum('before','after','evidence','other') NOT NULL DEFAULT 'evidence',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `work_order_photos_id` PRIMARY KEY(`id`)
);
