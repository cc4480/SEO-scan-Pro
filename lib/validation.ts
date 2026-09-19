import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const registerSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().trim().max(120).optional()
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
  password: z.string().min(1, 'Password is required').max(128)
});

export const scanCreateSchema = z.object({
  url: z.string().trim().min(1, 'URL is required').max(2048),
  mode: z.enum(['SINGLE', 'FULL_SITE']).optional(),
  depth: z.coerce.number().int().min(1).max(5).optional(),
  leadEmail: z.string().trim().email().max(255).optional().or(z.literal('')),
  leadName: z.string().trim().max(120).optional()
});

export const widgetScanSchema = z.object({
  url: z.string().trim().min(1, 'URL is required').max(2048),
  email: z.string().trim().email('Invalid email address').max(255),
  name: z.string().trim().max(120).optional(),
  widgetKey: z.string().trim().min(1, 'Widget key is required')
});

export const settingsSchema = z.object({
  agencyName: z.string().trim().max(120).optional(),
  logoUrl: z.string().trim().max(2048).optional().or(z.literal('')),
  primaryColor: z.string().trim().max(20).optional(),
  accentColor: z.string().trim().max(20).optional(),
  customFooter: z.string().trim().max(500).optional(),
  enabledSections: z.array(z.string()).optional(),
  language: z.enum(['en', 'es']).optional(),
  webhookUrl: z.string().trim().max(2048).optional().or(z.literal('')),
  monitoringEmail: z.string().trim().email().max(255).optional().or(z.literal('')),
  enableEmailAlerts: z.boolean().optional()
});

export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: result.error.issues[0]?.message || 'Invalid request data'
      });
    }
    req.body = result.data;
    next();
  };
}
