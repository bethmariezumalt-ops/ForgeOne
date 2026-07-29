import { eq, and, desc, asc, lte, or, isNull, sql, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  clients, InsertClient,
  vehicles, InsertVehicle,
  serviceCategories, InsertServiceCategory,
  workOrders, InsertWorkOrder,
  workOrderItems, InsertWorkOrderItem,
  invoices, InsertInvoice,
  maintenanceSchedules, InsertMaintenanceSchedule,
  parts, InsertPart,
  timeEntries, InsertTimeEntry,
  payRecords, InsertPayRecord,
  inventory, InsertInventoryItem,
  inventoryUsage, InsertInventoryUsage,
  drivingLog, InsertDrivingLog,
  businessExpenses, InsertBusinessExpense,
  calendarEvents, InsertCalendarEvent,
  flipProjects, InsertFlipProject,
  workOrderPhotos, InsertWorkOrderPhoto,
  bids, InsertBid,
  bidPhotos, InsertBidPhoto,
  activityLog, InsertActivityLog,
  vehicleMedia, InsertVehicleMedia,
  flipProjectMedia, InsertFlipProjectMedia,
  mileageLogs, InsertMileageLog,
  serviceRecords, InsertServiceRecord,
  generalAssets, InsertGeneralAsset,
  realEstateLeads, InsertRealEstateLead,
  phoneCalls,
  customerInquiries,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      // Only set admin as default for new users; don't override existing role
      values.role = 'admin';
      // Don't include role in updateSet so existing role (e.g. 'owner') is preserved
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ CLIENT QUERIES ============

export async function getAllClients() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clients).orderBy(asc(clients.name));
}

export async function getClientById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result[0];
}

export async function createClient(data: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clients).values(data);
  return { id: result[0].insertId };
}

export async function updateClient(id: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clients).set(data).where(eq(clients.id, id));
}

export async function deleteClient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(clients).where(eq(clients.id, id));
}

// ============ VEHICLE QUERIES ============

export async function getAllVehicles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vehicles).orderBy(desc(vehicles.createdAt));
}

export async function getVehiclesByClient(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vehicles).where(eq(vehicles.clientId, clientId)).orderBy(asc(vehicles.make));
}

export async function getVehicleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
  return result[0];
}

export async function getVehicleByVin(vin: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(vehicles).where(eq(vehicles.vin, vin)).limit(1);
  return result[0];
}

export async function createVehicle(data: InsertVehicle) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(vehicles).values(data);
  return { id: result[0].insertId };
}

export async function updateVehicle(id: number, data: Partial<InsertVehicle>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(vehicles).set(data).where(eq(vehicles.id, id));
}

export async function deleteVehicle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(vehicles).where(eq(vehicles.id, id));
}

// ============ SERVICE CATEGORY QUERIES ============

export async function getAllServiceCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(serviceCategories).where(eq(serviceCategories.isActive, true)).orderBy(asc(serviceCategories.name));
}

export async function createServiceCategory(data: InsertServiceCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(serviceCategories).values(data);
  return { id: result[0].insertId };
}

// ============ WORK ORDER QUERIES ============

export async function getAllWorkOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(workOrders).orderBy(desc(workOrders.createdAt));
}

export async function getWorkOrdersByVehicle(vehicleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(workOrders).where(eq(workOrders.vehicleId, vehicleId)).orderBy(desc(workOrders.createdAt));
}

export async function getWorkOrdersByTechnician(technicianId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(workOrders).where(eq(workOrders.technicianId, technicianId)).orderBy(desc(workOrders.createdAt));
}

export async function getWorkOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(workOrders).where(eq(workOrders.id, id)).limit(1);
  return result[0];
}

export async function createWorkOrder(data: InsertWorkOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(workOrders).values(data);
  return { id: result[0].insertId };
}

export async function updateWorkOrder(id: number, data: Partial<InsertWorkOrder>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(workOrders).set(data).where(eq(workOrders.id, id));
}

// ============ WORK ORDER ITEMS QUERIES ============

export async function getWorkOrderItems(workOrderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(workOrderItems).where(eq(workOrderItems.workOrderId, workOrderId));
}

export async function createWorkOrderItem(data: InsertWorkOrderItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(workOrderItems).values(data);
  return { id: result[0].insertId };
}

export async function deleteWorkOrderItems(workOrderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(workOrderItems).where(eq(workOrderItems.workOrderId, workOrderId));
}

// ============ INVOICE QUERIES ============

export async function getAllInvoices() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invoices).orderBy(desc(invoices.createdAt));
}

export async function getInvoiceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  return result[0];
}

export async function getInvoiceByWorkOrder(workOrderId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invoices).where(eq(invoices.workOrderId, workOrderId)).limit(1);
  return result[0];
}

export async function createInvoice(data: InsertInvoice) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(invoices).values(data);
  return { id: result[0].insertId };
}

export async function updateInvoice(id: number, data: Partial<InsertInvoice>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(invoices).set(data).where(eq(invoices.id, id));
}

// ============ MAINTENANCE SCHEDULE QUERIES ============

export async function getMaintenanceSchedulesByVehicle(vehicleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(maintenanceSchedules)
    .where(and(eq(maintenanceSchedules.vehicleId, vehicleId), eq(maintenanceSchedules.isActive, true)));
}

