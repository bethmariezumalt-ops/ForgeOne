import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, date, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["owner", "admin", "technician", "customer", "user"]).default("user").notNull(),
  isActive: int("isActive").default(1).notNull(),
  performanceTier: mysqlEnum("performanceTier", ["titanium", "platinum", "gold", "silver", "bronze", "trainee"]).default("trainee"),
  experienceLevel: mysqlEnum("experienceLevel", ["expert", "master", "senior", "journeyman", "apprentice", "trainee"]).default("trainee"),
  experiencePoints: int("experiencePoints").default(0),
  lastSeen: timestamp("lastSeen").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Client companies that own fleet vehicles
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  clientType: mysqlEnum("clientType", ["regular", "one_time", "emergency"]).default("regular").notNull(),
  color: varchar("color", { length: 7 }).default("#3B82F6"),
  contactName: varchar("contactName", { length: 255 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 50 }),
  address: text("address"),
  location: varchar("location", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Fleet vehicles tracked in the system
 */
export const vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  vin: varchar("vin", { length: 17 }).notNull().unique(),
  year: int("year"),
  make: varchar("make", { length: 100 }),
  model: varchar("model", { length: 100 }),
  trim: varchar("trim", { length: 100 }),
  engine: varchar("engine", { length: 100 }),
  transmission: varchar("transmission", { length: 50 }),
  drivetrain: varchar("drivetrain", { length: 50 }),
  fuelType: varchar("fuelType", { length: 50 }),
  licensePlate: varchar("licensePlate", { length: 20 }),
  color: varchar("color", { length: 50 }),
  vehicleType: mysqlEnum("vehicleType", ["car", "van", "truck", "suv", "motorcycle", "boat", "jet_ski", "trailer", "airplane", "rv", "other"]).default("car").notNull(),
  assetCategory: mysqlEnum("assetCategory", ["fleet", "personal", "client"]).default("fleet").notNull(),
  currentMileage: int("currentMileage").default(0),
  unitNumber: varchar("unitNumber", { length: 50 }),
  // Registration & Compliance
  registrationExpiry: timestamp("registrationExpiry"),
  registrationState: varchar("registrationState", { length: 10 }),
  chpInspectionDue: timestamp("chpInspectionDue"),
  chpInspectionLast: timestamp("chpInspectionLast"),
  smogCheckDue: timestamp("smogCheckDue"),
  insuranceExpiry: timestamp("insuranceExpiry"),
  insuranceProvider: varchar("insuranceProvider", { length: 100 }),
  insurancePolicyNumber: varchar("insurancePolicyNumber", { length: 100 }),
  // Financial
  purchasePrice: decimal("purchasePrice", { precision: 10, scale: 2 }),
  purchaseDate: timestamp("purchaseDate"),
  currentValue: decimal("currentValue", { precision: 10, scale: 2 }),
  loanBalance: decimal("loanBalance", { precision: 10, scale: 2 }),
  monthlyPayment: decimal("monthlyPayment", { precision: 10, scale: 2 }),
  loanPayoffDate: timestamp("loanPayoffDate"),
  lender: varchar("lender", { length: 100 }),
  // VIN decoded data
  vinDecodedData: json("vinDecodedData"),
  recallData: json("recallData"),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;

/**
 * Predefined service categories
 */
export const serviceCategories = mysqlTable("service_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  categoryType: mysqlEnum("categoryType", ["vehicle", "building", "other"]).default("vehicle").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type InsertServiceCategory = typeof serviceCategories.$inferInsert;

/**
 * Work orders created by technicians
 */
export const workOrders = mysqlTable("work_orders", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicleId"),
  clientId: int("clientId").notNull(),
  technicianId: int("technicianId").notNull(),
  status: mysqlEnum("status", ["draft", "pending_approval", "approved", "denied", "in_progress", "completed"]).default("draft").notNull(),
  priority: mysqlEnum("priority", ["emergency", "high", "medium", "low"]).default("medium").notNull(),
  orderType: mysqlEnum("orderType", ["vehicle", "building", "general"]).default("vehicle").notNull(),
  businessLine: mysqlEnum("businessLine", ["acme_automotive", "customized_enterprise", "onsite_advantage"]).default("acme_automotive").notNull(),
  mileageAtService: int("mileageAtService"),
  notes: text("notes"),
  workDescription: text("workDescription"),
  chargeAmount: decimal("chargeAmount", { precision: 10, scale: 2 }),
  buildingLocation: varchar("buildingLocation", { length: 255 }),
  actualHours: decimal("actualHours", { precision: 6, scale: 2 }),
  billedHours: decimal("billedHours", { precision: 6, scale: 2 }),
  hourlyRate: decimal("hourlyRate", { precision: 8, scale: 2 }),
  isRedo: boolean("isRedo").default(false).notNull(),
  redoReason: text("redoReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type WorkOrder = typeof workOrders.$inferSelect;
export type InsertWorkOrder = typeof workOrders.$inferInsert;

/**
 * Individual line items on a work order
 */
export const workOrderItems = mysqlTable("work_order_items", {
  id: int("id").autoincrement().primaryKey(),
  workOrderId: int("workOrderId").notNull(),
  serviceCategoryId: int("serviceCategoryId"),
  description: text("description").notNull(),
  laborHours: decimal("laborHours", { precision: 5, scale: 2 }),
  laborRate: decimal("laborRate", { precision: 8, scale: 2 }),
  partsCost: decimal("partsCost", { precision: 8, scale: 2 }),
  totalCost: decimal("totalCost", { precision: 10, scale: 2 }),
  needsSourceOut: boolean("needsSourceOut").default(false).notNull(),
  sourceOutNotes: text("sourceOutNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WorkOrderItem = typeof workOrderItems.$inferSelect;
export type InsertWorkOrderItem = typeof workOrderItems.$inferInsert;

/**
 * Invoices generated from completed work orders
 */
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  workOrderId: int("workOrderId").notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull().unique(),
  clientId: int("clientId").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0.00"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["draft", "sent", "paid", "overdue"]).default("draft").notNull(),
  dueDate: date("dueDate"),
  paidDate: date("paidDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Maintenance schedules for recurring services
 */
export const maintenanceSchedules = mysqlTable("maintenance_schedules", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicleId").notNull(),
  serviceCategoryId: int("serviceCategoryId").notNull(),
  intervalMiles: int("intervalMiles"),
  intervalDays: int("intervalDays"),
  lastPerformedDate: date("lastPerformedDate"),
  lastPerformedMileage: int("lastPerformedMileage"),
  nextDueDate: date("nextDueDate"),
  nextDueMileage: int("nextDueMileage"),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MaintenanceSchedule = typeof maintenanceSchedules.$inferSelect;
export type InsertMaintenanceSchedule = typeof maintenanceSchedules.$inferInsert;

/**
 * Parts used on work orders - tracks cost vs charge for profitability
 */
export const parts = mysqlTable("parts", {
  id: int("id").autoincrement().primaryKey(),
  workOrderId: int("workOrderId").notNull(),
  partName: varchar("partName", { length: 255 }).notNull(),
  partNumber: varchar("partNumber", { length: 100 }),
  vendor: varchar("vendor", { length: 255 }),
  quantity: int("quantity").default(1).notNull(),
  costEach: decimal("costEach", { precision: 10, scale: 2 }).notNull(),
  chargeEach: decimal("chargeEach", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("totalCost", { precision: 10, scale: 2 }).notNull(),
  totalCharge: decimal("totalCharge", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Part = typeof parts.$inferSelect;
export type InsertPart = typeof parts.$inferInsert;

/**
 * Employee time entries for tracking hours worked
 */
export const timeEntries = mysqlTable("time_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workOrderId: int("workOrderId"),
  date: date("date").notNull(),
  hoursWorked: decimal("hoursWorked", { precision: 5, scale: 2 }).notNull(),
  hourlyRate: decimal("hourlyRate", { precision: 8, scale: 2 }).notNull(),
  totalPay: decimal("totalPay", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = typeof timeEntries.$inferInsert;

/**
 * Employee pay records (payments made to employees)
 */
export const payRecords = mysqlTable("pay_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  payDate: date("payDate").notNull(),
  periodStart: date("periodStart"),
  periodEnd: date("periodEnd"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PayRecord = typeof payRecords.$inferSelect;
export type InsertPayRecord = typeof payRecords.$inferInsert;

/**
 * Inventory items (supplies kept on hand: wipers, oil, filters, etc.)
 */
export const inventory = mysqlTable("inventory", {
  id: int("id").autoincrement().primaryKey(),
  itemName: varchar("itemName", { length: 255 }).notNull(),
  partNumber: varchar("partNumber", { length: 100 }),
  category: mysqlEnum("category", ["oil", "filters", "wipers", "fluids", "belts", "brakes", "electrical", "tools", "other"]).default("other").notNull(),
  quantityOnHand: int("quantityOnHand").default(0).notNull(),
  reorderLevel: int("reorderLevel").default(0),
  costPerUnit: decimal("costPerUnit", { precision: 8, scale: 2 }),
  vendor: varchar("vendor", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InventoryItem = typeof inventory.$inferSelect;
export type InsertInventoryItem = typeof inventory.$inferInsert;

/**
 * Inventory usage log - tracks when items are used on jobs
 */
export const inventoryUsage = mysqlTable("inventory_usage", {
  id: int("id").autoincrement().primaryKey(),
  inventoryId: int("inventoryId").notNull(),
  workOrderId: int("workOrderId"),
  quantityUsed: int("quantityUsed").notNull(),
  usedBy: int("usedBy").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InventoryUsageRecord = typeof inventoryUsage.$inferSelect;
export type InsertInventoryUsage = typeof inventoryUsage.$inferInsert;

/**
 * Driving log - tracks driving hours and mileage between jobs
 */
export const drivingLog = mysqlTable("driving_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: date("date").notNull(),
  startMileage: int("startMileage"),
  endMileage: int("endMileage"),
  totalMiles: int("totalMiles"),
  hoursWorked: decimal("hoursWorked", { precision: 5, scale: 2 }),
  drivingHours: decimal("drivingHours", { precision: 5, scale: 2 }),
  fromLocation: varchar("fromLocation", { length: 255 }),
  toLocation: varchar("toLocation", { length: 255 }),
  workOrderId: int("workOrderId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DrivingLogEntry = typeof drivingLog.$inferSelect;
export type InsertDrivingLog = typeof drivingLog.$inferInsert;

/**
 * Business expenses - Tony's truck maintenance, tools, equipment
 */
export const businessExpenses = mysqlTable("business_expenses", {
  id: int("id").autoincrement().primaryKey(),
  category: mysqlEnum("category", ["truck_maintenance", "tools", "fuel", "insurance", "equipment", "supplies", "other"]).default("other").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  vendor: varchar("vendor", { length: 255 }),
  date: date("date").notNull(),
  receiptUrl: text("receiptUrl"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BusinessExpense = typeof businessExpenses.$inferSelect;
export type InsertBusinessExpense = typeof businessExpenses.$inferInsert;

/**
 * Calendar events - scheduled work days, marketing days, side gigs
 */
export const calendarEvents = mysqlTable("calendar_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clientId: int("clientId"),
  title: varchar("title", { length: 255 }).notNull(),
  eventType: mysqlEnum("eventType", ["client_work", "marketing", "side_gig", "off_day", "emergency", "personal", "meeting", "appointment"]).default("personal").notNull(),
  date: date("date").notNull(),
  startTime: varchar("startTime", { length: 10 }),
  endTime: varchar("endTime", { length: 10 }),
  allDay: boolean("allDay").default(false).notNull(),
  isRecurring: boolean("isRecurring").default(false).notNull(),
  recurrenceRule: varchar("recurrenceRule", { length: 100 }), // e.g. "daily", "weekly", "monthly", "weekdays", "custom"
  recurrenceEndDate: date("recurrenceEndDate"),
  recurringDay: mysqlEnum("recurringDay", ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),
  location: varchar("location", { length: 255 }),
  notes: text("notes"),
  color: varchar("color", { length: 20 }),
  googleEventId: varchar("googleEventId", { length: 255 }),
  assignedTo: int("assignedTo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;

/**
 * Flip projects (Customized Enterprise) - buy anything, fix it, resell for profit
 * Types: furniture, vehicles, houses/real estate, other
 */
export const flipProjects = mysqlTable("flip_projects", {
  id: int("id").autoincrement().primaryKey(),
  projectType: mysqlEnum("projectType", ["furniture", "vehicle", "house", "other"]).default("furniture").notNull(),
  itemDescription: varchar("itemDescription", { length: 255 }).notNull(),
  source: varchar("source", { length: 255 }),
  purchaseDate: date("purchaseDate"),
  purchaseCost: decimal("purchaseCost", { precision: 10, scale: 2 }).notNull(),
  materialsCost: decimal("materialsCost", { precision: 10, scale: 2 }).default("0"),
  laborHours: decimal("laborHours", { precision: 5, scale: 2 }),
  resalePrice: decimal("resalePrice", { precision: 10, scale: 2 }),
  soldDate: date("soldDate"),
  status: mysqlEnum("status", ["purchased", "in_progress", "listed", "sold"]).default("purchased").notNull(),
  profit: decimal("profit", { precision: 10, scale: 2 }),
  notes: text("notes"),
  photoUrl: text("photoUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FlipProject = typeof flipProjects.$inferSelect;
export type InsertFlipProject = typeof flipProjects.$inferInsert;

/**
 * Work order photos - before/after photos, evidence of work done
 */
export const workOrderPhotos = mysqlTable("work_order_photos", {
  id: int("id").autoincrement().primaryKey(),
  workOrderId: int("workOrderId").notNull(),
  photoUrl: text("photoUrl").notNull(),
  photoKey: varchar("photoKey", { length: 512 }).notNull(),
  caption: varchar("caption", { length: 255 }),
  photoType: mysqlEnum("photoType", ["before", "after", "evidence", "other"]).default("evidence").notNull(),
  mediaType: mysqlEnum("mediaType", ["photo", "video"]).default("photo").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WorkOrderPhoto = typeof workOrderPhotos.$inferSelect;
export type InsertWorkOrderPhoto = typeof workOrderPhotos.$inferInsert;

/**
 * Potential bids / prospects for new client acquisition
 */
export const bids = mysqlTable("bids", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 50 }),
  address: text("address"),
  bidAmount: decimal("bidAmount", { precision: 10, scale: 2 }),
  estimatedVehicles: int("estimatedVehicles"),
  serviceType: mysqlEnum("serviceType", ["fleet_maintenance", "building_maintenance", "both", "other"]).default("fleet_maintenance").notNull(),
  status: mysqlEnum("status", ["prospect", "bid_sent", "negotiating", "won", "lost"]).default("prospect").notNull(),
  notes: text("notes"),
  followUpDate: date("followUpDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Bid = typeof bids.$inferSelect;
export type InsertBid = typeof bids.$inferInsert;

/**
 * Photos attached to bids/prospects
 */
export const bidPhotos = mysqlTable("bid_photos", {
  id: int("id").autoincrement().primaryKey(),
  bidId: int("bidId").notNull(),
  photoUrl: text("photoUrl").notNull(),
  photoKey: varchar("photoKey", { length: 512 }).notNull(),
  caption: varchar("caption", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type BidPhoto = typeof bidPhotos.$inferSelect;
export type InsertBidPhoto = typeof bidPhotos.$inferInsert;

// Activity tracking - who viewed what and when
export const activityLog = mysqlTable("activity_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 64 }).notNull(), // 'viewed_job', 'login', 'logout', 'created_order', etc.
  entityType: varchar("entityType", { length: 64 }), // 'work_order', 'vehicle', 'invoice', etc.
  entityId: int("entityId"),
  entityTitle: varchar("entityTitle", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = typeof activityLog.$inferInsert;

/**
 * Vehicle media - photos and videos of vehicle condition, damage, etc.
 */
export const vehicleMedia = mysqlTable("vehicle_media", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicleId").notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  mediaKey: varchar("mediaKey", { length: 512 }).notNull(),
  mediaType: mysqlEnum("mediaType", ["photo", "video"]).default("photo").notNull(),
  caption: varchar("caption", { length: 255 }),
  uploadedBy: int("uploadedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type VehicleMedia = typeof vehicleMedia.$inferSelect;
export type InsertVehicleMedia = typeof vehicleMedia.$inferInsert;

/**
 * Flip project media - before/after photos and videos of furniture, vehicles, houses
 */
export const flipProjectMedia = mysqlTable("flip_project_media", {
  id: int("id").autoincrement().primaryKey(),
  flipProjectId: int("flipProjectId").notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  mediaKey: varchar("mediaKey", { length: 512 }).notNull(),
  mediaType: mysqlEnum("mediaType", ["photo", "video"]).default("photo").notNull(),
  photoType: mysqlEnum("photoType", ["before", "after", "progress", "other"]).default("other").notNull(),
  caption: varchar("caption", { length: 255 }),
  uploadedBy: int("uploadedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type FlipProjectMedia = typeof flipProjectMedia.$inferSelect;
export type InsertFlipProjectMedia = typeof flipProjectMedia.$inferInsert;

/**
 * Mileage tracking log for vehicles
 */
export const mileageLogs = mysqlTable("mileage_logs", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicleId").notNull(),
  mileage: int("mileage").notNull(),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
  recordedBy: int("recordedBy"),
  source: mysqlEnum("source", ["manual", "work_order", "driving_log", "service"]).default("manual").notNull(),
  notes: varchar("notes", { length: 255 }),
});
export type MileageLog = typeof mileageLogs.$inferSelect;
export type InsertMileageLog = typeof mileageLogs.$inferInsert;

/**
 * Service records - specific maintenance items done on vehicles
 */
export const serviceRecords = mysqlTable("service_records", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicleId").notNull(),
  workOrderId: int("workOrderId"),
  serviceType: varchar("serviceType", { length: 100 }).notNull(),
  description: text("description"),
  mileageAtService: int("mileageAtService"),
  servicedAt: timestamp("servicedAt").defaultNow().notNull(),
  nextDueMileage: int("nextDueMileage"),
  nextDueDate: timestamp("nextDueDate"),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  performedBy: varchar("performedBy", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ServiceRecord = typeof serviceRecords.$inferSelect;
export type InsertServiceRecord = typeof serviceRecords.$inferInsert;

/**
 * General assets - houses, boats, jet skis, trailers, airplanes, etc.
 */
export const generalAssets = mysqlTable("general_assets", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  assetType: mysqlEnum("assetType", ["house", "boat", "jet_ski", "trailer", "airplane", "rv", "equipment", "other"]).default("other").notNull(),
  category: mysqlEnum("category", ["personal", "business", "investment"]).default("personal").notNull(),
  description: text("description"),
  address: text("address"),
  serialNumber: varchar("serialNumber", { length: 100 }),
  purchasePrice: decimal("purchasePrice", { precision: 12, scale: 2 }),
  purchaseDate: timestamp("purchaseDate"),
  currentValue: decimal("currentValue", { precision: 12, scale: 2 }),
  loanBalance: decimal("loanBalance", { precision: 12, scale: 2 }),
  monthlyPayment: decimal("monthlyPayment", { precision: 10, scale: 2 }),
  loanPayoffDate: timestamp("loanPayoffDate"),
  lender: varchar("lender", { length: 100 }),
  insuranceProvider: varchar("insuranceProvider", { length: 100 }),
  insurancePolicyNumber: varchar("insurancePolicyNumber", { length: 100 }),
  insuranceExpiry: timestamp("insuranceExpiry"),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type GeneralAsset = typeof generalAssets.$inferSelect;
export type InsertGeneralAsset = typeof generalAssets.$inferInsert;

/**
 * Real estate leads - Homes by Beth Marie
 */
export const realEstateLeads = mysqlTable("real_estate_leads", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  status: mysqlEnum("status", ["new", "contacted", "showing", "offer", "under_contract", "closed", "lost"]).default("new").notNull(),
  leadSource: varchar("leadSource", { length: 100 }),
  propertyInterest: text("propertyInterest"),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  notes: text("notes"),
  followUpDate: timestamp("followUpDate"),
  isHot: boolean("isHot").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RealEstateLead = typeof realEstateLeads.$inferSelect;
export type InsertRealEstateLead = typeof realEstateLeads.$inferInsert;

// ============ PHONE CALLS ============
export const phoneCalls = mysqlTable("phone_calls", {
  id: int("id").primaryKey().autoincrement(),
  clientId: int("client_id"),
  contactName: varchar("contact_name", { length: 255 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 50 }),
  direction: mysqlEnum("direction", ["outbound", "inbound"]).default("outbound"),
  outcome: mysqlEnum("outcome", ["reached", "voicemail", "no_answer", "callback_requested", "not_called"]).default("not_called"),
  businessLine: varchar("business_line", { length: 50 }),
  notes: text("notes"),
  followUpDate: timestamp("follow_up_date"),
  isCompleted: boolean("is_completed").default(false),
    assignedTo: int("assigned_to"),
  createdBy: int("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
// ============ WORK ORDER EDIT HISTORY ============
export const workOrderEdits = mysqlTable("work_order_edits", {
  id: int("id").primaryKey().autoincrement(),
  workOrderId: int("work_order_id").notNull(),
  userId: int("user_id"),
  userName: varchar("user_name", { length: 255 }),
  action: mysqlEnum("action", ["updated_details", "added_item", "edited_item", "deleted_item", "status_change", "added_note"]).notNull(),
  fieldChanged: varchar("field_changed", { length: 100 }),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});
export type WorkOrderEdit = typeof workOrderEdits.$inferSelect;

/**
 * Customer inquiries from advertising/prospects
 */
export const customerInquiries = mysqlTable("customer_inquiries", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  source: varchar("source", { length: 100 }), // how they found us: ad, referral, website, social media, etc.
  serviceNeeded: text("serviceNeeded"), // what they might need done
  vehicleInfo: text("vehicleInfo"), // vehicle year/make/model if applicable
  notes: text("notes"),
  status: mysqlEnum("status", ["new", "contacted", "quoted", "scheduled", "converted", "lost"]).default("new").notNull(),
  businessLine: varchar("businessLine", { length: 100 }), // which business they're inquiring about
  quotedAmount: decimal("quotedAmount", { precision: 10, scale: 2 }),
  followUpDate: timestamp("followUpDate"),
  assignedTo: int("assignedTo"), // user id who is handling this inquiry
  convertedToClientId: int("convertedToClientId"), // if converted, link to client
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});


/**
 * Hour banking transactions - tracks banked/borrowed hours per work order
 */
export const hourBankTransactions = mysqlTable("hour_bank_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // technician whose bank this affects
  workOrderId: int("workOrderId"), // related work order (null for manual adjustments)
  type: mysqlEnum("type", ["banked", "borrowed", "adjustment"]).notNull(),
  hours: decimal("hours", { precision: 6, scale: 2 }).notNull(), // positive = banked, negative = borrowed
  billedHours: decimal("billedHours", { precision: 6, scale: 2 }),
  actualHours: decimal("actualHours", { precision: 6, scale: 2 }),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * User invites - admin/owner creates a profile slot that a new user can claim
 */
export const userInvites = mysqlTable("user_invites", {
  id: int("id").autoincrement().primaryKey(),
  inviteCode: varchar("inviteCode", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["owner", "admin", "technician", "customer", "user"]).default("user").notNull(),
  email: varchar("email", { length: 320 }),
  createdBy: int("createdBy").notNull(), // admin/owner who created this invite
  claimedBy: int("claimedBy"), // user id who claimed this invite
  status: mysqlEnum("status", ["pending", "claimed", "expired"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  claimedAt: timestamp("claimedAt"),
});

/**
 * Personal todo items per user
 */
export const userTodos = mysqlTable("user_todos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  completed: boolean("completed").default(false).notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  dueDate: date("dueDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * Email tracking per user
 */
export const userEmails = mysqlTable("user_emails", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body"),
  fromAddress: varchar("fromAddress", { length: 320 }),
  toAddress: varchar("toAddress", { length: 320 }),
  direction: mysqlEnum("direction", ["inbound", "outbound"]).default("outbound").notNull(),
  status: mysqlEnum("status", ["draft", "sent", "received", "read"]).default("draft").notNull(),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Time clock - techs clock in/out to track actual hours worked
 */
export const timeClock = mysqlTable("time_clock", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clockIn: timestamp("clockIn").notNull(),
  clockOut: timestamp("clockOut"),
  breakMinutes: int("breakMinutes").default(0),
  totalHours: decimal("totalHours", { precision: 5, scale: 2 }),
  notes: text("notes"),
  date: date("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Tech mileage log - track mileage between jobs for technicians
 */
export const techMileageLog = mysqlTable("tech_mileage", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workOrderId: int("workOrderId"),
  startMileage: decimal("startMileage", { precision: 8, scale: 1 }).notNull(),
  endMileage: decimal("endMileage", { precision: 8, scale: 1 }).notNull(),
  totalMiles: decimal("totalMiles", { precision: 7, scale: 1 }).notNull(),
  fromLocation: varchar("fromLocation", { length: 255 }),
  toLocation: varchar("toLocation", { length: 255 }),
  date: date("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Parts markup tracking - track cost vs billed with configurable markup
 */
export const partsMarkup = mysqlTable("parts_markup", {
  id: int("id").autoincrement().primaryKey(),
  workOrderId: int("workOrderId").notNull(),
  partName: varchar("partName", { length: 255 }).notNull(),
  partNumber: varchar("partNumber", { length: 100 }),
  costPrice: decimal("costPrice", { precision: 10, scale: 2 }).notNull(),
  markupPercent: int("markupPercent").notNull(), // 25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300
  billedPrice: decimal("billedPrice", { precision: 10, scale: 2 }).notNull(),
  supplier: varchar("supplier", { length: 255 }),
  orderedAt: timestamp("orderedAt"),
  receivedAt: timestamp("receivedAt"),
  status: mysqlEnum("status", ["ordered", "received", "installed", "returned"]).default("ordered").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * User pay rates and tracking
 */
export const userPayRates = mysqlTable("user_pay_rates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  rateType: mysqlEnum("rateType", ["hourly", "salary", "commission", "flat"]).default("hourly").notNull(),
  rate: decimal("rate", { precision: 10, scale: 2 }).notNull(),
  overtimeRate: decimal("overtimeRate", { precision: 10, scale: 2 }),
  effectiveDate: date("effectiveDate").notNull(),
  endDate: date("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Pay periods - actual pay issued
 */
export const payPeriods = mysqlTable("pay_periods", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  periodStart: date("periodStart").notNull(),
  periodEnd: date("periodEnd").notNull(),
  regularHours: decimal("regularHours", { precision: 6, scale: 2 }).default("0"),
  overtimeHours: decimal("overtimeHours", { precision: 6, scale: 2 }).default("0"),
  grossPay: decimal("grossPay", { precision: 10, scale: 2 }).notNull(),
  deductions: decimal("deductions", { precision: 10, scale: 2 }).default("0"),
  netPay: decimal("netPay", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "paid"]).default("pending").notNull(),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserTodo = typeof userTodos.$inferSelect;
export type InsertUserTodo = typeof userTodos.$inferInsert;
export type UserEmail = typeof userEmails.$inferSelect;
export type InsertUserEmail = typeof userEmails.$inferInsert;
export type TimeClock = typeof timeClock.$inferSelect;
export type InsertTimeClock = typeof timeClock.$inferInsert;
export type TechMileageLog = typeof techMileageLog.$inferSelect;
export type InsertTechMileageLog = typeof techMileageLog.$inferInsert;
export type PartsMarkup = typeof partsMarkup.$inferSelect;
export type InsertPartsMarkup = typeof partsMarkup.$inferInsert;
export type UserPayRate = typeof userPayRates.$inferSelect;
export type PayPeriod = typeof payPeriods.$inferSelect;
