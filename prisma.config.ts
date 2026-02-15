// Configuration Prisma pour Supabase (connexion poolee + directe)
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Charger .env.local en priorite, puis .env en fallback
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
