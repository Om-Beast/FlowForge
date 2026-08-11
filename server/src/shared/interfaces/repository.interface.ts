export interface FindManyOptions<TFilter = Record<string, unknown>> {
  filter?: TFilter;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface IRepository<TEntity, TCreateDto, TUpdateDto, TFilter = Record<string, unknown>> {
  findById(id: string): Promise<TEntity | null>;
  findMany(options?: FindManyOptions<TFilter>): Promise<PaginatedResult<TEntity>>;
  create(data: TCreateDto): Promise<TEntity>;
  update(id: string, data: TUpdateDto): Promise<TEntity>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}