export async function getOverdueMaintenanceForVehicle(vehicleId: number, currentMileage: number) {
  const db = await getDb();
  if (!db) return [];
  const today = new Date().toISOString().split('T')[0];
  return db.select().from(maintenanceSchedules)
    .where(and(
      eq(maintenanceSchedules.vehicleId, vehicleId),
      eq(maintenanceSchedules.isActive, true),
      or(
        lte(maintenanceSchedules.nextDueMileage, currentMileage),
        sql`${maintenanceSchedules.nextDueDate} <= ${today}`,
      )
    ));
}

export async function createMaintenanceSchedule(data: InsertMaintenanceSchedule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(maintenanceSchedules).values(data);
  return { id: result[0].insertId };
}

export async function updateMaintenanceSchedule(id: number, data: Partial<InsertMaintenanceSchedule>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(maintenanceSchedules).set(data).where(eq(maintenanceSchedules.id, id));
}

export async function deleteMaintenanceSchedule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(maintenanceSchedules).where(eq(maintenanceSchedules.id, id));
}

// ============ USER QUERIES ============

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(asc(users.name));
}

export async function updateUserRole(id: number, role: "owner" | "admin" | "technician" | "customer" | "user") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.id, id));
}

export async function toggleUserActive(id: number, isActive: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ isActive: isActive ? 1 : 0 }).where(eq(users.id, id));
}

// ============ PARTS QUERIES ============

export async function getPartsByWorkOrder(workOrderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(parts).where(eq(parts.workOrderId, workOrderId));
}

export async function createPart(data: InsertPart) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(parts).values(data);
  return { id: result[0].insertId };
}

export async function deletePart(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(parts).where(eq(parts.id, id));
}

// ============ TIME ENTRY QUERIES ============

export async function getTimeEntriesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(timeEntries).where(eq(timeEntries.userId, userId)).orderBy(desc(timeEntries.date));
}

export async function getTimeEntriesByWorkOrder(workOrderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(timeEntries).where(eq(timeEntries.workOrderId, workOrderId));
}

export async function createTimeEntry(data: InsertTimeEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(timeEntries).values(data);
  return { id: result[0].insertId };
}

// ============ PAY RECORD QUERIES ============

export async function getPayRecordsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payRecords).where(eq(payRecords.userId, userId)).orderBy(desc(payRecords.payDate));
}

export async function getAllPayRecords() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payRecords).orderBy(desc(payRecords.payDate));
}

export async function createPayRecord(data: InsertPayRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(payRecords).values(data);
  return { id: result[0].insertId };
}

// ============ STATS QUERIES ============

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { totalClients: 0, totalVehicles: 0, pendingWorkOrders: 0, completedWorkOrders: 0 };

  const [clientCount] = await db.select({ count: sql<number>`count(*)` }).from(clients);
  const [vehicleCount] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(eq(vehicles.isActive, true));
  const [pendingWO] = await db.select({ count: sql<number>`count(*)` }).from(workOrders).where(eq(workOrders.status, "pending_approval"));
  const [completedWO] = await db.select({ count: sql<number>`count(*)` }).from(workOrders).where(eq(workOrders.status, "completed"));

  return {
    totalClients: clientCount?.count ?? 0,
    totalVehicles: vehicleCount?.count ?? 0,
    pendingWorkOrders: pendingWO?.count ?? 0,
    completedWorkOrders: completedWO?.count ?? 0,
  };
}

export async function getProfitabilityStats() {
  const db = await getDb();
  if (!db) return { totalRevenue: 0, totalPartsCost: 0, totalPartsCharge: 0, totalLaborCost: 0, partsProfit: 0 };

  // Total invoiced revenue
  const [revenue] = await db.select({ total: sql<string>`COALESCE(SUM(total), 0)` }).from(invoices);
  // Parts cost vs charge
  const [partsCost] = await db.select({ total: sql<string>`COALESCE(SUM(totalCost), 0)` }).from(parts);
  const [partsCharge] = await db.select({ total: sql<string>`COALESCE(SUM(totalCharge), 0)` }).from(parts);
  // Labor cost (employee pay)
  const [laborCost] = await db.select({ total: sql<string>`COALESCE(SUM(totalPay), 0)` }).from(timeEntries);

  const totalRevenue = parseFloat(revenue?.total ?? "0");
  const totalPartsCost = parseFloat(partsCost?.total ?? "0");
  const totalPartsCharge = parseFloat(partsCharge?.total ?? "0");
  const totalLaborCost = parseFloat(laborCost?.total ?? "0");

  return {
    totalRevenue,
    totalPartsCost,
    totalPartsCharge,
    totalLaborCost,
    partsProfit: totalPartsCharge - totalPartsCost,
    netProfit: totalRevenue - totalPartsCost - totalLaborCost,
  };
}

// ============ INVENTORY QUERIES ============

export async function getAllInventory() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inventory).orderBy(asc(inventory.itemName));
}

export async function getInventoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(inventory).where(eq(inventory.id, id)).limit(1);
  return result[0];
}

export async function createInventoryItem(data: InsertInventoryItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(inventory).values(data);
  return { id: result[0].insertId };
}

