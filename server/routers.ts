import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, ownerProcedure, technicianProcedure, customerProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import { workOrderItems, workOrderEdits } from "../drizzle/schema";
import QRCode from "qrcode";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";

// ============ ROUTERS ============

const clientRouter = router({
  list: protectedProcedure.query(async () => {
    return db.getAllClients();
  }),
  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getClientById(input.id);
  }),
  create: adminProcedure.input(z.object({
    name: z.string().min(1),
    clientType: z.enum(["regular", "one_time", "emergency"]).optional(),
    color: z.string().optional(),
    contactName: z.string().optional(),
    contactEmail: z.string().email().optional().or(z.literal("")),
    contactPhone: z.string().optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    return db.createClient(input as any);
  }),
  update: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().min(1).optional(),
    contactName: z.string().optional(),
    contactEmail: z.string().email().optional().or(z.literal("")),
    contactPhone: z.string().optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateClient(id, data);
    return { success: true };
  }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteClient(input.id);
    return { success: true };
  }),
});

const vehicleRouter = router({
  list: protectedProcedure.query(async () => {
    return db.getAllVehicles();
  }),
  listByClient: protectedProcedure.input(z.object({ clientId: z.number() })).query(async ({ input }) => {
    return db.getVehiclesByClient(input.clientId);
  }),
  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getVehicleById(input.id);
  }),
  getByVin: protectedProcedure.input(z.object({ vin: z.string() })).query(async ({ input }) => {
    const vehicle = await db.getVehicleByVin(input.vin);
    return vehicle || null;
  }),
  create: adminProcedure.input(z.object({
    clientId: z.number(),
    vin: z.string().min(1).max(17),
    year: z.number().optional(),
    make: z.string().optional(),
    model: z.string().optional(),
    licensePlate: z.string().optional(),
    color: z.string().optional(),
    vehicleType: z.enum(["car", "van", "truck", "suv", "other"]).optional(),
    currentMileage: z.number().optional(),
    unitNumber: z.string().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    return db.createVehicle(input);
  }),
  update: adminProcedure.input(z.object({
    id: z.number(),
    clientId: z.number().optional(),
    vin: z.string().min(1).max(17).optional(),
    year: z.number().optional(),
    make: z.string().optional(),
    model: z.string().optional(),
    licensePlate: z.string().optional(),
    color: z.string().optional(),
    vehicleType: z.enum(["car", "van", "truck", "suv", "other"]).optional(),
    currentMileage: z.number().optional(),
    unitNumber: z.string().optional(),
    notes: z.string().optional(),
    isActive: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateVehicle(id, data);
    return { success: true };
  }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteVehicle(input.id);
    return { success: true };
  }),
  generateQrCode: protectedProcedure.input(z.object({ vehicleId: z.number() })).query(async ({ input, ctx }) => {
    const vehicle = await db.getVehicleById(input.vehicleId);
    if (!vehicle) throw new Error("Vehicle not found");
    // QR code points to the vehicle scan page
    const baseUrl = ctx.req.headers.origin || ctx.req.headers.referer?.replace(/\/$/, '') || '';
    const scanUrl = `${baseUrl}/scan/${vehicle.vin}`;
    const qrDataUrl = await QRCode.toDataURL(scanUrl, { width: 300, margin: 2 });
    return { qrDataUrl, scanUrl, vin: vehicle.vin };
  }),
});

const serviceCategoryRouter = router({
  list: protectedProcedure.query(async () => {
    return db.getAllServiceCategories();
  }),
  create: adminProcedure.input(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    categoryType: z.enum(["vehicle", "building", "other"]).optional(),
  })).mutation(async ({ input }) => {
    return db.createServiceCategory(input);
  }),
});

const workOrderRouter = router({
  list: protectedProcedure.query(async () => {
    return db.getAllWorkOrders();
  }),
  listByVehicle: protectedProcedure.input(z.object({ vehicleId: z.number() })).query(async ({ input }) => {
    return db.getWorkOrdersByVehicle(input.vehicleId);
  }),
  listByTechnician: protectedProcedure.input(z.object({ technicianId: z.number() })).query(async ({ input }) => {
    return db.getWorkOrdersByTechnician(input.technicianId);
  }),
  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const wo = await db.getWorkOrderById(input.id);
    if (!wo) return null;
    const items = await db.getWorkOrderItems(input.id);
    return { ...wo, items };
  }),
  create: protectedProcedure.input(z.object({
    vehicleId: z.number().optional(),
    clientId: z.number(),
    orderType: z.enum(["vehicle", "building", "general"]).optional(),
    priority: z.enum(["emergency", "high", "medium", "low"]).optional(),
    businessLine: z.enum(["acme_automotive", "customized_enterprise", "onsite_advantage"]).optional(),
    mileageAtService: z.number().optional(),
    notes: z.string().optional(),
    workDescription: z.string().optional(),
    chargeAmount: z.string().optional(),
    buildingLocation: z.string().optional(),
    technicianId: z.number().optional(),
    items: z.array(z.object({
      serviceCategoryId: z.number().optional(),
      description: z.string(),
      laborHours: z.string().optional(),
      laborRate: z.string().optional(),
      partsCost: z.string().optional(),
      totalCost: z.string().optional(),
      needsSourceOut: z.boolean().optional(),
      sourceOutNotes: z.string().optional(),
    })).optional(),
  })).mutation(async ({ input, ctx }) => {
    const { items, technicianId: assignedTechId, ...woData } = input;
    const result = await db.createWorkOrder({
      ...woData,
      technicianId: assignedTechId || ctx.user.id,
      status: "pending_approval",
    });

    // Create work order items
    if (items && items.length > 0) {
      for (const item of items) {
        await db.createWorkOrderItem({
          workOrderId: result.id,
          ...item,
        });
      }
    }

    // Update vehicle mileage if provided
    if (input.vehicleId && input.mileageAtService) {
      await db.updateVehicle(input.vehicleId, { currentMileage: input.mileageAtService });
    }

    return result;
  }),
  updateStatus: adminProcedure.input(z.object({
    id: z.number(),
    status: z.enum(["draft", "pending_approval", "approved", "denied", "in_progress", "completed"]),
  })).mutation(async ({ input, ctx }) => {
    const updateData: any = { status: input.status };
    if (input.status === "completed") {
      updateData.completedAt = new Date();
    }
    await db.updateWorkOrder(input.id, updateData);
    // Log status change
    const dbConn = await db.getDb();
    if (dbConn) {
      await dbConn.insert(workOrderEdits).values({
        workOrderId: input.id,
        userId: ctx.user?.id || null,
        userName: ctx.user?.name || "Unknown",
        action: "status_change",
        fieldChanged: "status",
        newValue: input.status,
        description: `Status changed to ${input.status.replace(/_/g, " ")}`,
      });
    }
    return { success: true };
  }),
  updateBusinessLine: adminProcedure.input(z.object({
    id: z.number(),
    businessLine: z.enum(["acme_automotive", "customized_enterprise", "onsite_advantage"]),
  })).mutation(async ({ input, ctx }) => {
    await db.updateWorkOrder(input.id, { businessLine: input.businessLine });
    const dbConn = await db.getDb();
    if (dbConn) {
      await dbConn.insert(workOrderEdits).values({
        workOrderId: input.id,
        userId: ctx.user?.id || null,
        userName: ctx.user?.name || "Unknown",
        action: "updated_details",
        fieldChanged: "businessLine",
        newValue: input.businessLine,
        description: `Moved to ${input.businessLine.replace(/_/g, " ")}`,
      });
    }
    return { success: true };
  }),
  logHours: protectedProcedure.input(z.object({
    id: z.number(),
    actualHours: z.string(),
    billedHours: z.string().optional(),
    hourlyRate: z.string().optional(),
    isRedo: z.boolean().optional(),
    redoReason: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const { id, ...data } = input;
    // Technicians can only log actualHours, not billing fields
    if (ctx.user.role === 'technician') {
      await db.updateWorkOrder(id, { actualHours: data.actualHours } as any);
    } else {
      await db.updateWorkOrder(id, data as any);
    }
    return { success: true };
  }),
  update: protectedProcedure.input(z.object({
    id: z.number(),
    workDescription: z.string().optional(),
    notes: z.string().optional(),
    priority: z.enum(["emergency", "high", "medium", "low"]).optional(),
    orderType: z.enum(["vehicle", "building", "general"]).optional(),
    businessLine: z.enum(["acme_automotive", "customized_enterprise", "onsite_advantage"]).optional(),
    chargeAmount: z.string().optional(),
    mileageAtService: z.number().optional(),
    buildingLocation: z.string().optional(),
    vehicleId: z.number().nullable().optional(),
    clientId: z.number().optional(),
    technicianId: z.number().optional(),
  })).mutation(async ({ input, ctx }) => {
    const { id, ...data } = input;
    const updateData: any = {};
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) updateData[key] = val;
    }
    if (Object.keys(updateData).length > 0) {
      await db.updateWorkOrder(id, updateData);
      // Log edit history
      const dbConn = await db.getDb();
      if (dbConn) {
        const changedFields = Object.keys(updateData).join(", ");
        await dbConn.insert(workOrderEdits).values({
          workOrderId: id,
          userId: ctx.user?.id || null,
          userName: ctx.user?.name || "Unknown",
          action: "updated_details",
          fieldChanged: changedFields,
          newValue: JSON.stringify(updateData),
          description: `Updated: ${changedFields}`,
        });
      }
    }
    return { success: true };
  }),
  addItem: protectedProcedure.input(z.object({
    workOrderId: z.number(),
    description: z.string(),
    serviceCategoryId: z.number().optional(),
    laborHours: z.string().optional(),
    laborRate: z.string().optional(),
    partsCost: z.string().optional(),
    totalCost: z.string().optional(),
    needsSourceOut: z.boolean().optional(),
    sourceOutNotes: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const result = await db.createWorkOrderItem(input);
    // Log addendum
    const dbConn = await db.getDb();
    if (dbConn) {
      await dbConn.insert(workOrderEdits).values({
        workOrderId: input.workOrderId,
        userId: ctx.user?.id || null,
        userName: ctx.user?.name || "Unknown",
        action: "added_item",
        newValue: input.description,
        description: `Added line item: ${input.description}`,
      });
    }
    return result;
  }),
  updateItem: protectedProcedure.input(z.object({
    id: z.number(),
    workOrderId: z.number().optional(),
    description: z.string().optional(),
    laborHours: z.string().optional(),
    laborRate: z.string().optional(),
    partsCost: z.string().optional(),
    totalCost: z.string().optional(),
    needsSourceOut: z.boolean().optional(),
    sourceOutNotes: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const { id, workOrderId, ...data } = input;
    const dbConn = await db.getDb();
    if (!dbConn) throw new Error("Database not available");
    const updateData: any = {};
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) updateData[key] = val;
    }
    if (Object.keys(updateData).length > 0) {
      await dbConn.update(workOrderItems).set(updateData).where(eq(workOrderItems.id, id));
      // Log item edit
      if (workOrderId) {
        await dbConn.insert(workOrderEdits).values({
          workOrderId,
          userId: ctx.user?.id || null,
          userName: ctx.user?.name || "Unknown",
          action: "edited_item",
          fieldChanged: Object.keys(updateData).join(", "),
          newValue: JSON.stringify(updateData),
          description: `Edited line item #${id}: ${Object.keys(updateData).join(", ")}`,
        });
      }
    }
    return { success: true };
  }),
  deleteItem: protectedProcedure.input(z.object({
    id: z.number(),
    workOrderId: z.number().optional(),
  })).mutation(async ({ input, ctx }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new Error("Database not available");
    // Get item info before deleting for audit log
    const [item] = await dbConn.select().from(workOrderItems).where(eq(workOrderItems.id, input.id));
    await dbConn.delete(workOrderItems).where(eq(workOrderItems.id, input.id));
    // Log deletion
    const woId = input.workOrderId || item?.workOrderId;
    if (woId) {
      await dbConn.insert(workOrderEdits).values({
        workOrderId: woId,
        userId: ctx.user?.id || null,
        userName: ctx.user?.name || "Unknown",
        action: "deleted_item",
        oldValue: item?.description || `Item #${input.id}`,
        description: `Deleted line item: ${item?.description || `#${input.id}`}`,
      });
    }
    return { success: true };
  }),
  editHistory: protectedProcedure.input(z.object({
    workOrderId: z.number(),
  })).query(async ({ input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) return [];
    const history = await dbConn.select().from(workOrderEdits)
      .where(eq(workOrderEdits.workOrderId, input.workOrderId))
      .orderBy(desc(workOrderEdits.createdAt));
    return history;
  }),
  timeBilling: ownerProcedure.query(async () => {
    return db.getTimeBillingAnalysis();
  }),
});

