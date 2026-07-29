import { relations } from "drizzle-orm";
import { clients, vehicles, workOrders, workOrderItems, invoices, maintenanceSchedules, serviceCategories, users, parts, timeEntries, payRecords } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  workOrders: many(workOrders),
  timeEntries: many(timeEntries),
  payRecords: many(payRecords),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  vehicles: many(vehicles),
  workOrders: many(workOrders),
  invoices: many(invoices),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  client: one(clients, {
    fields: [vehicles.clientId],
    references: [clients.id],
  }),
  workOrders: many(workOrders),
  maintenanceSchedules: many(maintenanceSchedules),
}));

export const workOrdersRelations = relations(workOrders, ({ one, many }) => ({
  vehicle: one(vehicles, {
    fields: [workOrders.vehicleId],
    references: [vehicles.id],
  }),
  client: one(clients, {
    fields: [workOrders.clientId],
    references: [clients.id],
  }),
  technician: one(users, {
    fields: [workOrders.technicianId],
    references: [users.id],
  }),
  items: many(workOrderItems),
  parts: many(parts),
  timeEntries: many(timeEntries),
}));

export const workOrderItemsRelations = relations(workOrderItems, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderItems.workOrderId],
    references: [workOrders.id],
  }),
  serviceCategory: one(serviceCategories, {
    fields: [workOrderItems.serviceCategoryId],
    references: [serviceCategories.id],
  }),
}));

export const partsRelations = relations(parts, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [parts.workOrderId],
    references: [workOrders.id],
  }),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  user: one(users, {
    fields: [timeEntries.userId],
    references: [users.id],
  }),
  workOrder: one(workOrders, {
    fields: [timeEntries.workOrderId],
    references: [workOrders.id],
  }),
}));

export const payRecordsRelations = relations(payRecords, ({ one }) => ({
  user: one(users, {
    fields: [payRecords.userId],
    references: [users.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [invoices.workOrderId],
    references: [workOrders.id],
  }),
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
}));

export const maintenanceSchedulesRelations = relations(maintenanceSchedules, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [maintenanceSchedules.vehicleId],
    references: [vehicles.id],
  }),
  serviceCategory: one(serviceCategories, {
    fields: [maintenanceSchedules.serviceCategoryId],
    references: [serviceCategories.id],
  }),
}));

export const serviceCategoriesRelations = relations(serviceCategories, ({ many }) => ({
  workOrderItems: many(workOrderItems),
  maintenanceSchedules: many(maintenanceSchedules),
}));