export async function updateInventoryItem(id: number, data: Partial<InsertInventoryItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(inventory).set(data).where(eq(inventory.id, id));
}

export async function deleteInventoryItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(inventory).where(eq(inventory.id, id));
}

export async function useInventoryItem(data: InsertInventoryUsage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Deduct from stock
  const item = await getInventoryById(data.inventoryId);
  if (item) {
    const newQty = Math.max(0, (item.quantityOnHand || 0) - data.quantityUsed);
    await db.update(inventory).set({ quantityOnHand: newQty }).where(eq(inventory.id, data.inventoryId));
  }
  const result = await db.insert(inventoryUsage).values(data);
  return { id: result[0].insertId };
}

export async function getInventoryUsageByWorkOrder(workOrderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inventoryUsage).where(eq(inventoryUsage.workOrderId, workOrderId));
}

// ============ DRIVING LOG QUERIES ============

export async function getDrivingLogByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(drivingLog).where(eq(drivingLog.userId, userId)).orderBy(desc(drivingLog.date));
}

export async function getAllDrivingLogs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(drivingLog).orderBy(desc(drivingLog.date));
}

export async function createDrivingLog(data: InsertDrivingLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(drivingLog).values(data);
  return { id: result[0].insertId };
}

// ============ BUSINESS EXPENSE QUERIES ============

export async function getAllBusinessExpenses() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(businessExpenses).orderBy(desc(businessExpenses.date));
}

export async function createBusinessExpense(data: InsertBusinessExpense) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(businessExpenses).values(data);
  return { id: result[0].insertId };
}

export async function deleteBusinessExpense(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(businessExpenses).where(eq(businessExpenses.id, id));
}

// ============ CALENDAR QUERIES ============

export async function getCalendarEventsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(calendarEvents).where(eq(calendarEvents.userId, userId)).orderBy(asc(calendarEvents.date));
}

export async function getCalendarEventsByDate(dateStr: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(calendarEvents).where(sql`${calendarEvents.date} = ${dateStr}`);
}

export async function getAllCalendarEvents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(calendarEvents).orderBy(asc(calendarEvents.date));
}

export async function createCalendarEvent(data: InsertCalendarEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(calendarEvents).values(data);
  return { id: result[0].insertId };
}

export async function updateCalendarEvent(id: number, data: Partial<InsertCalendarEvent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(calendarEvents).set(data).where(eq(calendarEvents.id, id));
}

export async function deleteCalendarEvent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
}

// ============ FLIP PROJECT QUERIES (Customized Enterprise) ============

export async function getAllFlipProjects() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(flipProjects).orderBy(desc(flipProjects.createdAt));
}

export async function createFlipProject(data: InsertFlipProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(flipProjects).values(data);
  return { id: result[0].insertId };
}

export async function updateFlipProject(id: number, data: Partial<InsertFlipProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(flipProjects).set(data).where(eq(flipProjects.id, id));
}

export async function deleteFlipProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(flipProjects).where(eq(flipProjects.id, id));
}

// ============ WORK ORDER PHOTOS ============

export async function getPhotosByWorkOrder(workOrderId: number) {
  const database = await getDb();
  if (!database) return [];
  return database.select().from(workOrderPhotos).where(eq(workOrderPhotos.workOrderId, workOrderId));
}

export async function createWorkOrderPhoto(data: InsertWorkOrderPhoto) {
  const database = await getDb();
  if (!database) return null;
  const result = await database.insert(workOrderPhotos).values(data);
  return { id: result[0].insertId };
}

export async function deleteWorkOrderPhoto(id: number) {
  const database = await getDb();
  if (!database) return;
  await database.delete(workOrderPhotos).where(eq(workOrderPhotos.id, id));
}

// ============ SEED DEFAULT CLIENTS ============

export async function seedDefaultClients() {
  const database = await getDb();
  if (!database) return [];
  
  const defaultClients = [
    { name: "Buhler", clientType: "regular" as const, color: "#2563eb" },
    { name: "Fisher Tile", clientType: "regular" as const, color: "#16a34a" },
    { name: "Coffee Company (TBD)", clientType: "regular" as const, color: "#9333ea" },
  ];
  
  const created = [];
  for (const client of defaultClients) {
    // Check if client already exists
    const existing = await database.select().from(clients).where(eq(clients.name, client.name)).limit(1);
    if (existing.length === 0) {
      const result = await database.insert(clients).values(client as any);
      created.push({ id: result[0].insertId, name: client.name });
    }
  }
  return created;
}

