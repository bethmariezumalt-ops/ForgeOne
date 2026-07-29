CREATE TABLE `customer_inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(50),
	`email` varchar(320),
	`source` varchar(100),
	`serviceNeeded` text,
	`vehicleInfo` text,
	`notes` text,
	`status` enum('new','contacted','quoted','scheduled','converted','lost') NOT NULL DEFAULT 'new',
	`businessLine` varchar(100),
	`quotedAmount` decimal(10,2),
	`followUpDate` timestamp,
	`assignedTo` int,
	`convertedToClientId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_inquiries_id` PRIMARY KEY(`id`)
);
