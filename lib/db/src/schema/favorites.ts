import { pgTable, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { itemsTable } from "./items";

export const favoritesTable = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  itemId: integer("item_id").notNull().references(() => itemsTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  unique("favorites_user_item_unique").on(table.userId, table.itemId),
]);

export type Favorite = typeof favoritesTable.$inferSelect;