export async function getTimeBillingAnalysis() {
  const database = await getDb();
  if (!database) return { jobs: [], summary: { totalActual: 0, totalBilled: 0, netDifference: 0, redoCount: 0, redoLoss: 0 } };
  
  const allOrders = await database.select().from(workOrders).where(
    sql`${workOrders.actualHours} IS NOT NULL AND ${workOrders.billedHours} IS NOT NULL`
  );
  
  // Get client names for each order
  const allClients = await database.select().from(clients);
  const clientMap = new Map(allClients.map(c => [c.id, c.name]));
  
  // Get vehicle info for each order
  const allVehicles = await database.select().from(vehicles);
  const vehicleMap = new Map(allVehicles.map(v => [v.id, `${v.year || ''} ${v.make || ''} ${v.model || ''} (${v.vin})`]));
  
  let totalActual = 0;
  let totalBilled = 0;
  let redoCount = 0;
  let redoLoss = 0;
  
  const jobs = allOrders.map(wo => {
    const actual = parseFloat(wo.actualHours as string || "0");
    const billed = parseFloat(wo.billedHours as string || "0");
    const rate = parseFloat(wo.hourlyRate as string || "75");
    const difference = billed - actual;
    const profitLoss = difference * rate;
    
    totalActual += actual;
    totalBilled += billed;
    
    if (wo.isRedo) {
      redoCount++;
      redoLoss += actual * rate; // Full loss on redo jobs
    }
    
    return {
      id: wo.id,
      clientName: clientMap.get(wo.clientId) || "Unknown",
      vehicleInfo: wo.vehicleId ? vehicleMap.get(wo.vehicleId) || "N/A" : "Non-vehicle",
      workDescription: wo.workDescription || wo.notes || "No description",
      actualHours: actual,
      billedHours: billed,
      hourlyRate: rate,
      difference,
      profitLoss,
      isRedo: wo.isRedo,
      redoReason: wo.redoReason,
      completedAt: wo.completedAt,
      status: wo.status,
    };
  });
  
  return {
    jobs,
    summary: {
      totalActual,
      totalBilled,
      netDifference: totalBilled - totalActual,
      redoCount,
      redoLoss,
    },
  };
}

// ============ BIDS / PROSPECTS ============

export async function getAllBids() {
  const database = await getDb();
  if (!database) return [];
  return database.select().from(bids).orderBy(desc(bids.createdAt));
}

export async function createBid(data: Omit<InsertBid, "id" | "createdAt" | "updatedAt">) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const result = await database.insert(bids).values(data as any);
  return { id: result[0].insertId };
}

export async function updateBid(id: number, data: Partial<InsertBid>) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  await database.update(bids).set(data as any).where(eq(bids.id, id));
  return { success: true };
}

export async function deleteBid(id: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  await database.delete(bids).where(eq(bids.id, id));
  return { success: true };
}

// ============ CLIENT PROFITABILITY ============

export async function getClientProfitability() {
  const database = await getDb();
  if (!database) return [];
  
  const allClients = await database.select().from(clients);
  const allVehicles = await database.select().from(vehicles);
  const allWorkOrders = await database.select().from(workOrders);
  const allInvoices = await database.select().from(invoices);
  
  return allClients.map(client => {
    const clientVehicles = allVehicles.filter(v => v.clientId === client.id);
    const clientWorkOrders = allWorkOrders.filter(wo => wo.clientId === client.id);
    const completedJobs = clientWorkOrders.filter(wo => wo.status === "completed");
    const pendingJobs = clientWorkOrders.filter(wo => wo.status !== "completed" && wo.status !== "denied");
    const upcomingJobDetails = pendingJobs.slice(0, 5).map(wo => ({
      id: wo.id,
      description: wo.notes || wo.workDescription || "",
      priority: wo.priority,
      status: wo.status,
      createdAt: wo.createdAt,
    }));
    const clientInvoices = allInvoices.filter(inv => inv.clientId === client.id);
    const totalRevenue = clientInvoices.reduce((sum, inv) => sum + parseFloat(inv.total as string || "0"), 0);
    const totalBilledHours = clientWorkOrders.reduce((sum, wo) => sum + parseFloat(wo.billedHours as string || "0"), 0);
    const totalActualHours = clientWorkOrders.reduce((sum, wo) => sum + parseFloat(wo.actualHours as string || "0"), 0);
    
    return {
      id: client.id,
      name: client.name,
      clientType: client.clientType,
      color: client.color,
      contactName: client.contactName,
      contactPhone: client.contactPhone,
      vehicleCount: clientVehicles.length,
      totalJobs: clientWorkOrders.length,
      completedJobs: completedJobs.length,
      pendingJobs: pendingJobs.length,
      upcomingJobDetails,
      totalRevenue,
      totalBilledHours,
      totalActualHours,
      hourDifference: totalBilledHours - totalActualHours,
      profitPerHour: totalActualHours > 0 ? totalRevenue / totalActualHours : 0,
    };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue);
}

// ============ BID PHOTOS ============

export async function getPhotosByBid(bidId: number) {
  const database = await getDb();
  if (!database) return [];
  return database.select().from(bidPhotos).where(eq(bidPhotos.bidId, bidId));
}

export async function createBidPhoto(data: InsertBidPhoto) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const result = await database.insert(bidPhotos).values(data);
  return { id: result[0].insertId };
}

export async function deleteBidPhoto(id: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  await database.delete(bidPhotos).where(eq(bidPhotos.id, id));
}

// Activity Log
export async function logActivity(data: InsertActivityLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(activityLog).values(data);
}

export async function getRecentActivity(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(limit);
}

export async function getUserActivity(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activityLog).where(eq(activityLog.userId, userId)).orderBy(desc(activityLog.createdAt)).limit(limit);
}

// User Presence - update lastSeen
export async function updateUserLastSeen(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSeen: new Date() }).where(eq(users.id, userId));
}

