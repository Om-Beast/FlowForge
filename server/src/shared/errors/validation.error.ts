import { AppError } from './app-error';
export class ValidationError extends AppError {
  constructor(message = 'Validation Error', public details?: any) {
    super(400, message);
  }
}