const invoiceRouter = router({
  list: protectedProcedure.query(async () => {
    return db.getAllInvoices();
  }),
  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getInvoiceById(input.id);
  }),
  getByWorkOrder: protectedProcedure.input(z.object({ workOrderId: z.number() })).query(async ({ input }) => {
    return db.getInvoiceByWorkOrder(input.workOrderId);
  }),
  create: adminProcedure.input(z.object({
    workOrderId: z.number(),
    clientId: z.number(),
    subtotal: z.string(),
    tax: z.string().optional(),
    total: z.string(),
    dueDate: z.string().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    // Generate invoice number: ACME-YYYYMMDD-XXXX
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const rand = Math.floor(Math.random() * 9000) + 1000;
    const invoiceNumber = `ACME-${dateStr}-${rand}`;
    const { dueDate, ...rest } = input;

    return db.createInvoice({
      ...rest,
      invoiceNumber,
      dueDate: dueDate || null,
    } as any);
  }),
  createFromWorkOrder: adminProcedure.input(z.object({
    workOrderId: z.number(),
  })).mutation(async ({ input }) => {
    // Get the work order details
    const wo = await db.getWorkOrderById(input.workOrderId);
    if (!wo) throw new TRPCError({ code: "NOT_FOUND", message: "Work order not found" });
    if (wo.status !== "completed") throw new TRPCError({ code: "BAD_REQUEST", message: "Work order must be completed before generating an invoice" });
    // Check for existing invoice
    const existing = await db.getInvoiceByWorkOrder(input.workOrderId);
    if (existing) throw new TRPCError({ code: "CONFLICT", message: "An invoice already exists for this work order" });
    // Calculate totals from work order
    const items = await db.getWorkOrderItems(input.workOrderId);
    let subtotal = 0;
    if (items && items.length > 0) {
      subtotal = items.reduce((sum: number, item: any) => sum + parseFloat(item.totalCost || "0"), 0);
    }
    if (subtotal === 0 && wo.chargeAmount) {
      subtotal = parseFloat(wo.chargeAmount as string);
    }
    if (subtotal === 0) {
      const hours = parseFloat(wo.billedHours as string || wo.actualHours as string || "0");
      const rate = parseFloat(wo.hourlyRate as string || "75");
      subtotal = hours * rate;
    }
    const tax = subtotal * 0.0875; // 8.75% CA tax
    const total = subtotal + tax;
    // Generate invoice number
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const rand = Math.floor(Math.random() * 9000) + 1000;
    const invoiceNumber = `ACME-${dateStr}-${rand}`;
    // Set due date 30 days from now
    const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return db.createInvoice({
      workOrderId: input.workOrderId,
      clientId: wo.clientId,
      invoiceNumber,
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      dueDate,
      notes: wo.workDescription || wo.notes || null,
    } as any);
  }),
  update: adminProcedure.input(z.object({
    id: z.number(),
    status: z.enum(["draft", "sent", "paid", "overdue"]).optional(),
    paidDate: z.string().optional(),
    notes: z.string().optional(),
    subtotal: z.string().optional(),
    tax: z.string().optional(),
    total: z.string().optional(),
    dueDate: z.string().optional(),
    clientId: z.number().optional(),
  })).mutation(async ({ input }) => {
    const { id, paidDate, dueDate, ...rest } = input;
    await db.updateInvoice(id, {
      ...rest,
      ...(paidDate !== undefined ? { paidDate } : {}),
      ...(dueDate !== undefined ? { dueDate } : {}),
    } as any);
    return { success: true };
  }),
});

const maintenanceRouter = router({
  listByVehicle: protectedProcedure.input(z.object({ vehicleId: z.number() })).query(async ({ input }) => {
    return db.getMaintenanceSchedulesByVehicle(input.vehicleId);
  }),
  getOverdue: protectedProcedure.input(z.object({ vehicleId: z.number(), currentMileage: z.number() })).query(async ({ input }) => {
    return db.getOverdueMaintenanceForVehicle(input.vehicleId, input.currentMileage);
  }),
  create: adminProcedure.input(z.object({
    vehicleId: z.number(),
    serviceCategoryId: z.number(),
    intervalMiles: z.number().optional(),
    intervalDays: z.number().optional(),
    lastPerformedDate: z.string().optional(),
    lastPerformedMileage: z.number().optional(),
    nextDueDate: z.string().optional(),
    nextDueMileage: z.number().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    const { lastPerformedDate, nextDueDate, ...rest } = input;
    return db.createMaintenanceSchedule({
      ...rest,
      lastPerformedDate: lastPerformedDate || null,
      nextDueDate: nextDueDate || null,
    } as any);
  }),
  update: adminProcedure.input(z.object({
    id: z.number(),
    intervalMiles: z.number().optional(),
    intervalDays: z.number().optional(),
    lastPerformedDate: z.string().optional(),
    lastPerformedMileage: z.number().optional(),
    nextDueDate: z.string().optional(),
    nextDueMileage: z.number().optional(),
    notes: z.string().optional(),
    isActive: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    const { id, lastPerformedDate, nextDueDate, ...rest } = input;
    await db.updateMaintenanceSchedule(id, {
      ...rest,
      ...(lastPerformedDate !== undefined ? { lastPerformedDate } : {}),
      ...(nextDueDate !== undefined ? { nextDueDate } : {}),
    } as any);
    return { success: true };
  }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteMaintenanceSchedule(input.id);
    return { success: true };
  }),
});

const partsRouter = router({
  listByWorkOrder: protectedProcedure.input(z.object({ workOrderId: z.number() })).query(async ({ input }) => {
    return db.getPartsByWorkOrder(input.workOrderId);
  }),
  create: protectedProcedure.input(z.object({
    workOrderId: z.number(),
    partName: z.string().min(1),
    partNumber: z.string().optional(),
    vendor: z.string().optional(),
    quantity: z.number().min(1),
    costEach: z.string(),
    chargeEach: z.string(),
    notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    const totalCost = (parseFloat(input.costEach) * input.quantity).toFixed(2);
    const totalCharge = (parseFloat(input.chargeEach) * input.quantity).toFixed(2);
    return db.createPart({
      ...input,
      totalCost,
      totalCharge,
    });
  }),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deletePart(input.id);
    return { success: true };
  }),
});

