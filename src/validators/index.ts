import { z } from 'zod';

/**
 * Zod schema to validate user registration input.
 */
export const RegisterSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
});

/**
 * Zod schema to validate user login input.
 */
export const LoginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

/**
 * Zod schema to validate conversation query requests.
 */
export const AskQuestionSchema = z.object({
  question: z.string().min(1, { message: 'Question cannot be empty' }),
  datasetId: z.string().uuid({ message: 'Invalid dataset ID' }).optional(),
});
