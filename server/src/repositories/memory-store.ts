import type { KeyValueRepository, Predicate, Repository } from "./types.js";
import { nowISO } from "../utils/dates.js";

/**
 * In-memory implementation of the repository contract. Data lives for the
 * lifetime of the process — this is the "lightweight stub data layer" of
 * Prompt 09 §13. Reads return shallow clones so callers can't mutate the
 * store by reference (mirrors how a real DB behaves).
 */
export class MemoryRepository<T extends { id: string }> implements Repository<T> {
  private rows = new Map<string, T>();

  constructor(seed: T[] = []) {
    for (const row of seed) this.rows.set(row.id, row);
  }

  private clone(row: T): T {
    return structuredClone(row);
  }

  async all(): Promise<T[]> {
    return [...this.rows.values()].map((r) => this.clone(r));
  }

  async filter(predicate: Predicate<T>): Promise<T[]> {
    return [...this.rows.values()].filter(predicate).map((r) => this.clone(r));
  }

  async find(predicate: Predicate<T>): Promise<T | undefined> {
    const row = [...this.rows.values()].find(predicate);
    return row ? this.clone(row) : undefined;
  }

  async getById(id: string): Promise<T | undefined> {
    const row = this.rows.get(id);
    return row ? this.clone(row) : undefined;
  }

  async insert(entity: T): Promise<T> {
    this.rows.set(entity.id, this.clone(entity));
    return this.clone(entity);
  }

  async patch(id: string, patch: Partial<T>): Promise<T | undefined> {
    const existing = this.rows.get(id);
    if (!existing) return undefined;
    const next = { ...existing, ...patch } as T;
    if ("updatedAt" in next) (next as Record<string, unknown>).updatedAt = nowISO();
    this.rows.set(id, next);
    return this.clone(next);
  }

  async remove(id: string): Promise<boolean> {
    return this.rows.delete(id);
  }

  async count(predicate?: Predicate<T>): Promise<number> {
    if (!predicate) return this.rows.size;
    return [...this.rows.values()].filter(predicate).length;
  }
}

export class MemoryKeyValue implements KeyValueRepository {
  private map = new Map<string, unknown>();

  constructor(seed: Record<string, unknown> = {}) {
    for (const [k, v] of Object.entries(seed)) this.map.set(k, v);
  }

  async get<V = unknown>(key: string): Promise<V | undefined> {
    return this.map.has(key) ? structuredClone(this.map.get(key)) as V : undefined;
  }

  async set(key: string, value: unknown): Promise<void> {
    this.map.set(key, structuredClone(value));
  }

  async all(): Promise<Record<string, unknown>> {
    return Object.fromEntries([...this.map.entries()].map(([k, v]) => [k, structuredClone(v)]));
  }
}