export async function getOnlineUsers(minutesThreshold = 5) {
  const db = await getDb();
  if (!db) return [];
  const threshold = new Date(Date.now() - minutesThreshold * 60 * 1000);
  return db.select().from(users).where(and(
    eq(users.isActive, 1),
    sql`${users.lastSeen} >= ${threshold}`
  ));
}

// ============ VEHICLE MEDIA ============

export async function getMediaByVehicle(vehicleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vehicleMedia).where(eq(vehicleMedia.vehicleId, vehicleId)).orderBy(desc(vehicleMedia.createdAt));
}

export async function createVehicleMedia(data: InsertVehicleMedia) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(vehicleMedia).values(data);
  return { id: result[0].insertId };
}

export async function deleteVehicleMedia(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(vehicleMedia).where(eq(vehicleMedia.id, id));
}

// ============ FLIP PROJECT MEDIA ============

export async function getMediaByFlipProject(flipProjectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(flipProjectMedia).where(eq(flipProjectMedia.flipProjectId, flipProjectId)).orderBy(desc(flipProjectMedia.createdAt));
}

export async function createFlipProjectMedia(data: InsertFlipProjectMedia) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(flipProjectMedia).values(data);
  return { id: result[0].insertId };
}

export async function deleteFlipProjectMedia(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(flipProjectMedia).where(eq(flipProjectMedia.id, id));
}

// ===== Mileage Logs =====
export async function getMileageLogs(vehicleId: number) {
  const db = (await getDb())!;
  return db.select().from(mileageLogs).where(eq(mileageLogs.vehicleId, vehicleId)).orderBy(desc(mileageLogs.recordedAt));
}

export async function addMileageLog(data: InsertMileageLog) {
  const db = (await getDb())!;
  const result = await db.insert(mileageLogs).values(data);
  await db.update(vehicles).set({ currentMileage: data.mileage }).where(eq(vehicles.id, data.vehicleId));
  return result;
}

// ===== Service Records =====
export async function getServiceRecords(vehicleId: number) {
  const db = (await getDb())!;
  return db.select().from(serviceRecords).where(eq(serviceRecords.vehicleId, vehicleId)).orderBy(desc(serviceRecords.servicedAt));
}

export async function addServiceRecord(data: InsertServiceRecord) {
  const db = (await getDb())!;
  return db.insert(serviceRecords).values(data);
}

export async function deleteServiceRecord(id: number) {
  const db = (await getDb())!;
  return db.delete(serviceRecords).where(eq(serviceRecords.id, id));
}

// ===== General Assets =====
export async function getGeneralAssets() {
  const db = (await getDb())!;
  return db.select().from(generalAssets).where(eq(generalAssets.isActive, true)).orderBy(desc(generalAssets.createdAt));
}

export async function getGeneralAssetById(id: number) {
  const db = (await getDb())!;
  const rows = await db.select().from(generalAssets).where(eq(generalAssets.id, id));
  return rows[0] || null;
}

export async function createGeneralAsset(data: InsertGeneralAsset) {
  const db = (await getDb())!;
  return db.insert(generalAssets).values(data);
}

export async function updateGeneralAsset(id: number, data: Partial<InsertGeneralAsset>) {
  const db = (await getDb())!;
  return db.update(generalAssets).set(data).where(eq(generalAssets.id, id));
}

export async function deleteGeneralAsset(id: number) {
  const db = (await getDb())!;
  return db.update(generalAssets).set({ isActive: false }).where(eq(generalAssets.id, id));
}

// ===== Real Estate Leads =====
export async function getRealEstateLeads() {
  const db = (await getDb())!;
  return db.select().from(realEstateLeads).orderBy(desc(realEstateLeads.createdAt));
}

export async function createRealEstateLead(data: InsertRealEstateLead) {
  const db = (await getDb())!;
  return db.insert(realEstateLeads).values(data);
}

export async function updateRealEstateLead(id: number, data: Partial<InsertRealEstateLead>) {
  const db = (await getDb())!;
  return db.update(realEstateLeads).set(data).where(eq(realEstateLeads.id, id));
}

export async function deleteRealEstateLead(id: number) {
  const db = (await getDb())!;
  return db.delete(realEstateLeads).where(eq(realEstateLeads.id, id));
}

// ============ PHONE CALLS ============
export async function getPhoneCalls(filters?: { isCompleted?: boolean; clientId?: number; search?: string; outcome?: string; businessLine?: string }) {
  const db = await getDb();
  const conditions: any[] = [];
  if (filters?.isCompleted !== undefined) {
    conditions.push(eq(phoneCalls.isCompleted, filters.isCompleted));
  }
  if (filters?.clientId) {
    conditions.push(eq(phoneCalls.clientId, filters.clientId));
  }
  if (filters?.outcome) {
    conditions.push(eq(phoneCalls.outcome, filters.outcome as any));
  }
  if (filters?.businessLine) {
    conditions.push(eq(phoneCalls.businessLine, filters.businessLine));
  }
  if (filters?.search) {
    const searchPattern = `%${filters.search}%`;
    conditions.push(
      or(
        like(phoneCalls.contactName, searchPattern),
        like(phoneCalls.phoneNumber, searchPattern),
        like(phoneCalls.notes, searchPattern)
      )
    );
  }
  let query = db!.select().from(phoneCalls).orderBy(desc(phoneCalls.createdAt));
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  return query;
}

