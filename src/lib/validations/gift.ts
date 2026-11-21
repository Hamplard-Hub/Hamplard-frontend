import { z } from 'zod';

const today = new Date();
today.setHours(0, 0, 0, 0);

export const giftSchema = z.object({
  recipientEmail: z
    .string()
    .min(1, 'Recipient email is required.')
    .email('Enter a valid email address.'),
  message: z
    .string()
    .max(500, 'Message cannot exceed 500 characters.')
    .optional()
    .or(z.literal('')),
  deliveryDate: z
    .string()
    .min(1, 'Delivery date is required.')
    .refine((val) => {
      const date = new Date(val);
      date.setHours(0, 0, 0, 0);
      return date >= today;
    }, 'Delivery date must be today or in the future.'),
});

export type GiftFormValues = z.infer<typeof giftSchema>;
