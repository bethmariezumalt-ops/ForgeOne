CREATE TABLE `business_expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` enum('truck_maintenance','tools','fuel','insurance','equipment','supplies','other') NOT NULL DEFAULT 'other',
	`description` text NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`vendor` varchar(255),
	`date` date NOT NULL,
	`receiptUrl` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `driving_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` date NOT NULL,
	`startMileage` int,
	`endMileage` int,
	`totalMiles` int,
	`hoursWorked` decimal(5,2),
	`drivingHours` decimal(5,2),
	`fromLocation` varchar(255),
	`toLocation` varchar(255),
	`workOrderId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `driving_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemName` varchar(255) NOT NULL,
	`partNumber` varchar(100),
	`category` enum('oil','filters','wipers','fluids','belts','brakes','electrical','tools','other') NOT NULL DEFAULT 'other',
	`quantityOnHand` int NOT NULL DEFAULT 0,
	`reorderLevel` int DEFAULT 0,
	`costPerUnit` decimal(8,2),
	`vendor` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inventoryId` int NOT NULL,
	`workOrderId` int,
	`quantityUsed` int NOT NULL,
	`usedBy` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_usage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `clients` ADD `clientType` enum('regular','one_time','emergency') DEFAULT 'regular' NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` ADD `location` varchar(255);