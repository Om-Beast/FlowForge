import { PaginatedResult, FindManyOptions } from './repository.interface';

export interface IService<TDto, TCreateDto, TUpdateDto, TFilter = Record<string, unknown>> {
  findById(id: string): Promise<TDto>;
  findMany(options?: FindManyOptions<TFilter>): Promise<PaginatedResult<TDto>>;
  create(data: TCreateDto): Promise<TDto>;
  update(id: string, data: TUpdateDto): Promise<TDto>;
  delete(id: string): Promise<void>;
}