const timeEntryRouter = router({
  listByUser: protectedProcedure.input(z.object({ userId: z.number() })).query(async ({ input }) => {
    return db.getTimeEntriesByUser(input.userId);
  }),
  listByWorkOrder: protectedProcedure.input(z.object({ workOrderId: z.number() })).query(async ({ input }) => {
    return db.getTimeEntriesByWorkOrder(input.workOrderId);
  }),
  create: protectedProcedure.input(z.object({
    workOrderId: z.number().optional(),
    date: z.string(),
    hoursWorked: z.string(),
    hourlyRate: z.string(),
    description: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const totalPay = (parseFloat(input.hoursWorked) * parseFloat(input.hourlyRate)).toFixed(2);
    return db.createTimeEntry({
      userId: ctx.user.id,
      ...input,
      totalPay,
    } as any);
  }),
});

const payRecordRouter = router({
  listByUser: adminProcedure.input(z.object({ userId: z.number() })).query(async ({ input }) => {
    return db.getPayRecordsByUser(input.userId);
  }),
  listAll: adminProcedure.query(async () => {
    return db.getAllPayRecords();
  }),
  create: adminProcedure.input(z.object({
    userId: z.number(),
    amount: z.string(),
    payDate: z.string(),
    periodStart: z.string().optional(),
    periodEnd: z.string().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    return db.createPayRecord(input as any);
  }),
});

const userRouter = router({
  list: adminProcedure.query(async () => {
    return db.getAllUsers();
  }),
  updateRole: adminProcedure.input(z.object({
    id: z.number(),
    role: z.enum(["owner", "admin", "technician", "customer", "user"]),
  })).mutation(async ({ input }) => {
    await db.updateUserRole(input.id, input.role);
    return { success: true };
  }),
  toggleActive: adminProcedure.input(z.object({
    id: z.number(),
    isActive: z.boolean(),
  })).mutation(async ({ input, ctx }) => {
    // Get target user to check their role
    const allUsers = await db.getAllUsers();
    const targetUser = allUsers.find((u: any) => u.id === input.id);
    if (!targetUser) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    // Admin cannot lock Owner profiles
    if (ctx.user.role === "admin" && targetUser.role === "owner") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admins cannot lock Owner accounts" });
    }
    // Owner cannot lock other Owner profiles
    if (ctx.user.role === "owner" && targetUser.role === "owner" && targetUser.id !== ctx.user.id) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Owners cannot lock other Owner accounts" });
    }
    await db.toggleUserActive(input.id, input.isActive);
    return { success: true };
  }),
  // Create invite for a new user profile
  createInvite: adminProcedure.input(z.object({
    name: z.string().min(1),
    role: z.enum(["owner", "admin", "technician", "customer", "user"]),
    email: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const inviteCode = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    await db.createUserInvite({
      name: input.name,
      role: input.role,
      email: input.email,
      createdBy: ctx.user.id,
      inviteCode,
    });
    return { inviteCode };
  }),
  listInvites: adminProcedure.query(async () => {
    return db.getInvites();
  }),
  deleteInvite: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteInvite(input.id);
    return { success: true };
  }),
  claimInvite: protectedProcedure.input(z.object({
    inviteCode: z.string(),
  })).mutation(async ({ input, ctx }) => {
    const invite = await db.claimInvite(input.inviteCode, ctx.user.id);
    return { success: true, role: invite.role, name: invite.name };
  }),
});

const hourBankRouter = router({
  // Get balance for a specific user (or current user)
  balance: protectedProcedure.input(z.object({ userId: z.number().optional() }).optional()).query(async ({ input, ctx }) => {
    const userId = input?.userId || ctx.user.id;
    return db.getHourBankBalance(userId);
  }),
  // Get all balances (for owner/admin graphs)
  allBalances: adminProcedure.query(async () => {
    const allUsers = await db.getAllUsers();
    const balances = await Promise.all(
      allUsers.filter((u: any) => ['technician', 'admin', 'owner'].includes(u.role)).map(async (u: any) => {
        const balance = await db.getHourBankBalance(u.id);
        return { userId: u.id, userName: u.name, ...balance };
      })
    );
    return balances;
  }),
  // Get transactions
  transactions: protectedProcedure.input(z.object({ userId: z.number().optional() }).optional()).query(async ({ input, ctx }) => {
    const userId = input?.userId;
    return db.getHourBankTransactions(userId);
  }),
  // Bank or borrow hours from a work order
  record: adminProcedure.input(z.object({
    userId: z.number(),
    workOrderId: z.number().optional(),
    type: z.enum(["banked", "borrowed", "adjustment"]),
    hours: z.string(),
    billedHours: z.string().optional(),
    actualHours: z.string().optional(),
    reason: z.string().optional(),
  })).mutation(async ({ input }) => {
    await db.createHourBankTransaction(input);
    return { success: true };
  }),
});

const dashboardRouter = router({
  stats: protectedProcedure.query(async () => {
    return db.getDashboardStats();
  }),
  profitability: ownerProcedure.query(async () => {
    return db.getProfitabilityStats();
  }),
  maintenanceOverview: protectedProcedure.query(async () => {
    const database = await (await import("./db")).getDb();
    if (!database) return { byCategory: [], byVehicle: [], overdue: [], upcoming: [] };
    const { maintenanceSchedules } = await import("../drizzle/schema");
    const { serviceCategories, vehicles: vehiclesTable } = await import("../drizzle/schema");
    // Get all active maintenance schedules with category and vehicle info
    const allSchedules = await database.select({
      id: maintenanceSchedules.id,
      vehicleId: maintenanceSchedules.vehicleId,
      serviceCategoryId: maintenanceSchedules.serviceCategoryId,
      nextDueDate: maintenanceSchedules.nextDueDate,
      nextDueMileage: maintenanceSchedules.nextDueMileage,
      lastPerformedDate: maintenanceSchedules.lastPerformedDate,
      categoryName: serviceCategories.name,
      vehicleYear: vehiclesTable.year,
      vehicleMake: vehiclesTable.make,
      vehicleModel: vehiclesTable.model,
      vehicleVin: vehiclesTable.vin,
      currentMileage: vehiclesTable.currentMileage,
    })
      .from(maintenanceSchedules)
      .leftJoin(serviceCategories, eq(maintenanceSchedules.serviceCategoryId, serviceCategories.id))
      .leftJoin(vehiclesTable, eq(maintenanceSchedules.vehicleId, vehiclesTable.id))
      .where(eq(maintenanceSchedules.isActive, true));
    // Also get active work orders with vehicle info for "broken down" vehicles
    const { workOrders: woTable } = await import("../drizzle/schema");
    const activeWOs = await database.select({
      id: woTable.id,
      vehicleId: woTable.vehicleId,
      status: woTable.status,
      priority: woTable.priority,
      workDescription: woTable.workDescription,
      vehicleYear: vehiclesTable.year,
      vehicleMake: vehiclesTable.make,
      vehicleModel: vehiclesTable.model,
    })
      .from(woTable)
      .leftJoin(vehiclesTable, eq(woTable.vehicleId, vehiclesTable.id))
      .where(and(
        sql`${woTable.vehicleId} IS NOT NULL`,
        sql`${woTable.status} IN ('draft', 'pending_approval', 'approved', 'in_progress')`
      ));
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysOut = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    // Categorize maintenance: routine vs major
    const routineKeywords = ['oil', 'filter', 'wiper', 'fluid', 'tire rotation', 'air filter', 'cabin', 'coolant', 'brake fluid', 'windshield'];
    const majorKeywords = ['engine', 'transmission', 'brake pad', 'brake rotor', 'timing', 'suspension', 'alternator', 'starter', 'clutch', 'axle', 'differential'];
    const categorizeService = (name: string) => {
      const lower = (name || '').toLowerCase();
      if (routineKeywords.some(k => lower.includes(k))) return 'routine';
      if (majorKeywords.some(k => lower.includes(k))) return 'major';
      return 'routine'; // default to routine
    };
    // Build category breakdown
    const categoryMap: Record<string, { routine: number; major: number; overdue: number }> = {};
    const vehicleMap: Record<string, { vehicleName: string; routine: number; major: number; overdue: number; activeJobs: number }> = {};
    const overdue: any[] = [];
    const upcoming: any[] = [];
    for (const s of allSchedules) {
      const catName = s.categoryName || 'Unknown';
      const type = categorizeService(catName);
      const vehicleName = `${s.vehicleYear || ''} ${s.vehicleMake || ''} ${s.vehicleModel || ''}`.trim() || 'Unknown';
      const vehicleKey = String(s.vehicleId);
      if (!categoryMap[catName]) categoryMap[catName] = { routine: 0, major: 0, overdue: 0 };
      if (!vehicleMap[vehicleKey]) vehicleMap[vehicleKey] = { vehicleName, routine: 0, major: 0, overdue: 0, activeJobs: 0 };
      // Check if overdue
      const dueDateStr = s.nextDueDate ? (typeof s.nextDueDate === 'string' ? s.nextDueDate : new Date(s.nextDueDate).toISOString().split('T')[0]) : null;
      const isOverdue = (dueDateStr && dueDateStr <= today) || (s.nextDueMileage && s.currentMileage && s.nextDueMileage <= s.currentMileage);
      const isUpcoming = !isOverdue && dueDateStr && dueDateStr <= thirtyDaysOut;
      if (isOverdue) {
        categoryMap[catName].overdue++;
        vehicleMap[vehicleKey].overdue++;
        overdue.push({ ...s, vehicleName, type });
      } else if (isUpcoming) {
        upcoming.push({ ...s, vehicleName, type });
      }
      if (type === 'routine') {
        categoryMap[catName].routine++;
        vehicleMap[vehicleKey].routine++;
      } else {
        categoryMap[catName].major++;
        vehicleMap[vehicleKey].major++;
      }
    }
    // Add active work orders to vehicle breakdown
    for (const wo of activeWOs) {
      const vehicleKey = String(wo.vehicleId);
      const vehicleName = `${wo.vehicleYear || ''} ${wo.vehicleMake || ''} ${wo.vehicleModel || ''}`.trim() || 'Unknown';
      if (!vehicleMap[vehicleKey]) vehicleMap[vehicleKey] = { vehicleName, routine: 0, major: 0, overdue: 0, activeJobs: 0 };
      vehicleMap[vehicleKey].activeJobs++;
    }
    const byCategory = Object.entries(categoryMap).map(([name, data]) => ({ name, ...data }));
    const byVehicle = Object.entries(vehicleMap).map(([id, data]) => ({ vehicleId: parseInt(id), ...data }));
    return { byCategory, byVehicle, overdue, upcoming };
  }),
});

