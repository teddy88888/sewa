import { pgTable, serial, text, timestamp, numeric, integer, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { itemsTable } from "./items";

export const bookingStatusEnum = pgEnum("booking_status", ["pending", "paid", "active", "completed", "cancelled"]);
export const depositStatusEnum = pgEnum("deposit_status", ["held", "refunded", "deducted"]);
export const returnConditionEnum = pgEnum("return_condition", ["good", "damaged", "lost"]);

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull().references(() => itemsTable.id),
  renterId: integer("renter_id").notNull().references(() => usersTable.id),
  ownerId: integer("owner_id").notNull().references(() => usersTable.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  durationDays: integer("duration_days").notNull(),
  status: bookingStatusEnum("status").notNull().default("pending"),
  rentalFee: numeric("rental_fee", { precision: 12, scale: 2 }).notNull(),
  depositAmount: numeric("deposit_amount", { precision: 12, scale: 2 }).notNull(),
  insuranceFee: numeric("insurance_fee", { precision: 12, scale: 2 }).notNull().default("0"),
  serviceFee: numeric("service_fee", { precision: 12, scale: 2 }).notNull().default("0"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  depositStatus: depositStatusEnum("deposit_status").notNull().default("held"),
  returnCondition: returnConditionEnum("return_condition"),
  returnNotes: text("return_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
