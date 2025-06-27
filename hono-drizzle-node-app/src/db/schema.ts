import { integer, pgTable, text, uniqueIndex ,serial,timestamp} from "drizzle-orm/pg-core";

// create users table
export const usersTable = pgTable(
  "users_table",
  {
    id: serial().notNull().primaryKey(),
    name: text().notNull(),
    age: integer().notNull(),
    email: text().notNull().unique(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  // create unique index on email column
  (table) => [uniqueIndex("email_idx").on(table.email)]
);

// export types for users table
export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