const inventoryRouter = router({
  list: protectedProcedure.query(async () => {
    return db.getAllInventory();
  }),
  create: protectedProcedure.input(z.object({
    itemName: z.string().min(1),
    partNumber: z.string().optional(),
    category: z.enum(["oil", "filters", "wipers", "fluids", "belts", "brakes", "electrical", "tools", "other"]).optional(),
    quantityOnHand: z.number().optional(),
    reorderLevel: z.number().optional(),
    costPerUnit: z.string().optional(),
    vendor: z.string().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    return db.createInventoryItem(input as any);
  }),
  update: protectedProcedure.input(z.object({
    id: z.number(),
    itemName: z.string().optional(),
    quantityOnHand: z.number().optional(),
    reorderLevel: z.number().optional(),
    costPerUnit: z.string().optional(),
    vendor: z.string().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateInventoryItem(id, data as any);
    return { success: true };
  }),
  use: protectedProcedure.input(z.object({
    inventoryId: z.number(),
    workOrderId: z.number().optional(),
    quantityUsed: z.number().min(1),
    notes: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    return db.useInventoryItem({ ...input, usedBy: ctx.user.id } as any);
  }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteInventoryItem(input.id);
    return { success: true };
  }),
});

// ============ iCal EXPORT HELPER ============

function generateICalString(events: any[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Acme Fleet//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const evt of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:acme-fleet-${evt.id}@acmefleet.app`);
    const dateStr = (evt.date || "").replace(/-/g, "");
    if (evt.allDay || (!evt.startTime && !evt.endTime)) {
      lines.push(`DTSTART;VALUE=DATE:${dateStr}`);
      lines.push(`DTEND;VALUE=DATE:${dateStr}`);
    } else {
      const start = (evt.startTime || "09:00").replace(":", "") + "00";
      const end = (evt.endTime || "10:00").replace(":", "") + "00";
      lines.push(`DTSTART:${dateStr}T${start}`);
      lines.push(`DTEND:${dateStr}T${end}`);
    }
    lines.push(`SUMMARY:${(evt.title || "").replace(/[\n\r]/g, " ")}`);
    if (evt.location) lines.push(`LOCATION:${evt.location}`);
    if (evt.notes) lines.push(`DESCRIPTION:${evt.notes.replace(/\n/g, "\\n")}`);
    if (evt.isRecurring && evt.recurrenceRule) {
      const rruleMap: Record<string, string> = {
        daily: "FREQ=DAILY",
        weekly: "FREQ=WEEKLY",
        monthly: "FREQ=MONTHLY",
        weekdays: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
      };
      let rrule = rruleMap[evt.recurrenceRule] || "FREQ=WEEKLY";
      if (evt.recurrenceEndDate) {
        rrule += `;UNTIL=${(evt.recurrenceEndDate || "").replace(/-/g, "")}T235959Z`;
      }
      lines.push(`RRULE:${rrule}`);
    }
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

const calendarRouter = router({
  list: protectedProcedure.query(async () => {
    return db.getAllCalendarEvents();
  }),
  listByUser: protectedProcedure.input(z.object({ userId: z.number() })).query(async ({ input }) => {
    return db.getCalendarEventsByUser(input.userId);
  }),
  create: protectedProcedure.input(z.object({
    title: z.string().min(1),
    eventType: z.enum(["client_work", "marketing", "side_gig", "off_day", "emergency", "personal", "meeting", "appointment"]).default("personal"),
    date: z.string(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    allDay: z.boolean().default(false),
    clientId: z.number().optional(),
    isRecurring: z.boolean().default(false),
    recurrenceRule: z.enum(["daily", "weekly", "monthly", "weekdays"]).optional(),
    recurrenceEndDate: z.string().optional(),
    recurringDay: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]).optional(),
    location: z.string().optional(),
    notes: z.string().optional(),
    color: z.string().optional(),
    assignedTo: z.number().optional(),
  })).mutation(async ({ input, ctx }) => {
    const data: any = {
      title: input.title,
      eventType: input.eventType,
      date: input.date,
      startTime: input.startTime || null,
      endTime: input.endTime || null,
      allDay: input.allDay,
      clientId: input.clientId || null,
      isRecurring: input.isRecurring,
      recurrenceRule: input.recurrenceRule || null,
      recurrenceEndDate: input.recurrenceEndDate || null,
      recurringDay: input.recurringDay || null,
      location: input.location || null,
      notes: input.notes || null,
      color: input.color || null,
      assignedTo: input.assignedTo || null,
      userId: ctx.user.id,
    };
    return db.createCalendarEvent(data);
  }),
  update: protectedProcedure.input(z.object({
    id: z.number(),
    title: z.string().optional(),
    eventType: z.enum(["client_work", "marketing", "side_gig", "off_day", "emergency", "personal", "meeting", "appointment"]).optional(),
    date: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    allDay: z.boolean().optional(),
    clientId: z.number().optional(),
    isRecurring: z.boolean().optional(),
    recurrenceRule: z.enum(["daily", "weekly", "monthly", "weekdays"]).optional(),
    recurrenceEndDate: z.string().optional(),
    location: z.string().optional(),
    notes: z.string().optional(),
    color: z.string().optional(),
    assignedTo: z.number().nullable().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateCalendarEvent(id, data as any);
    return { success: true };
  }),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteCalendarEvent(input.id);
    return { success: true };
  }),
  exportIcal: protectedProcedure.query(async ({ ctx }) => {
    const events = await db.getCalendarEventsByUser(ctx.user.id);
    const ical = generateICalString(events);
    return { ical };
  }),
});

const drivingRouter = router({
  list: adminProcedure.query(async () => {
    return db.getAllDrivingLogs();
  }),
  listByUser: protectedProcedure.input(z.object({ userId: z.number() })).query(async ({ input }) => {
    return db.getDrivingLogByUser(input.userId);
  }),
  create: protectedProcedure.input(z.object({
    date: z.string(),
    startMileage: z.number().optional(),
    endMileage: z.number().optional(),
    totalMiles: z.number().optional(),
    hoursWorked: z.string().optional(),
    drivingHours: z.string().optional(),
    fromLocation: z.string().optional(),
    toLocation: z.string().optional(),
    workOrderId: z.number().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    return db.createDrivingLog({ ...input, userId: ctx.user.id } as any);
  }),
});

const flipProjectRouter = router({
  list: protectedProcedure.query(async () => {
    return db.getAllFlipProjects();
  }),
  create: protectedProcedure.input(z.object({
    projectType: z.enum(["furniture", "vehicle", "house", "other"]).optional(),
    itemDescription: z.string().min(1),
    source: z.string().optional(),
    purchaseDate: z.string().optional(),
    purchaseCost: z.string(),
    materialsCost: z.string().optional(),
    laborHours: z.string().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    return db.createFlipProject(input as any);
  }),
  update: protectedProcedure.input(z.object({
    id: z.number(),
    status: z.enum(["purchased", "in_progress", "listed", "sold"]).optional(),
    materialsCost: z.string().optional(),
    laborHours: z.string().optional(),
    resalePrice: z.string().optional(),
    soldDate: z.string().optional(),
    profit: z.string().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateFlipProject(id, data as any);
    return { success: true };
  }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteFlipProject(input.id);
    return { success: true };
  }),
});

const expenseRouter = router({
  list: adminProcedure.query(async () => {
    return db.getAllBusinessExpenses();
  }),
  create: adminProcedure.input(z.object({
    category: z.enum(["truck_maintenance", "tools", "fuel", "insurance", "equipment", "supplies", "other"]).optional(),
    description: z.string().min(1),
    amount: z.string(),
    vendor: z.string().optional(),
    date: z.string(),
    notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    return db.createBusinessExpense(input as any);
  }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteBusinessExpense(input.id);
    return { success: true };
  }),
});

// ============ PHOTO ROUTER ============

function detectContentType(fileName: string, mediaType: "photo" | "video" | undefined): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif",
    webp: "image/webp", heic: "image/heic", heif: "image/heif", svg: "image/svg+xml",
    mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm", avi: "video/x-msvideo",
    mkv: "video/x-matroska", m4v: "video/mp4",
  };
  if (mimeMap[ext]) return mimeMap[ext];
  return mediaType === "video" ? "video/mp4" : "image/jpeg";
}

const photoRouter = router({
  listByWorkOrder: protectedProcedure.input(z.object({ workOrderId: z.number() })).query(async ({ input }) => {
    return db.getPhotosByWorkOrder(input.workOrderId);
  }),
  upload: protectedProcedure.input(z.object({
    workOrderId: z.number(),
    photoData: z.string(), // base64 encoded
    caption: z.string().optional(),
    photoType: z.enum(["before", "after", "evidence", "other"]).optional(),
    mediaType: z.enum(["photo", "video"]).optional(),
    fileName: z.string().optional(),
  })).mutation(async ({ input }) => {
    const buffer = Buffer.from(input.photoData, "base64");
    const isVideo = input.mediaType === "video";
    const fileName = input.fileName || (isVideo ? `video_${Date.now()}.mp4` : `photo_${Date.now()}.jpg`);
    const contentType = detectContentType(fileName, input.mediaType);
    const key = `work-orders/${input.workOrderId}/${fileName}`;
    const { url, key: storedKey } = await storagePut(key, buffer, contentType);
    return db.createWorkOrderPhoto({
      workOrderId: input.workOrderId,
      photoUrl: url,
      photoKey: storedKey,
      caption: input.caption || null,
      photoType: input.photoType || "evidence",
      mediaType: input.mediaType || "photo",
    } as any);
  }),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteWorkOrderPhoto(input.id);
    return { success: true };
  }),

  // ---- Vehicle Media ----
  listByVehicle: protectedProcedure.input(z.object({ vehicleId: z.number() })).query(async ({ input }) => {
    return db.getMediaByVehicle(input.vehicleId);
  }),
  uploadVehicleMedia: protectedProcedure.input(z.object({
    vehicleId: z.number(),
    mediaData: z.string(), // base64 encoded
    mediaType: z.enum(["photo", "video"]).default("photo"),
    caption: z.string().optional(),
    fileName: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const buffer = Buffer.from(input.mediaData, "base64");
    const isVideo = input.mediaType === "video";
    const fileName = input.fileName || (isVideo ? `video_${Date.now()}.mp4` : `photo_${Date.now()}.jpg`);
    const contentType = detectContentType(fileName, input.mediaType);
    const key = `vehicles/${input.vehicleId}/${fileName}`;
    const { url, key: storedKey } = await storagePut(key, buffer, contentType);
    return db.createVehicleMedia({
      vehicleId: input.vehicleId,
      mediaUrl: url,
      mediaKey: storedKey,
      mediaType: input.mediaType,
      caption: input.caption || null,
      uploadedBy: ctx.user?.id || null,
    } as any);
  }),
  deleteVehicleMedia: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteVehicleMedia(input.id);
    return { success: true };
  }),

  // ---- Flip Project Media ----
  listByFlipProject: protectedProcedure.input(z.object({ flipProjectId: z.number() })).query(async ({ input }) => {
    return db.getMediaByFlipProject(input.flipProjectId);
  }),
  uploadFlipProjectMedia: protectedProcedure.input(z.object({
    flipProjectId: z.number(),
    mediaData: z.string(), // base64 encoded
    mediaType: z.enum(["photo", "video"]).default("photo"),
    photoType: z.enum(["before", "after", "progress", "other"]).default("other"),
    caption: z.string().optional(),
    fileName: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const buffer = Buffer.from(input.mediaData, "base64");
    const isVideo = input.mediaType === "video";
    const fileName = input.fileName || (isVideo ? `video_${Date.now()}.mp4` : `photo_${Date.now()}.jpg`);
    const contentType = detectContentType(fileName, input.mediaType);
    const key = `flip-projects/${input.flipProjectId}/${fileName}`;
    const { url, key: storedKey } = await storagePut(key, buffer, contentType);
    return db.createFlipProjectMedia({
      flipProjectId: input.flipProjectId,
      mediaUrl: url,
      mediaKey: storedKey,
      mediaType: input.mediaType,
      photoType: input.photoType,
      caption: input.caption || null,
      uploadedBy: ctx.user?.id || null,
    } as any);
  }),
  deleteFlipProjectMedia: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteFlipProjectMedia(input.id);
    return { success: true };
  }),
});

