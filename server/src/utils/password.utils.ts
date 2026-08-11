import bcrypt from 'bcrypt';
import { authConfig } from '../config';

export const hashPassword = async (plaintext: string): Promise<string> => {
  return bcrypt.hash(plaintext, authConfig.bcrypt.rounds);
};

export const comparePassword = async (
  plaintext: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(plaintext, hash);
};

export const isStrongPassword = (password: string): boolean => {
  // min 8 chars, at least one uppercase, one lowercase, one digit, one special char
  const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return pattern.test(password);
};
