/**
 * Row <-> entity conversion.
 *
 * Drizzle already returns rows keyed by the camelCase property names declared in
 * `schema.ts` (e.g. `estimatedValue`, not `estimated_value`), so there is no
 * key-renaming to do here. Only *value* types differ from the entity contract:
 *
 *   - `numeric` columns come back as strings  -> entities want `number`
 *   - `timestamptz` columns come back as `Date` -> entities want ISO strings
 *   - SQL `NULL` -> entities omit the key (optional `?` fields are `undefined`)
 *
 * Each table declares only its money columns and its date columns; every other
 * field passes straight through.
 */

export interface TableShape {
  /** numeric(12,2) columns — string <-> number */
  money: readonly string[];
  /** timestamptz columns — Date <-> ISO string */
  dates: readonly string[];
  /** true if the table has an `updatedAt` the repo should bump on patch */
  touch: boolean;
}

const M = (money: readonly string[], dates: readonly string[], touch = true): TableShape => ({
  money,
  dates,
  touch,
});

export const SHAPES = {
  users: M([], ["createdAt", "updatedAt"]),
  sessions: M([], ["createdAt", "expiresAt"], false),
  leads: M(["estimatedValue"], ["followUpDate", "archivedAt", "createdAt", "updatedAt"]),
  clients: M([], ["createdAt", "updatedAt"]),
  projects: M(["value"], ["startDate", "deadline", "createdAt", "updatedAt"]),
  projectStages: M([], [], false),
  tasks: M([], ["dueDate", "completedAt", "createdAt", "updatedAt"]),
  invoices: M(["amount"], ["issueDate", "dueDate", "paidDate", "createdAt", "updatedAt"]),
  payments: M(["amount"], ["paymentDate", "createdAt", "updatedAt"]),
  expenses: M(["amount"], ["date", "createdAt", "updatedAt"]),
  amcs: M([], ["startDate", "renewalDate", "hostingRenewalDate", "createdAt", "updatedAt"]),
  amcTasks: M([], ["dueDate"], false),
  followUps: M([], ["dueDate", "completedAt"], false),
  activities: M([], ["createdAt"], false),
  notifications: M([], ["createdAt"], false),
} as const;

export type TableName = keyof typeof SHAPES;

/** DB row -> entity: numeric strings to numbers, Dates to ISO strings, drop nulls. */
export function fromRow<T>(shape: TableShape, row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(row)) {
    if (val === null || val === undefined) continue;
    if (shape.money.includes(key)) {
      out[key] = typeof val === "string" ? Number(val) : val;
    } else if (shape.dates.includes(key)) {
      out[key] = val instanceof Date ? val.toISOString() : String(val);
    } else {
      out[key] = val;
    }
  }
  return out as T;
}

/** entity (or patch) -> DB row: numbers to numeric strings, ISO strings to Dates, undefined to null. */
export function toRow(shape: TableShape, entity: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(entity)) {
    if (val === undefined) {
      out[key] = null;
      continue;
    }
    if (val === null) {
      out[key] = null;
    } else if (shape.money.includes(key)) {
      out[key] = typeof val === "number" ? val.toFixed(2) : val;
    } else if (shape.dates.includes(key)) {
      out[key] = val instanceof Date ? val : new Date(val as string);
    } else {
      out[key] = val;
    }
  }
  return out;
}
