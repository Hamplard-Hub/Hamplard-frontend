import { z } from 'zod';

export const promoCodeSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required.')
    .min(3, 'Code must be at least 3 characters.')
    .max(20, 'Code must be at most 20 characters.')
    .toUpperCase(),
  discountType: z.enum(['PERCENTAGE', 'FIXED'], {
    error: 'Select either percentage or fixed discount.',
    message: 'Select either percentage or fixed discount.',
  }),
  discountValue: z
    .number()
    .min(0, 'Discount value must be greater than 0.')
    .max(100, 'Percentage discounts cannot exceed 100%.'),
  expiryDate: z
    .string()
    .min(1, 'Expiry date is required.')
    .refine((date) => new Date(date) > new Date(), 'Expiry date must be in the future.'),
  maxUses: z
    .number()
    .int('Max uses must be a whole number.')
    .min(1, 'Max uses must be at least 1.'),
});

export type PromoCodeFormValues = z.infer<typeof promoCodeSchema>;
