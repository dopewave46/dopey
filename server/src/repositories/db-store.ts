/**
 * Postgres-backed implementation of the `Repository<T>` / `KeyValueRepository`
 * contracts (Prompt 09 §13). Swapped in for `MemoryRepository` in
 * `repositories/index.ts` — services, controllers and API contracts are
 * untouched.
 *
 * On predicate methods (`filter` / `find` / `count(predicate)`): the interface
 * passes arbitrary JavaScript functions, which cannot be translated to SQL.
 * This is a single-user tool whose largest table holds a few hundred rows, so
 * these methods load the table and run the predicate in memory — identical
 * semantics to the in-memory store, negligible cost at this scale. `all`,
 * `getById`, `insert`, `patch`, `remove` and unfiltered `count` are real SQL.
 */
import { count as countFn, eq, getTableColumns } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { dbc } from "../db/client.js";
import { fromRow, SHAPES, type TableName, toRow } from "../db/mappers.js";
import type { KeyValueRepository, Predicate, Repository } from "./types.js";

type Row = Record<string, unknown>;

export class DbRepository<T extends { id: string }> implements Repository<T> {
  private readonly shape;
  private readonly idCol;

  constructor(
    private readonly table: PgTable,
    tableName: TableName,
  ) {
    this.shape = SHAPES[tableName];
    this.idCol = (getTableColumns(this.table) as Row).id as never;
  }

  private map = (row: Row): T => fromRow<T>(this.shape, row);

  async all(): Promise<T[]> {
    const rows = (await dbc.select().from(this.table)) as Row[];
    return rows.map(this.map);
  }

  async filter(predicate: Predicate<T>): Promise<T[]> {
    return (await this.all()).filter(predicate);
  }

  async find(predicate: Predicate<T>): Promise<T | undefined> {
    return (await this.all()).find(predicate);
  }

  async getById(id: string): Promise<T | undefined> {
    const rows = (await dbc.select().from(this.table).where(eq(this.idCol, id)).limit(1)) as Row[];
    return rows[0] ? this.map(rows[0]) : undefined;
  }

  async insert(entity: T): Promise<T> {
    await dbc.insert(this.table).values(toRow(this.shape, entity as Row) as never);
    return entity;
  }

  async patch(id: string, patch: Partial<T>): Promise<T | undefined> {
    const set = toRow(this.shape, patch as Row);
    if (this.shape.touch) set.updatedAt = new Date();
    if (Object.keys(set).length === 0) return this.getById(id);
    const rows = (await dbc
      .update(this.table)
      .set(set as never)
      .where(eq(this.idCol, id))
      .returning()) as Row[];
    return rows[0] ? this.map(rows[0]) : undefined;
  }

  async remove(id: string): Promise<boolean> {
    const rows = (await dbc.delete(this.table).where(eq(this.idCol, id)).returning()) as Row[];
    return rows.length > 0;
  }

  async count(predicate?: Predicate<T>): Promise<number> {
    if (predicate) return (await this.all()).filter(predicate).length;
    const rows = (await dbc.select({ n: countFn() }).from(this.table)) as Array<{ n: number }>;
    return Number(rows[0]?.n ?? 0);
  }
}

/* ------------------------------------------------------------------ */
/* settings key/value                                                 */
/* ------------------------------------------------------------------ */

import { settings as settingsTable } from "../db/schema.js";

export class DbKeyValue implements KeyValueRepository {
  async get<V = unknown>(key: string): Promise<V | undefined> {
    const rows = await dbc
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.key, key))
      .limit(1);
    return rows[0] ? (rows[0].value as V) : undefined;
  }

  async set(key: string, value: unknown): Promise<void> {
    await dbc
      .insert(settingsTable)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({ target: settingsTable.key, set: { value, updatedAt: new Date() } });
  }

  async all(): Promise<Record<string, unknown>> {
    const rows = await dbc.select().from(settingsTable);
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }
}
