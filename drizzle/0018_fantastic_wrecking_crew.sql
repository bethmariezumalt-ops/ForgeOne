CREATE TABLE `general_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`assetType` enum('house','boat','jet_ski','trailer','airplane','rv','equipment','other') NOT NULL DEFAULT 'other',
	`category` enum('personal','business','investment') NOT NULL DEFAULT 'personal',
	`description` text,
	`address` text,
	`serialNumber` varchar(100),
	`purchasePrice` decimal(12,2),
	`purchaseDate` timestamp,
	`currentValue` decimal(12,2),
	`loanBalance` decimal(12,2),
	`monthlyPayment` decimal(10,2),
	`loanPayoffDate` timestamp,
	`lender` varchar(100),
	`insuranceProvider` varchar(100),
	`insurancePolicyNumber` varchar(100),
	`insuranceExpiry` timestamp,
	`notes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `general_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mileage_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleId` int NOT NULL,
	`mileage` int NOT NULL,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	`recordedBy` int,
	`source` enum('manual','work_order','driving_log','service') NOT NULL DEFAULT 'manual',
	`notes` varchar(255),
	CONSTRAINT `mileage_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `real_estate_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255),
	`phone` varchar(50),
	`status` enum('new','contacted','showing','offer','under_contract','closed','lost') NOT NULL DEFAULT 'new',
	`leadSource` varchar(100),
	`propertyInterest` text,
	`budget` decimal(12,2),
	`notes` text,
	`followUpDate` timestamp,
	`isHot` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `real_estate_leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `service_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleId` int NOT NULL,
	`workOrderId` int,
	`serviceType` varchar(100) NOT NULL,
	`description` text,
	`mileageAtService` int,
	`servicedAt` timestamp NOT NULL DEFAULT (now()),
	`nextDueMileage` int,
	`nextDueDate` timestamp,
	`cost` decimal(10,2),
	`performedBy` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `service_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `vehicles` MODIFY COLUMN `vehicleType` enum('car','van','truck','suv','motorcycle','boat','jet_ski','trailer','airplane','rv','other') NOT NULL DEFAULT 'car';--> statement-breakpoint
ALTER TABLE `vehicles` ADD `trim` varchar(100);--> statement-breakpoint
ALTER TABLE `vehicles` ADD `engine` varchar(100);--> statement-breakpoint
ALTER TABLE `vehicles` ADD `transmission` varchar(50);--> statement-breakpoint
ALTER TABLE `vehicles` ADD `drivetrain` varchar(50);--> statement-breakpoint
ALTER TABLE `vehicles` ADD `fuelType` varchar(50);--> statement-breakpoint
ALTER TABLE `vehicles` ADD `assetCategory` enum('fleet','personal','client') DEFAULT 'fleet' NOT NULL;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `registrationExpiry` timestamp;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `registrationState` varchar(10);--> statement-breakpoint
ALTER TABLE `vehicles` ADD `chpInspectionDue` timestamp;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `chpInspectionLast` timestamp;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `smogCheckDue` timestamp;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `insuranceExpiry` timestamp;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `insuranceProvider` varchar(100);--> statement-breakpoint
ALTER TABLE `vehicles` ADD `insurancePolicyNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `vehicles` ADD `purchasePrice` decimal(10,2);--> statement-breakpoint
ALTER TABLE `vehicles` ADD `purchaseDate` timestamp;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `currentValue` decimal(10,2);--> statement-breakpoint
ALTER TABLE `vehicles` ADD `loanBalance` decimal(10,2);--> statement-breakpoint
ALTER TABLE `vehicles` ADD `monthlyPayment` decimal(10,2);--> statement-breakpoint
ALTER TABLE `vehicles` ADD `loanPayoffDate` timestamp;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `lender` varchar(100);--> statement-breakpoint
ALTER TABLE `vehicles` ADD `vinDecodedData` json;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `recallData` json;