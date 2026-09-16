import fs from 'fs';
import path from 'path';

export interface BaseEntity {
  id: string;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export type QueryOperator = '==' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'contains';

export interface QueryFilter {
  field: string;
  operator: QueryOperator;
  value: any;
}

export class Database {
  private dataDir: string;
  private memoryStore: Map<string, Map<string, BaseEntity>> = new Map();
  private initialized: boolean = false;

  constructor(dataDir?: string) {
    this.dataDir = dataDir || path.resolve(process.cwd(), 'server', 'db', 'data');
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  public async init(): Promise<void> {
    if (this.initialized) return;

    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    const files = fs.readdirSync(this.dataDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const collectionName = path.basename(file, '.json');
        const filePath = path.join(this.dataDir, file);
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const records: BaseEntity[] = JSON.parse(content);
          const colMap = new Map<string, BaseEntity>();
          for (const item of records) {
            colMap.set(item.id, item);
          }
          this.memoryStore.set(collectionName, colMap);
        } catch (err) {
          console.error(`Error loading collection ${collectionName} from ${filePath}:`, err);
        }
      }
    }

    this.initialized = true;
  }

  private getCollectionMap(collectionName: string): Map<string, BaseEntity> {
    if (!this.memoryStore.has(collectionName)) {
      this.memoryStore.set(collectionName, new Map());
    }
    return this.memoryStore.get(collectionName)!;
  }

  private persistCollection(collectionName: string): void {
    const colMap = this.getCollectionMap(collectionName);
    const records = Array.from(colMap.values());
    const filePath = path.join(this.dataDir, `${collectionName}.json`);
    const tempPath = `${filePath}.tmp.${Date.now()}`;

    // Atomic write via temp file and rename
    fs.writeFileSync(tempPath, JSON.stringify(records, null, 2), 'utf8');
    fs.renameSync(tempPath, filePath);
  }

  public findById<T extends BaseEntity>(collectionName: string, id: string): T | null {
    const colMap = this.getCollectionMap(collectionName);
    const item = colMap.get(id);
    return item ? (JSON.parse(JSON.stringify(item)) as T) : null;
  }

  public findOne<T extends BaseEntity>(collectionName: string, filters: QueryFilter[]): T | null {
    const results = this.find<T>(collectionName, filters);
    return results.length > 0 ? results[0] : null;
  }

  public find<T extends BaseEntity>(
    collectionName: string,
    filters: QueryFilter[] = [],
    options?: {
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    }
  ): T[] {
    const colMap = this.getCollectionMap(collectionName);
    let results = Array.from(colMap.values());

    // Apply filters
    for (const filter of filters) {
      results = results.filter((item) => {
        const itemVal = item[filter.field];
        switch (filter.operator) {
          case '==':
            return itemVal === filter.value;
          case '!=':
            return itemVal !== filter.value;
          case '>':
            return itemVal > filter.value;
          case '>=':
            return itemVal >= filter.value;
          case '<':
            return itemVal < filter.value;
          case '<=':
            return itemVal <= filter.value;
          case 'in':
            return Array.isArray(filter.value) && filter.value.includes(itemVal);
          case 'contains':
            if (typeof itemVal === 'string') {
              return itemVal.toLowerCase().includes(String(filter.value).toLowerCase());
            }
            if (Array.isArray(itemVal)) {
              return itemVal.includes(filter.value);
            }
            return false;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    if (options?.sortBy) {
      const field = options.sortBy;
      const order = options.sortOrder === 'desc' ? -1 : 1;
      results.sort((a, b) => {
        const valA = a[field];
        const valB = b[field];
        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        return valA > valB ? order : -order;
      });
    }

    // Apply pagination
    if (options?.offset) {
      results = results.slice(options.offset);
    }
    if (options?.limit) {
      results = results.slice(0, options.limit);
    }

    return JSON.parse(JSON.stringify(results)) as T[];
  }

  public insert<T extends BaseEntity>(collectionName: string, data: Omit<T, 'id'> & { id?: string }): T {
    const colMap = this.getCollectionMap(collectionName);
    const now = new Date().toISOString();
    const id = data.id || `${collectionName.slice(0, 4)}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const entity: BaseEntity = {
      ...data,
      id,
      createdAt: data.createdAt || now,
      updatedAt: now,
    };

    colMap.set(id, entity);
    this.persistCollection(collectionName);
    return JSON.parse(JSON.stringify(entity)) as T;
  }

  public update<T extends BaseEntity>(collectionName: string, id: string, updates: Partial<T>): T | null {
    const colMap = this.getCollectionMap(collectionName);
    const existing = colMap.get(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updated: BaseEntity = {
      ...existing,
      ...updates,
      id, // protect ID from alteration
      createdAt: existing.createdAt,
      updatedAt: now,
    };

    colMap.set(id, updated);
    this.persistCollection(collectionName);
    return JSON.parse(JSON.stringify(updated)) as T;
  }

  public delete(collectionName: string, id: string): boolean {
    const colMap = this.getCollectionMap(collectionName);
    if (!colMap.has(id)) return false;

    colMap.delete(id);
    this.persistCollection(collectionName);
    return true;
  }

  public count(collectionName: string, filters: QueryFilter[] = []): number {
    return this.find(collectionName, filters).length;
  }

  public isEmpty(collectionName: string): boolean {
    const colMap = this.getCollectionMap(collectionName);
    return colMap.size === 0;
  }
}

export const db = new Database();
