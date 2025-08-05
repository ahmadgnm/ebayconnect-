import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const ebayCredentials = pgTable("ebay_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: text("client_id").notNull(),
  clientSecret: text("client_secret").notNull(),
  environment: text("environment").notNull().default("sandbox"),
  accessToken: text("access_token"),
  tokenType: text("token_type"),
  expiresIn: text("expires_in"),
  scope: text("scope"),
  tokenCreatedAt: timestamp("token_created_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEbayCredentialsSchema = createInsertSchema(ebayCredentials).pick({
  clientId: true,
  clientSecret: true,
  environment: true,
});

export const ebayAuthRequestSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  clientSecret: z.string().min(1, "Client Secret is required"),
  environment: z.enum(["sandbox", "production"]).default("sandbox"),
});

export type InsertEbayCredentials = z.infer<typeof insertEbayCredentialsSchema>;
export type EbayCredentials = typeof ebayCredentials.$inferSelect;
export type EbayAuthRequest = z.infer<typeof ebayAuthRequestSchema>;

export interface EbayTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}