// ============ BIDS / PROSPECTS ROUTER ============

const bidRouter = router({
  list: protectedProcedure.query(async () => {
    return db.getAllBids();
  }),
  create: adminProcedure.input(z.object({
    companyName: z.string().min(1),
    contactName: z.string().optional(),
    contactEmail: z.string().optional(),
    contactPhone: z.string().optional(),
    address: z.string().optional(),
    bidAmount: z.string().optional(),
    estimatedVehicles: z.number().optional(),
    serviceType: z.enum(["fleet_maintenance", "building_maintenance", "both", "other"]).optional(),
    status: z.enum(["prospect", "bid_sent", "negotiating", "won", "lost"]).optional(),
    notes: z.string().optional(),
    followUpDate: z.string().optional(),
  })).mutation(async ({ input }) => {
    return db.createBid(input as any);
  }),
  update: adminProcedure.input(z.object({
    id: z.number(),
    companyName: z.string().optional(),
    contactName: z.string().optional(),
    contactEmail: z.string().optional(),
    contactPhone: z.string().optional(),
    address: z.string().optional(),
    bidAmount: z.string().optional(),
    estimatedVehicles: z.number().optional(),
    serviceType: z.enum(["fleet_maintenance", "building_maintenance", "both", "other"]).optional(),
    status: z.enum(["prospect", "bid_sent", "negotiating", "won", "lost"]).optional(),
    notes: z.string().optional(),
    followUpDate: z.string().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    return db.updateBid(id, data as any);
  }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    return db.deleteBid(input.id);
  }),
  // Bid Photos
  listPhotos: protectedProcedure.input(z.object({ bidId: z.number() })).query(async ({ input }) => {
    return db.getPhotosByBid(input.bidId);
  }),
  uploadPhoto: protectedProcedure.input(z.object({
    bidId: z.number(),
    photoData: z.string(), // base64 encoded
    caption: z.string().optional(),
    fileName: z.string().optional(),
  })).mutation(async ({ input }) => {
    const buffer = Buffer.from(input.photoData, "base64");
    const fileName = input.fileName || `bid_photo_${Date.now()}.jpg`;
    const key = `bids/${input.bidId}/${fileName}`;
    const { url, key: storedKey } = await storagePut(key, buffer, "image/jpeg");
    return db.createBidPhoto({
      bidId: input.bidId,
      photoUrl: url,
      photoKey: storedKey,
      caption: input.caption || null,
    } as any);
  }),
  deletePhoto: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteBidPhoto(input.id);
    return { success: true };
  }),
  // Create invoice from a won bid
  createInvoice: adminProcedure.input(z.object({
    bidId: z.number(),
    subtotal: z.string(),
    tax: z.string().optional(),
    total: z.string(),
    notes: z.string().optional(),
    dueDate: z.string().optional(),
  })).mutation(async ({ input }) => {
    // Get the bid details
    const allBids = await db.getAllBids();
    const bid = allBids.find(b => b.id === input.bidId);
    if (!bid) throw new Error("Bid not found");
    // Find or create a client from the bid
    const allClients = await db.getAllClients();
    let client = allClients.find(c => c.name.toLowerCase() === bid.companyName.toLowerCase());
    if (!client) {
      const result = await db.createClient({
        name: bid.companyName,
        contactName: bid.contactName,
        contactEmail: bid.contactEmail,
        contactPhone: bid.contactPhone,
        address: bid.address,
        clientType: "regular",
      } as any);
      client = { id: result.id, name: bid.companyName } as any;
    }
    // Generate invoice number
    const allInvoices = await db.getAllInvoices();
    const invoiceNumber = `INV-${String(allInvoices.length + 1).padStart(4, "0")}`;
    return db.createInvoice({
      invoiceNumber,
      clientId: client!.id,
      subtotal: input.subtotal,
      tax: input.tax || "0",
      total: input.total,
      notes: input.notes || `Invoice from bid: ${bid.companyName}`,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      status: "draft",
    } as any);
  }),
});

// ============ CLIENT PROFITABILITY ROUTER ============

const clientProfitabilityRouter = router({
  overview: protectedProcedure.query(async () => {
    return db.getClientProfitability();
  }),
});

// ============ SEED CLIENTS ROUTER ============

const seedRouter = router({
  loadDefaultClients: adminProcedure.mutation(async () => {
    return db.seedDefaultClients();
  }),
});

// ============ HANDWRITTEN INVOICE SCANNER ============

