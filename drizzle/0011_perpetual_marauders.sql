CREATE TABLE `bids` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`contactName` varchar(255),
	`contactEmail` varchar(320),
	`contactPhone` varchar(50),
	`address` text,
	`bidAmount` decimal(10,2),
	`estimatedVehicles` int,
	`serviceType` enum('fleet_maintenance','building_maintenance','both','other') NOT NULL DEFAULT 'fleet_maintenance',
	`status` enum('prospect','bid_sent','negotiating','won','lost') NOT NULL DEFAULT 'prospect',
	`notes` text,
	`followUpDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bids_id` PRIMARY KEY(`id`)
);