export async function getPendingFollowUps() {
  const db = await getDb();
  return db!.select().from(phoneCalls)
    .where(and(eq(phoneCalls.isCompleted, false)))
    .orderBy(phoneCalls.followUpDate);
}

export async function createPhoneCall(data: {
  clientId?: number;
  contactName: string;
  phoneNumber?: string;
  direction?: "outbound" | "inbound";
  outcome?: "reached" | "voicemail" | "no_answer" | "callback_requested" | "not_called";
  notes?: string;
  followUpDate?: Date;
  createdBy?: number;
}) {
  const db = await getDb();
  const [result] = await db!.insert(phoneCalls).values(data as any);
  return result;
}

export async function updatePhoneCall(id: number, data: {
  outcome?: string;
  notes?: string;
  followUpDate?: Date | null;
  isCompleted?: boolean;
  businessLine?: string;
  assignedTo?: number | null;
}) {
  const db = await getDb();
  await db!.update(phoneCalls).set(data as any).where(eq(phoneCalls.id, id));
}

export async function deletePhoneCall(id: number) {
  const db = await getDb();
  await db!.delete(phoneCalls).where(eq(phoneCalls.id, id));
}

// ============ CUSTOMER INQUIRIES ============

export async function getAllInquiries() {
  const database = await getDb();
  if (!database) return [];
  return database.select().from(customerInquiries).orderBy(desc(customerInquiries.createdAt));
}

export async function getInquiryById(id: number) {
  const database = await getDb();
  if (!database) return null;
  const [inquiry] = await database.select().from(customerInquiries).where(eq(customerInquiries.id, id));
  return inquiry || null;
}

export async function createInquiry(data: any) {
  const database = await getDb();
  if (!database) return null;
  const [result] = await database.insert(customerInquiries).values(data).$returningId();
  return result;
}

export async function updateInquiry(id: number, data: any) {
  const database = await getDb();
  if (!database) return;
  await database.update(customerInquiries).set(data).where(eq(customerInquiries.id, id));
}

export async function deleteInquiry(id: number) {
  const database = await getDb();
  if (!database) return;
  await database.delete(customerInquiries).where(eq(customerInquiries.id, id));
}

// ============ HOUR BANK QUERIES ============

export async function getHourBankBalance(userId: number) {
  const database = await getDb();
  if (!database) return { banked: 0, borrowed: 0, balance: 0 };
  const { hourBankTransactions } = await import("../drizzle/schema");
  const transactions = await database.select().from(hourBankTransactions).where(eq(hourBankTransactions.userId, userId));
  let banked = 0;
  let borrowed = 0;
  for (const t of transactions) {
    const hrs = parseFloat(t.hours as string) || 0;
    if (t.type === "banked") banked += hrs;
    else if (t.type === "borrowed") borrowed += Math.abs(hrs);
    else { // adjustment
      if (hrs > 0) banked += hrs;
      else borrowed += Math.abs(hrs);
    }
  }
  return { banked, borrowed, balance: banked - borrowed };
}

export async function getAllHourBankBalances() {
  const database = await getDb();
  if (!database) return [];
  const { hourBankTransactions } = await import("../drizzle/schema");
  const transactions = await database.select().from(hourBankTransactions).orderBy(desc(hourBankTransactions.createdAt));
  return transactions;
}

export async function getHourBankTransactions(userId?: number) {
  const database = await getDb();
  if (!database) return [];
  const { hourBankTransactions } = await import("../drizzle/schema");
  if (userId) {
    return database.select().from(hourBankTransactions).where(eq(hourBankTransactions.userId, userId)).orderBy(desc(hourBankTransactions.createdAt));
  }
  return database.select().from(hourBankTransactions).orderBy(desc(hourBankTransactions.createdAt));
}

export async function createHourBankTransaction(data: {
  userId: number;
  workOrderId?: number;
  type: "banked" | "borrowed" | "adjustment";
  hours: string;
  billedHours?: string;
  actualHours?: string;
  reason?: string;
}) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const { hourBankTransactions } = await import("../drizzle/schema");
  await database.insert(hourBankTransactions).values(data as any);
}

// ============ USER INVITE QUERIES ============

export async function createUserInvite(data: { name: string; role: string; email?: string; createdBy: number; inviteCode: string }) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const { userInvites } = await import("../drizzle/schema");
  await database.insert(userInvites).values(data as any);
}

export async function getInvites() {
  const database = await getDb();
  if (!database) return [];
  const { userInvites } = await import("../drizzle/schema");
  return database.select().from(userInvites).orderBy(desc(userInvites.createdAt));
}

export async function claimInvite(inviteCode: string, userId: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const { userInvites } = await import("../drizzle/schema");
  const [invite] = await database.select().from(userInvites).where(eq(userInvites.inviteCode, inviteCode));
  if (!invite || invite.status !== "pending") throw new Error("Invalid or expired invite");
  await database.update(userInvites).set({ claimedBy: userId, status: "claimed", claimedAt: new Date() }).where(eq(userInvites.id, invite.id));
  // Update user role to match invite
  await database.update(users).set({ role: invite.role, name: invite.name }).where(eq(users.id, userId));
  return invite;
}

