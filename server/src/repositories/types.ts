/**
 * Data-access contract. Services depend ONLY on this interface — never on a
 * concrete store. Prompt 10 swaps the in-memory implementation for real
 * database queries without touching services, controllers or API contracts
 * (Prompt 09 §13).
 *
 * Everything is async so the swap is invisible to callers.
 */

export type Predicate<T> = (row: T) => boolean;

export interface Repository<T extends { id: string }> {
  all(): Promise<T[]>;
  filter(predicate: Predicate<T>): Promise<T[]>;
  find(predicate: Predicate<T>): Promise<T | undefined>;
  getById(id: string): Promise<T | undefined>;
  /** Insert a fully-formed entity (id + timestamps already set by the service). */
  insert(entity: T): Promise<T>;
  /** Shallow-merge a patch into an existing row; returns undefined if not found. */
  patch(id: string, patch: Partial<T>): Promise<T | undefined>;
  remove(id: string): Promise<boolean>;
  count(predicate?: Predicate<T>): Promise<number>;
}

/** Settings use a key/value shape rather than id rows. */
export interface KeyValueRepository {
  get<V = unknown>(key: string): Promise<V | undefined>;
  set(key: string, value: unknown): Promise<void>;
  all(): Promise<Record<string, unknown>>;
}
