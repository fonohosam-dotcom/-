import { db } from './index.js';
import { sql } from 'drizzle-orm';
import { logger } from '../lib/logger.ts';

export async function setupDatabaseTriggers() {
  try {
    logger.info('Setting up immutable ledger triggers...');

    // Trigger function to audit insertions into ledger_entries
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION audit_ledger_insert() RETURNS trigger AS $$
      BEGIN
        INSERT INTO audit_trails (action_type, entity_type, entity_id, details)
        VALUES (
          'INSERT', 
          'ledger_entries', 
          NEW.id::text, 
          'Immutable ledger log: ' || NEW.amount || ' to ' || NEW.credit_account
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Attach trigger to ledger_entries
    await db.execute(sql`
      DROP TRIGGER IF EXISTS ledger_insert_trigger ON ledger_entries;
      CREATE TRIGGER ledger_insert_trigger
      AFTER INSERT ON ledger_entries
      FOR EACH ROW EXECUTE FUNCTION audit_ledger_insert();
    `);

    // We can also prevent UPDATE and DELETE on ledger_entries to make it truly immutable
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION prevent_ledger_modification() RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'Ledger entries are immutable and cannot be modified or deleted.';
      END;
      $$ LANGUAGE plpgsql;
    `);

    await db.execute(sql`
      DROP TRIGGER IF EXISTS ledger_immutable_update_trigger ON ledger_entries;
      CREATE TRIGGER ledger_immutable_update_trigger
      BEFORE UPDATE ON ledger_entries
      FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();
    `);

    await db.execute(sql`
      DROP TRIGGER IF EXISTS ledger_immutable_delete_trigger ON ledger_entries;
      CREATE TRIGGER ledger_immutable_delete_trigger
      BEFORE DELETE ON ledger_entries
      FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();
    `);

    logger.info('Immutable ledger triggers setup successfully.');
  } catch (error) {
    logger.error('Failed to setup database triggers:', error);
  }
}