export async function deleteInvite(id: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const { userInvites } = await import("../drizzle/schema");
  await database.delete(userInvites).where(eq(userInvites.id, id));
}


// ============ USER TODOS ============

export async function getUserTodos(userId: number) {
  const database = await getDb();
  if (!database) return [];
  const { userTodos } = await import("../drizzle/schema");
  return database.select().from(userTodos).where(eq(userTodos.userId, userId)).orderBy(desc(userTodos.createdAt));
}

export async function createUserTodo(data: { userId: number; title: string; priority?: string; dueDate?: string }) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const { userTodos } = await import("../drizzle/schema");
  const [result] = await database.insert(userTodos).values({
    userId: data.userId,
    title: data.title,
    priority: (data.priority as any) || "medium",
    dueDate: data.dueDate || null,
  }).$returningId();
  return result;
}

export async function updateUserTodo(id: number, data: { title?: string; completed?: boolean; priority?: string; dueDate?: string | null }) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const { userTodos } = await import("../drizzle/schema");
  const updateData: any = { updatedAt: new Date() };
  if (data.title !== undefined) updateData.title = data.title;
  if (data.completed !== undefined) updateData.completed = data.completed;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
  await database.update(userTodos).set(updateData).where(eq(userTodos.id, id));
}

export async function deleteUserTodo(id: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const { userTodos } = await import("../drizzle/schema");
  await database.delete(userTodos).where(eq(userTodos.id, id));
}

// ============ USER EMAILS ============

export async function getUserEmails(userId: number) {
  const database = await getDb();
  if (!database) return [];
  const { userEmails } = await import("../drizzle/schema");
  return database.select().from(userEmails).where(eq(userEmails.userId, userId)).orderBy(desc(userEmails.createdAt));
}

export async function createUserEmail(data: { userId: number; subject: string; body?: string; fromAddress?: string; toAddress?: string; direction?: string; status?: string }) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const { userEmails } = await import("../drizzle/schema");
  const [result] = await database.insert(userEmails).values({
    userId: data.userId,
    subject: data.subject,
    body: data.body || null,
    fromAddress: data.fromAddress || null,
    toAddress: data.toAddress || null,
    direction: (data.direction as any) || "outbound",
    status: (data.status as any) || "draft",
  }).$returningId();
  return result;
}

// ============ TIME CLOCK ============

export async function getTimeClockEntries(userId: number, startDate?: string, endDate?: string) {
  const database = await getDb();
  if (!database) return [];
  const { timeClock } = await import("../drizzle/schema");
  let query = database.select().from(timeClock).where(eq(timeClock.userId, userId));
  return query.orderBy(desc(timeClock.clockIn));
}

export async function getActiveClockIn(userId: number) {
  const database = await getDb();
  if (!database) return null;
  const { timeClock } = await import("../drizzle/schema");
  const [active] = await database.select().from(timeClock)
    .where(and(eq(timeClock.userId, userId), isNull(timeClock.clockOut)))
    .orderBy(desc(timeClock.clockIn))
    .limit(1);
  return active || null;
}

export async function clockIn(userId: number, notes?: string) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const { timeClock } = await import("../drizzle/schema");
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const [result] = await database.insert(timeClock).values({
    userId,
    clockIn: now,
    date: dateStr,
    notes: notes || null,
  }).$returningId();
  return result;
}

export async function clockOut(id: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const { timeClock } = await import("../drizzle/schema");
  const now = new Date();
  const [entry] = await database.select().from(timeClock).where(eq(timeClock.id, id));
  if (!entry) throw new Error("Clock entry not found");
  const hours = (now.getTime() - new Date(entry.clockIn).getTime()) / (1000 * 60 * 60);
  await database.update(timeClock).set({
    clockOut: now,
    totalHours: hours.toFixed(2),
  }).where(eq(timeClock.id, id));
}

export async function getAllTimeClockEntries(startDate?: string, endDate?: string) {
  const database = await getDb();
  if (!database) return [];
  const { timeClock } = await import("../drizzle/schema");
  return database.select().from(timeClock).orderBy(desc(timeClock.clockIn));
}

// ============ TECH MILEAGE ============

export async function getTechMileage(userId: number) {
  const database = await getDb();
  if (!database) return [];
  const { techMileageLog } = await import("../drizzle/schema");
  return database.select().from(techMileageLog).where(eq(techMileageLog.userId, userId)).orderBy(desc(techMileageLog.createdAt));
}

export async function createTechMileage(data: { userId: number; workOrderId?: number; startMileage: string; endMileage: string; fromLocation?: string; toLocation?: string; date: string }) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const { techMileageLog } = await import("../drizzle/schema");
  const totalMiles = (parseFloat(data.endMileage) - parseFloat(data.startMileage)).toFixed(1);
  const [result] = await database.insert(techMileageLog).values({
    userId: data.userId,
    workOrderId: data.workOrderId || null,
    startMileage: data.startMileage,
    endMileage: data.endMileage,
    totalMiles,
    fromLocation: data.fromLocation || null,
    toLocation: data.toLocation || null,
    date: data.date,
  }).$returningId();
  return result;
}

// ============ PARTS MARKUP ============

