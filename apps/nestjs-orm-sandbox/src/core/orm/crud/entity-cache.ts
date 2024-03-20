export class EntityCache<E> {
  /*  private items?: Map<Primary<E>, E>; // undefined if uninitialized
  private options!: EntityCacheOptions<E>;
  private static traceConfig: EntityCacheTraceConfig;
  private traceId: string;

  constructor(options: EntityCacheOptions<E>) {
    this.options = options;
    this.traceId = (<any>options.dataSource).constructor.name;
    if (!EntityCache.traceConfig) {
      EntityCache.traceConfig = {
        enabled: BoolUtils.toBoolean(process.env['TRACE_ORM_CRUD_CACHING']),
        dataEnabled: BoolUtils.toBoolean(process.env['TRACE_DATA_ORM_CRUD_CACHING']),
      };
    }

    if (this.tracing) {
      this.trace('Creation');
    }
  }

  private get tracing(): boolean {
    return EntityCache.traceConfig.enabled;
  }

  private get dataTracing(): boolean {
    return EntityCache.traceConfig.dataEnabled;
  }

  async getAll(): Promise<E[]> {
    await this.initOnDemand();
    const items = Array.from(this.items.values());
    if (this.tracing) {
      this.trace(`getAll() from cache (${items.length})`, items);
    }
    return items;
  }

  async get(id: Primary<E>): Promise<E> {
    await this.initOnDemand();
    console.log('ID:', id);
    const item = this.items.get(id);
    if (this.tracing) {
      this.trace(`get(item[${id}]) from cache`, item);
    }
    return item;
  }

  async set(id: Primary<E>, item: E): Promise<void> {
    if (this.tracing) {
      this.trace(`set(item[${id}]) in cache`, item);
    }
    await this.initOnDemand();
    this.items.set(id, item);
  }

  delete(id: Primary<E>): void {
    if (this.tracing) {
      this.trace(`delete(item[${id}]]) from cache`);
    }
    if (this.items) {
      this.items.delete(id);
    }
  }

  invalidateAll(): void {
    if (this.tracing) {
      this.trace('Invalidate cache');
    }

    if (this.items) {
      this.items.clear();
      this.items = undefined;
    }
  }


  dumpCache(): Map<Primary<E>, E> | undefined {
    console.log('>>>>>>>> dumpCache():', this.items);
    return this.items;
  }

  private async initOnDemand() {
    if (this.items) {
      return; // already initialized
    }
    if (this.tracing) {
      this.trace('Initialization');
    }
    this.items = new Map<Primary<E>, E>();
    const items = await this.options.dataSource.getAllForCache();
    const id = this.options.pkName as keyof E;
    this.items = MapUtils.arrayToMap(items, id) as Map<Primary<E>, E>;
    if (this.tracing) {
      this.trace('Items loaded during initialization: ' + this.items.size);
    }
  }

  private trace(msg: string, data?: any) {
    if (!this.tracing) {
      return;
    }
    const m = `##### OrmCud CACHING[${this.traceId}] - ` + msg;
    if (data !== undefined && this.dataTracing) {
      console.log(m + ' - DATA:', data);
    } else {
      console.log(m);
    }
  }*/
}
