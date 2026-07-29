CREATE TABLE `mileage_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workOrderId` int,
	`startMileage` decimal(8,1) NOT NULL,
	`endMileage` decimal(8,1) NOT NULL,
	`totalMiles` decimal(7,1) NOT NULL,
	`fromLocation` varchar(255),
	`toLocation` varchar(255),
	`date` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mileage_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parts_markup` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workOrderId` int NOT NULL,
	`partName` varchar(255) NOT NULL,
	`partNumber` varchar(100),
	`costPrice` decimal(10,2) NOT NULL,
	`markupPercent` int NOT NULL,
	`billedPrice` decimal(10,2) NOT NULL,
	`supplier` varchar(255),
	`orderedAt` timestamp,
	`receivedAt` timestamp,
	`status` enum('ordered','received','installed','returned') NOT NULL DEFAULT 'ordered',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `parts_markup_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pay_periods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`periodStart` date NOT NULL,
	`periodEnd` date NOT NULL,
	`regularHours` decimal(6,2) DEFAULT '0',
	`overtimeHours` decimal(6,2) DEFAULT '0',
	`grossPay` decimal(10,2) NOT NULL,
	`deductions` decimal(10,2) DEFAULT '0',
	`netPay` decimal(10,2) NOT NULL,
	`status` enum('pending','approved','paid') NOT NULL DEFAULT 'pending',
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pay_periods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `time_clock` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clockIn` timestamp NOT NULL,
	`clockOut` timestamp,
	`breakMinutes` int DEFAULT 0,
	`totalHours` decimal(5,2),
	`notes` text,
	`date` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `time_clock_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_emails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text,
	`fromAddress` varchar(320),
	`toAddress` varchar(320),
	`direction` enum('inbound','outbound') NOT NULL DEFAULT 'outbound',
	`status` enum('draft','sent','received','read') NOT NULL DEFAULT 'draft',
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_emails_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_pay_rates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`rateType` enum('hourly','salary','commission','flat') NOT NULL DEFAULT 'hourly',
	`rate` decimal(10,2) NOT NULL,
	`overtimeRate` decimal(10,2),
	`effectiveDate` date NOT NULL,
	`endDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_pay_rates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_todos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`completed` boolean NOT NULL DEFAULT false,
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`dueDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_todos_id` PRIMARY KEY(`id`)
);