const invoiceScannerRouter = router({
  scan: adminProcedure.input(z.object({
    photoData: z.string(), // base64 encoded image of handwritten invoice
  })).mutation(async ({ input }) => {
    // Upload the image to storage first so we have a URL for the LLM
    const buffer = Buffer.from(input.photoData, "base64");
    const fileName = `invoice_scan_${Date.now()}.jpg`;
    const key = `scanned-invoices/${fileName}`;
    const { url } = await storagePut(key, buffer, "image/jpeg");
    
    // Use LLM with vision to extract invoice data from the handwritten image
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an invoice data extraction assistant. Extract all relevant information from the handwritten invoice image. Return structured JSON with the fields: clientName, description, items (array of {description, quantity, unitPrice, total}), subtotal, tax, total, date, notes. If a field is not visible or unclear, use null. For numbers, return as strings."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Please extract all invoice information from this handwritten invoice image." },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${input.photoData}`, detail: "high" } }
          ]
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "invoice_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              clientName: { type: ["string", "null"], description: "Client or company name" },
              description: { type: ["string", "null"], description: "General description of work" },
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    description: { type: "string" },
                    quantity: { type: ["string", "null"] },
                    unitPrice: { type: ["string", "null"] },
                    total: { type: ["string", "null"] }
                  },
                  required: ["description", "quantity", "unitPrice", "total"],
                  additionalProperties: false
                }
              },
              subtotal: { type: ["string", "null"] },
              tax: { type: ["string", "null"] },
              total: { type: ["string", "null"] },
              date: { type: ["string", "null"] },
              notes: { type: ["string", "null"] }
            },
            required: ["clientName", "description", "items", "subtotal", "tax", "total", "date", "notes"],
            additionalProperties: false
          }
        }
      }
    });
    
    const content = response.choices?.[0]?.message?.content;
    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    let extracted;
    try {
      extracted = JSON.parse(contentStr || "{}");
    } catch {
      extracted = { error: "Could not parse invoice data", raw: content };
    }
    
    return { imageUrl: url, extracted };
  }),
  // Create an actual invoice from scanned data
  createFromScan: adminProcedure.input(z.object({
    clientName: z.string(),
    subtotal: z.string(),
    tax: z.string().optional(),
    total: z.string(),
    notes: z.string().optional(),
    dueDate: z.string().optional(),
  })).mutation(async ({ input }) => {
    // Find or create client
    const allClients = await db.getAllClients();
    let client = allClients.find(c => c.name.toLowerCase() === input.clientName.toLowerCase());
    if (!client) {
      const result = await db.createClient({ name: input.clientName, clientType: "regular" } as any);
      client = { id: result.id, name: input.clientName } as any;
    }
    // Generate invoice number
    const allInvoices = await db.getAllInvoices();
    const invoiceNumber = `INV-${String(allInvoices.length + 1).padStart(4, "0")}`;
    return db.createInvoice({
      invoiceNumber,
      clientId: client!.id,
      subtotal: input.subtotal,
      tax: input.tax || "0",
      total: input.total,
      notes: input.notes || "Created from scanned handwritten invoice",
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      status: "draft",
    } as any);
  }),
});

// ============ ACTIVITY & PRESENCE ROUTER ============

const activityRouter = router({
  // Log a view/action
  log: protectedProcedure.input(z.object({
    action: z.string(),
    entityType: z.string().optional(),
    entityId: z.number().optional(),
    entityTitle: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    await db.logActivity({
      userId: ctx.user.id,
      action: input.action,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      entityTitle: input.entityTitle ?? null,
    });
    // Also update lastSeen
    await db.updateUserLastSeen(ctx.user.id);
    return { success: true };
  }),

  // Heartbeat - update lastSeen without logging activity
  heartbeat: protectedProcedure.mutation(async ({ ctx }) => {
    await db.updateUserLastSeen(ctx.user.id);
    return { success: true };
  }),

  // Get recent activity (admin only)
  recent: adminProcedure.input(z.object({
    limit: z.number().min(1).max(100).default(50),
  }).optional()).query(async ({ input }) => {
    return db.getRecentActivity(input?.limit ?? 50);
  }),

  // Get activity for a specific user (admin only)
  byUser: adminProcedure.input(z.object({
    userId: z.number(),
    limit: z.number().min(1).max(100).default(30),
  })).query(async ({ input }) => {
    return db.getUserActivity(input.userId, input.limit);
  }),

  // Get online users (admin only)
  onlineUsers: adminProcedure.query(async () => {
    return db.getOnlineUsers(5);
  }),
});

// ============ CUSTOMER PORTAL ROUTER (public-facing) ============

const customerPortalRouter = router({
  // Get client info by access token (client ID encoded)
  getClientVehicles: publicProcedure.input(z.object({
    clientId: z.number(),
  })).query(async ({ input }) => {
    const vehicles = await db.getVehiclesByClient(input.clientId);
    const client = await db.getClientById(input.clientId);
    return { client, vehicles };
  }),

  // Get completed work for a client's vehicles
  completedWork: publicProcedure.input(z.object({
    clientId: z.number(),
  })).query(async ({ input }) => {
    const dbInstance = await db.getDb();
    if (!dbInstance) return [];
    const { workOrders: woTable } = await import("../drizzle/schema");
    const { vehicles: vTable } = await import("../drizzle/schema");
    const results = await dbInstance.select()
      .from(woTable)
      .innerJoin(vTable, eq(woTable.vehicleId, vTable.id))
      .where(and(
        eq(vTable.clientId, input.clientId),
        eq(woTable.status, "completed")
      ))
      .orderBy(desc(woTable.updatedAt))
      .limit(50);
    return results;
  }),

  // Get vehicle health score
  vehicleHealth: publicProcedure.input(z.object({
    vehicleId: z.number(),
  })).query(async ({ input }) => {
    const vehicle = await db.getVehicleById(input.vehicleId);
    if (!vehicle) throw new Error("Vehicle not found");
    const dbInstance = await db.getDb();
    if (!dbInstance) return { vehicle, healthScore: 0, factors: [], recommendation: "" };
    const { workOrders: woTable } = await import("../drizzle/schema");
    const { maintenanceSchedules: msTable } = await import("../drizzle/schema");

    // Get work order history
    const orders = await dbInstance.select().from(woTable).where(eq(woTable.vehicleId, input.vehicleId));
    const schedules = await dbInstance.select().from(msTable).where(eq(msTable.vehicleId, input.vehicleId));

    // Calculate health score (0-100)
    let score = 100;
    const factors: string[] = [];

    // Age factor
    const currentYear = new Date().getFullYear();
    const age = vehicle.year ? currentYear - vehicle.year : 0;
    if (age > 15) { score -= 30; factors.push(`Vehicle is ${age} years old (high age)`); }
    else if (age > 10) { score -= 15; factors.push(`Vehicle is ${age} years old (moderate age)`); }
    else if (age > 5) { score -= 5; factors.push(`Vehicle is ${age} years old`); }

    // Mileage factor
    const mileage = vehicle.currentMileage || 0;
    if (mileage > 200000) { score -= 25; factors.push(`High mileage: ${mileage.toLocaleString()} miles`); }
    else if (mileage > 150000) { score -= 15; factors.push(`Elevated mileage: ${mileage.toLocaleString()} miles`); }
    else if (mileage > 100000) { score -= 8; factors.push(`${mileage.toLocaleString()} miles`); }

    // Repair frequency factor
    const recentOrders = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    });
    if (recentOrders.length > 8) { score -= 20; factors.push(`${recentOrders.length} repairs in the last year (frequent)`); }
    else if (recentOrders.length > 4) { score -= 10; factors.push(`${recentOrders.length} repairs in the last year`); }

    // Overdue maintenance (check nextDueDate and nextDueMileage)
    const today = new Date();
    const currentMileage = vehicle.currentMileage || 0;
    const overdue = schedules.filter(s => {
      if (!s.isActive) return false;
      const dateOverdue = s.nextDueDate && new Date(s.nextDueDate) < today;
      const mileageOverdue = s.nextDueMileage && currentMileage >= s.nextDueMileage;
      return dateOverdue || mileageOverdue;
    });
    if (overdue.length > 3) { score -= 15; factors.push(`${overdue.length} overdue maintenance items`); }
    else if (overdue.length > 0) { score -= 5 * overdue.length; factors.push(`${overdue.length} overdue maintenance item(s)`); }

    score = Math.max(0, Math.min(100, score));

    let recommendation = "";
    if (score < 25) recommendation = "Consider retiring this vehicle. Repair costs likely exceed replacement value.";
    else if (score < 50) recommendation = "Vehicle is aging. Plan for replacement within 6-12 months.";
    else if (score < 70) recommendation = "Vehicle is serviceable but monitor closely.";
    else recommendation = "Vehicle is in good health. Continue regular maintenance.";

    return { vehicle, healthScore: score, factors, recommendation, totalRepairs: orders.length, overdueItems: overdue.length };
  }),

  // Submit a service request (public - no auth required)
  submitRequest: publicProcedure.input(z.object({
    clientId: z.number(),
    vehicleId: z.number().optional(),
    contactName: z.string().min(1),
    contactEmail: z.string().optional(),
    contactPhone: z.string().optional(),
    issueDescription: z.string().min(1),
    priority: z.enum(["low", "medium", "high", "emergency"]).default("medium"),
  })).mutation(async ({ input }) => {
    // Create a work order from the service request
    // technicianId=1 (admin/owner) as placeholder - will be reassigned
    const orderData = {
      clientId: input.clientId,
      vehicleId: input.vehicleId ?? null,
      technicianId: 1, // Default to owner; admin will reassign
      notes: `[Customer Portal Request]\nSubmitted by: ${input.contactName}\nEmail: ${input.contactEmail || "N/A"}\nPhone: ${input.contactPhone || "N/A"}\n\n${input.issueDescription}`,
      workDescription: input.issueDescription,
      status: "pending_approval" as const,
      priority: input.priority as "low" | "medium" | "high" | "emergency",
      orderType: (input.vehicleId ? "vehicle" : "building") as "vehicle" | "building" | "general",
      businessLine: "acme_automotive" as const,
    };
    const result = await db.createWorkOrder(orderData);
    return { success: true, workOrderId: result.id, message: "Your service request has been submitted. We will contact you shortly." };
  }),
});

// ============ VEHICLE INTELLIGENCE ROUTER ============

const vehicleIntelRouter = router({
  decodeVin: protectedProcedure.input(z.object({ vin: z.string().min(11).max(17) })).mutation(async ({ input }) => {
    // Use NHTSA vPIC API (free, no key needed)
    const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${input.vin}?format=json`);
    const data = await response.json();
    const results = data.Results || [];
    const getValue = (varName: string) => {
      const r = results.find((r: any) => r.Variable === varName);
      return r?.Value && r.Value !== "Not Applicable" && r.Value !== "" ? r.Value : null;
    };
    return {
      year: getValue("Model Year") ? parseInt(getValue("Model Year")) : null,
      make: getValue("Make"),
      model: getValue("Model"),
      trim: getValue("Trim"),
      vehicleType: getValue("Vehicle Type"),
      bodyClass: getValue("Body Class"),
      engine: [getValue("Engine Number of Cylinders"), getValue("Displacement (L)") ? `${getValue("Displacement (L)")}L` : null, getValue("Fuel Type - Primary")].filter(Boolean).join(" "),
      transmission: getValue("Transmission Style"),
      drivetrain: getValue("Drive Type"),
      fuelType: getValue("Fuel Type - Primary"),
      plantCountry: getValue("Plant Country"),
      manufacturer: getValue("Manufacturer Name"),
      doors: getValue("Doors"),
      gvwr: getValue("Gross Vehicle Weight Rating From"),
      raw: results,
    };
  }),
  checkRecalls: protectedProcedure.input(z.object({ year: z.number(), make: z.string(), model: z.string() })).query(async ({ input }) => {
    const url = `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(input.make)}&model=${encodeURIComponent(input.model)}&modelYear=${input.year}`;
    const response = await fetch(url);
    const data = await response.json();
    return (data.results || []).map((r: any) => ({
      nhtsaCampaignNumber: r.NHTSACampaignNumber,
      component: r.Component,
      summary: r.Summary,
      consequence: r.Consequence,
      remedy: r.Remedy,
      reportReceivedDate: r.ReportReceivedDate,
      manufacturer: r.Manufacturer,
    }));
  }),
  getMileageLogs: protectedProcedure.input(z.object({ vehicleId: z.number() })).query(async ({ input }) => {
    return db.getMileageLogs(input.vehicleId);
  }),
  addMileageLog: protectedProcedure.input(z.object({
    vehicleId: z.number(),
    mileage: z.number().min(0),
    notes: z.string().optional(),
    source: z.enum(["manual", "work_order", "driving_log", "service"]).optional(),
  })).mutation(async ({ input, ctx }) => {
    return db.addMileageLog({ ...input, recordedBy: ctx.user?.id });
  }),
  getServiceRecords: protectedProcedure.input(z.object({ vehicleId: z.number() })).query(async ({ input }) => {
    return db.getServiceRecords(input.vehicleId);
  }),
  addServiceRecord: protectedProcedure.input(z.object({
    vehicleId: z.number(),
    serviceType: z.string(),
    description: z.string().optional(),
    mileageAtService: z.number().optional(),
    nextDueMileage: z.number().optional(),
    nextDueDate: z.string().optional(),
    cost: z.string().optional(),
    performedBy: z.string().optional(),
    notes: z.string().optional(),
    workOrderId: z.number().optional(),
  })).mutation(async ({ input }) => {
    return db.addServiceRecord({
      ...input,
      nextDueDate: input.nextDueDate ? new Date(input.nextDueDate) : undefined,
    } as any);
  }),
  deleteServiceRecord: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    return db.deleteServiceRecord(input.id);
  }),
  updateVehicleIntel: adminProcedure.input(z.object({
    id: z.number(),
    registrationExpiry: z.string().optional(),
    registrationState: z.string().optional(),
    chpInspectionDue: z.string().optional(),
    chpInspectionLast: z.string().optional(),
    smogCheckDue: z.string().optional(),
    insuranceExpiry: z.string().optional(),
    insuranceProvider: z.string().optional(),
    insurancePolicyNumber: z.string().optional(),
    purchasePrice: z.string().optional(),
    purchaseDate: z.string().optional(),
    currentValue: z.string().optional(),
    loanBalance: z.string().optional(),
    monthlyPayment: z.string().optional(),
    loanPayoffDate: z.string().optional(),
    lender: z.string().optional(),
    assetCategory: z.enum(["fleet", "personal", "client"]).optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    const updateData: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      if (key.includes("Date") || key.includes("Expiry") || key.includes("Due") || key.includes("Last")) {
        updateData[key] = value ? new Date(value) : null;
      } else {
        updateData[key] = value || null;
      }
    }
    return db.updateVehicle(id, updateData);
  }),
});