export async function getPartsMarkup(workOrderId?: number) {
  const database = await getDb();
  if (!database) return [];
  const { partsMarkup } = await import("../drizzle/schema");
  if (workOrderId) {
    return database.select().from(partsMarkup).where(eq(partsMarkup.workOrderId, workOrderId)).orderBy(desc(partsMarkup.createdAt));
  }
  return database.select().from(partsMarkup).orderBy(desc(partsMarkup.createdAt));
}

export async function createPartsMarkup(data: { workOrderId: number; partName: string; partNumber?: string; costPrice: string; markupPercent: number; supplier?: string }) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const { partsMarkup } = await import("../drizzle/schema");
  const billedPrice = (parseFloat(data.costPrice) * (1 + data.markupPercent / 100)).toFixed(2);
  const [result] = await database.insert(partsMarkup).values({
    workOrderId: data.workOrderId,
    partName: data.partName,
    partNumber: data.partNumber || null,
    costPrice: data.costPrice,
    markupPercent: data.markupPercent,
    billedPrice,
    supplier: data.supplier || null,
    orderedAt: new Date(),
  }).$returningId();
  return result;
}

export async function updatePartsMarkupStatus(id: number, status: string) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const { partsMarkup } = await import("../drizzle/schema");
  const updateData: any = { status };
  if (status === "received") updateData.receivedAt = new Date();
  await database.update(partsMarkup).set(updateData).where(eq(partsMarkup.id, id));
}

// ============ PAY RATES & PERIODS ============

export async function getUserPayRate(userId: number) {
  const database = await getDb();
  if (!database) return null;
  const { userPayRates } = await import("../drizzle/schema");
  const [rate] = await database.select().from(userPayRates)
    .where(and(eq(userPayRates.userId, userId), isNull(userPayRates.endDate)))
    .orderBy(desc(userPayRates.effectiveDate))
    .limit(1);
  return rate || null;
}

export async function setUserPayRate(data: { userId: number; rateType: string; rate: string; overtimeRate?: string; effectiveDate: string }) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const { userPayRates } = await import("../drizzle/schema");
  // End current rate
  const current = await getUserPayRate(data.userId);
  if (current) {
    await database.update(userPayRates).set({ endDate: data.effectiveDate }).where(eq(userPayRates.id, current.id));
  }
  const [result] = await database.insert(userPayRates).values({
    userId: data.userId,
    rateType: data.rateType as any,
    rate: data.rate,
    overtimeRate: data.overtimeRate || null,
    effectiveDate: data.effectiveDate,
  }).$returningId();
  return result;
}

export async function getPayPeriods(userId?: number) {
  const database = await getDb();
  if (!database) return [];
  const { payPeriods } = await import("../drizzle/schema");
  if (userId) {
    return database.select().from(payPeriods).where(eq(payPeriods.userId, userId)).orderBy(desc(payPeriods.periodStart));
  }
  return database.select().from(payPeriods).orderBy(desc(payPeriods.periodStart));
}

export async function createPayPeriod(data: { userId: number; periodStart: string; periodEnd: string; regularHours: string; overtimeHours?: string; grossPay: string; deductions?: string; netPay: string }) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const { payPeriods } = await import("../drizzle/schema");
  const [result] = await database.insert(payPeriods).values({
    userId: data.userId,
    periodStart: data.periodStart,
    periodEnd: data.periodEnd,
    regularHours: data.regularHours,
    overtimeHours: data.overtimeHours || "0",
    grossPay: data.grossPay,
    deductions: data.deductions || "0",
    netPay: data.netPay,
  }).$returningId();
  return result;
}

// ============ PERFORMANCE TIER ============

export async function updateUserTier(userId: number, tier: string) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  await database.update(users).set({ performanceTier: tier as any }).where(eq(users.id, userId));
}

export async function updateExperienceLevel(userId: number, level: string) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  await database.update(users).set({ experienceLevel: level as any }).where(eq(users.id, userId));
}

export async function updateExperiencePoints(userId: number, points: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  await database.update(users).set({ experiencePoints: points }).where(eq(users.id, userId));
}

export async function getTechPerformanceStats() {
  const database = await getDb();
  if (!database) return [];
  // Get all technicians with their work order revenue
  const techs = await database.select().from(users).where(eq(users.role, "technician"));
  const { workOrders, invoices } = await import("../drizzle/schema");
  const stats = [];
  for (const tech of techs) {
    const orders = await database.select().from(workOrders).where(eq(workOrders.technicianId, tech.id));
    let totalRevenue = 0;
    let completedJobs = 0;
    let totalHoursBilled = 0;
    let totalActualHours = 0;
    for (const order of orders) {
      if (order.status === "completed") {
        completedJobs++;
        totalRevenue += parseFloat(order.totalCharge?.toString() || "0");
        totalHoursBilled += parseFloat(order.billedHours?.toString() || "0");
        totalActualHours += parseFloat(order.actualHours?.toString() || "0");
      }
    }
    stats.push({
      ...tech,
      totalRevenue,
      completedJobs,
      totalHoursBilled,
      totalActualHours,
      efficiency: totalHoursBilled > 0 ? ((totalHoursBilled / Math.max(totalActualHours, 1)) * 100).toFixed(1) : "0",
    });
  }
  return stats;
}
