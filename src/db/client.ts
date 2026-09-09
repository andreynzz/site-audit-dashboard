import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export function createDatabaseClient(databaseUrl: string) {
  const queryClient = postgres(databaseUrl, { max: 1 });

  return drizzle({ client: queryClient, schema });
}

export function getDatabaseClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL must be configured before accessing the database.",
    );
  }

  return createDatabaseClient(databaseUrl);
}