// ============ GENERAL ASSETS ROUTER ============

const assetsRouter = router({
  list: protectedProcedure.query(async () => {
    return db.getGeneralAssets();
  }),
  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getGeneralAssetById(input.id);
  }),
  create: adminProcedure.input(z.object({
    name: z.string().min(1),
    assetType: z.enum(["house", "boat", "jet_ski", "trailer", "airplane", "rv", "equipment", "truck", "car", "motorcycle", "other"]),
    category: z.enum(["personal", "business", "investment"]).optional(),
    description: z.string().optional(),
    address: z.string().optional(),
    serialNumber: z.string().optional(),
    purchasePrice: z.string().optional(),
    purchaseDate: z.string().optional(),
    currentValue: z.string().optional(),
    loanBalance: z.string().optional(),
    monthlyPayment: z.string().optional(),
    loanPayoffDate: z.string().optional(),
    lender: z.string().optional(),
    insuranceProvider: z.string().optional(),
    insurancePolicyNumber: z.string().optional(),
    insuranceExpiry: z.string().optional(),
    registrationExpiry: z.string().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    const data: any = { ...input };
    if (data.purchaseDate) data.purchaseDate = new Date(data.purchaseDate);
    if (data.loanPayoffDate) data.loanPayoffDate = new Date(data.loanPayoffDate);
    if (data.insuranceExpiry) data.insuranceExpiry = new Date(data.insuranceExpiry);
    if (data.registrationExpiry) data.registrationExpiry = new Date(data.registrationExpiry);
    return db.createGeneralAsset(data);
  }),
  update: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    assetType: z.enum(["house", "boat", "jet_ski", "trailer", "airplane", "rv", "equipment", "other"]).optional(),
    category: z.enum(["personal", "business", "investment"]).optional(),
    description: z.string().optional(),
    address: z.string().optional(),
    serialNumber: z.string().optional(),
    purchasePrice: z.string().optional(),
    purchaseDate: z.string().optional(),
    currentValue: z.string().optional(),
    loanBalance: z.string().optional(),
    monthlyPayment: z.string().optional(),
    loanPayoffDate: z.string().optional(),
    lender: z.string().optional(),
    insuranceProvider: z.string().optional(),
    insurancePolicyNumber: z.string().optional(),
    insuranceExpiry: z.string().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    const updateData: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      if (key.includes("Date") || key.includes("Expiry")) {
        updateData[key] = value ? new Date(value) : null;
      } else {
        updateData[key] = value;
      }
    }
    return db.updateGeneralAsset(id, updateData);
  }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    return db.deleteGeneralAsset(input.id);
  }),
});

// ============ REAL ESTATE LEADS ROUTER ============

const realEstateRouter = router({
  list: protectedProcedure.query(async () => {
    return db.getRealEstateLeads();
  }),
  create: adminProcedure.input(z.object({
    name: z.string().min(1),
    email: z.string().optional(),
    phone: z.string().optional(),
    status: z.enum(["new", "contacted", "showing", "offer", "under_contract", "closed", "lost"]).optional(),
    leadSource: z.string().optional(),
    propertyInterest: z.string().optional(),
    budget: z.string().optional(),
    notes: z.string().optional(),
    followUpDate: z.string().optional(),
    isHot: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    const data: any = { ...input };
    if (data.followUpDate) data.followUpDate = new Date(data.followUpDate);
    return db.createRealEstateLead(data);
  }),
  update: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    status: z.enum(["new", "contacted", "showing", "offer", "under_contract", "closed", "lost"]).optional(),
    leadSource: z.string().optional(),
    propertyInterest: z.string().optional(),
    budget: z.string().optional(),
    notes: z.string().optional(),
    followUpDate: z.string().optional(),
    isHot: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    const updateData: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      if (key === "followUpDate") {
        updateData[key] = value ? new Date(value as string) : null;
      } else {
        updateData[key] = value;
      }
    }
    return db.updateRealEstateLead(id, updateData);
  }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    return db.deleteRealEstateLead(input.id);
  }),
});

