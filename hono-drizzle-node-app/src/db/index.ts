import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from 'pg';
import * as schema from "./schema.js";
import "dotenv/config";

// get database url from env, get database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // e.g. postgres://user:password@host:port/db
});

// export db instance from drizzle
export const db = drizzle(pool, { schema });
