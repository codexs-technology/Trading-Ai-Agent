import { z } from 'zod';

export const RoleSchema = z.enum(['USER', 'ADMIN']);
export type Role = z.infer<typeof RoleSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: RoleSchema,
  isActive: z.boolean(),
  emailVerified: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type User = z.infer<typeof UserSchema>;

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  timezone: z.string(),
  locale: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const SessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  token: z.string(),
  expiresAt: z.date(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Session = z.infer<typeof SessionSchema>;

export const SecuritySettingSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  twoFactorEnabled: z.boolean(),
  twoFactorSecret: z.string().optional(),
  loginAlerts: z.boolean(),
  apiKeysEnabled: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type SecuritySetting = z.infer<typeof SecuritySettingSchema>;

export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberMe: z.boolean().optional(),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const RegisterInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const ChangePasswordInputSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});
export type ChangePasswordInput = z.infer<typeof ChangePasswordInputSchema>;