import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.ts';

// Use a local file for SQLite database
const sqlite = new Database('sqlite.db');

// Initialize Drizzle with the database and schema
export const db = drizzle(sqlite, { schema });
