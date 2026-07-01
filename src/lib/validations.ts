import { z } from 'zod'

export const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  agencyName: z.string().min(2, 'Agency name must be at least 2 characters').max(200),
  email: z.string().email('Invalid email address').toLowerCase(),
  phone: z.string().optional().transform(v => v?.trim() || undefined),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const createPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required').max(100),
  description: z.string().max(500).optional().default(''),
  features: z.array(z.string().min(1)).default([]),
  maxSubmissionsPerMonth: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().default(true),
})

export const updatePlanSchema = createPlanSchema.partial()

export const assignPlanSchema = z.object({
  planId: z.string().nullable(),
  planExpiresAt: z.string().datetime().nullable().optional(),
})

export const updateUserSchema = z.object({
  isActive: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type CreatePlanInput = z.infer<typeof createPlanSchema>
export type AssignPlanInput = z.infer<typeof assignPlanSchema>
