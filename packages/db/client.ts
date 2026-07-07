import path from "node:path";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./src/schema";

config({ path: path.resolve(__dirname, "../../.env") });

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