// ============ PHONE CALLS ============
const phoneCallRouter = router({
  list: protectedProcedure.input(z.object({
    isCompleted: z.boolean().optional(),
    clientId: z.number().optional(),
    search: z.string().optional(),
    outcome: z.string().optional(),
    businessLine: z.string().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getPhoneCalls(input || {});
  }),
  pendingFollowUps: protectedProcedure.query(async () => {
    return db.getPendingFollowUps();
  }),
  create: protectedProcedure.input(z.object({
    clientId: z.number().optional(),
    contactName: z.string().min(1),
    phoneNumber: z.string().optional(),
    direction: z.enum(["outbound", "inbound"]).optional(),
    outcome: z.enum(["reached", "voicemail", "no_answer", "callback_requested", "not_called"]).optional(),
    businessLine: z.string().optional(),
    notes: z.string().optional(),
    followUpDate: z.string().optional(),
    assignedTo: z.number().optional(),
  })).mutation(async ({ input, ctx }) => {
    const data: any = { ...input, createdBy: ctx.user.id };
    if (data.followUpDate) data.followUpDate = new Date(data.followUpDate);
    return db.createPhoneCall(data);
  }),
  update: protectedProcedure.input(z.object({
    id: z.number(),
    outcome: z.enum(["reached", "voicemail", "no_answer", "callback_requested", "not_called"]).optional(),
    businessLine: z.string().optional(),
    notes: z.string().optional(),
    followUpDate: z.string().nullable().optional(),
    isCompleted: z.boolean().optional(),
    assignedTo: z.number().nullable().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    const updateData: any = { ...data };
    if (updateData.followUpDate) updateData.followUpDate = new Date(updateData.followUpDate);
    if (updateData.followUpDate === null) updateData.followUpDate = null;
    return db.updatePhoneCall(id, updateData);
  }),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    return db.deletePhoneCall(input.id);
  }),
});

// ============ CUSTOMER INQUIRY ROUTER ============

const inquiryRouter = router({
  list: adminProcedure.query(async () => {
    return db.getAllInquiries();
  }),
  getById: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getInquiryById(input.id);
  }),
  create: adminProcedure.input(z.object({
    name: z.string().min(1),
    phone: z.string().optional(),
    email: z.string().optional(),
    source: z.string().optional(),
    serviceNeeded: z.string().optional(),
    vehicleInfo: z.string().optional(),
    notes: z.string().optional(),
    businessLine: z.string().optional(),
    quotedAmount: z.string().optional(),
    followUpDate: z.string().optional(),
  })).mutation(async ({ input }) => {
    const { followUpDate, ...rest } = input;
    return db.createInquiry({
      ...rest,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
    });
  }),
  update: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    source: z.string().optional(),
    serviceNeeded: z.string().optional(),
    vehicleInfo: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(["new", "contacted", "quoted", "scheduled", "converted", "lost"]).optional(),
    businessLine: z.string().optional(),
    quotedAmount: z.string().optional(),
    followUpDate: z.string().optional(),
    convertedToClientId: z.number().optional(),
  })).mutation(async ({ input }) => {
    const { id, followUpDate, ...rest } = input;
    await db.updateInquiry(id, {
      ...rest,
      ...(followUpDate !== undefined ? { followUpDate: followUpDate ? new Date(followUpDate) : null } : {}),
    });
    return { success: true };
  }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteInquiry(input.id);
    return { success: true };
  }),
});

// ============ USER TODOS ROUTER ============

const todoRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserTodos(ctx.user!.id);
  }),
  create: protectedProcedure.input(z.object({
    title: z.string().min(1),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    dueDate: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    return db.createUserTodo({ userId: ctx.user!.id, ...input });
  }),
  update: protectedProcedure.input(z.object({
    id: z.number(),
    title: z.string().optional(),
    completed: z.boolean().optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    dueDate: z.string().nullable().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    return db.updateUserTodo(id, data);
  }),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    return db.deleteUserTodo(input.id);
  }),
});

// ============ USER EMAILS ROUTER ============

const emailRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserEmails(ctx.user!.id);
  }),
  create: protectedProcedure.input(z.object({
    subject: z.string().min(1),
    body: z.string().optional(),
    fromAddress: z.string().optional(),
    toAddress: z.string().optional(),
    direction: z.enum(["inbound", "outbound"]).optional(),
    status: z.enum(["draft", "sent", "received", "read"]).optional(),
  })).mutation(async ({ ctx, input }) => {
    return db.createUserEmail({ userId: ctx.user!.id, ...input });
  }),
});

// ============ TIME CLOCK ROUTER ============

const timeClockRouter = router({
  myEntries: protectedProcedure.query(async ({ ctx }) => {
    return db.getTimeClockEntries(ctx.user!.id);
  }),
  allEntries: adminProcedure.query(async () => {
    return db.getAllTimeClockEntries();
  }),
  activeClockIn: protectedProcedure.query(async ({ ctx }) => {
    return db.getActiveClockIn(ctx.user!.id);
  }),
  clockIn: protectedProcedure.input(z.object({
    notes: z.string().optional(),
  }).optional()).mutation(async ({ ctx, input }) => {
    return db.clockIn(ctx.user!.id, input?.notes);
  }),
  clockOut: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    return db.clockOut(input.id);
  }),
});

// ============ TECH MILEAGE ROUTER ============

const techMileageRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getTechMileage(ctx.user!.id);
  }),
  create: protectedProcedure.input(z.object({
    workOrderId: z.number().optional(),
    startMileage: z.string(),
    endMileage: z.string(),
    fromLocation: z.string().optional(),
    toLocation: z.string().optional(),
    date: z.string(),
  })).mutation(async ({ ctx, input }) => {
    return db.createTechMileage({ userId: ctx.user!.id, ...input });
  }),
});

// ============ PARTS MARKUP ROUTER ============

const partsMarkupRouter = router({
  list: protectedProcedure.input(z.object({ workOrderId: z.number().optional() }).optional()).query(async ({ input }) => {
    return db.getPartsMarkup(input?.workOrderId);
  }),
  create: adminProcedure.input(z.object({
    workOrderId: z.number(),
    partName: z.string().min(1),
    partNumber: z.string().optional(),
    costPrice: z.string(),
    markupPercent: z.number().min(25).max(300),
    supplier: z.string().optional(),
  })).mutation(async ({ input }) => {
    return db.createPartsMarkup(input);
  }),
  updateStatus: adminProcedure.input(z.object({
    id: z.number(),
    status: z.enum(["ordered", "received", "installed", "returned"]),
  })).mutation(async ({ input }) => {
    return db.updatePartsMarkupStatus(input.id, input.status);
  }),
});

// ============ PAY ROUTER ============

const payRouter = router({
  getRate: protectedProcedure.input(z.object({ userId: z.number() })).query(async ({ input }) => {
    return db.getUserPayRate(input.userId);
  }),
  setRate: ownerProcedure.input(z.object({
    userId: z.number(),
    rateType: z.enum(["hourly", "salary", "commission", "flat"]),
    rate: z.string(),
    overtimeRate: z.string().optional(),
    effectiveDate: z.string(),
  })).mutation(async ({ input }) => {
    return db.setUserPayRate(input);
  }),
  periods: adminProcedure.input(z.object({ userId: z.number().optional() }).optional()).query(async ({ input }) => {
    return db.getPayPeriods(input?.userId);
  }),
  createPeriod: ownerProcedure.input(z.object({
    userId: z.number(),
    periodStart: z.string(),
    periodEnd: z.string(),
    regularHours: z.string(),
    overtimeHours: z.string().optional(),
    grossPay: z.string(),
    deductions: z.string().optional(),
    netPay: z.string(),
  })).mutation(async ({ input }) => {
    return db.createPayPeriod(input);
  }),
});

// ============ TECH PERFORMANCE ROUTER ============

const techPerformanceRouter = router({
  stats: protectedProcedure.query(async () => {
    return db.getTechPerformanceStats();
  }),
  updateTier: ownerProcedure.input(z.object({
    userId: z.number(),
    tier: z.enum(["titanium", "platinum", "gold", "silver", "bronze", "trainee"]),
  })).mutation(async ({ input }) => {
    return db.updateUserTier(input.userId, input.tier);
  }),
  updateLevel: adminProcedure.input(z.object({
    userId: z.number(),
    level: z.enum(["expert", "master", "senior", "journeyman", "apprentice", "trainee"]),
  })).mutation(async ({ input }) => {
    return db.updateExperienceLevel(input.userId, input.level);
  }),
});

// ============ MAIN APP ROUTER ============

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  clients: clientRouter,
  vehicle: vehicleRouter,
  serviceCategory: serviceCategoryRouter,
  workOrder: workOrderRouter,
  invoice: invoiceRouter,
  maintenance: maintenanceRouter,
  parts: partsRouter,
  timeEntry: timeEntryRouter,
  payRecord: payRecordRouter,
  inventory: inventoryRouter,
  calendar: calendarRouter,
  driving: drivingRouter,
  flipProject: flipProjectRouter,
  expense: expenseRouter,
  user: userRouter,
  dashboard: dashboardRouter,
  photo: photoRouter,
  seed: seedRouter,
  bid: bidRouter,
  clientProfitability: clientProfitabilityRouter,
  invoiceScanner: invoiceScannerRouter,
  activity: activityRouter,
  customerPortal: customerPortalRouter,
  vehicleIntel: vehicleIntelRouter,
  assets: assetsRouter,
  realEstate: realEstateRouter,
  phoneCall: phoneCallRouter,
  inquiry: inquiryRouter,
  hourBank: hourBankRouter,
  todo: todoRouter,
  email: emailRouter,
  timeClock: timeClockRouter,
  techMileage: techMileageRouter,
  partsMarkup: partsMarkupRouter,
  pay: payRouter,
  techPerformance: techPerformanceRouter,
});

export type AppRouter = typeof appRouter;
