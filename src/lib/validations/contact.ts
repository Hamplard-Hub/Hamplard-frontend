import { z } from 'zod';

export const contactFormSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name must be less than 100 characters.')
    .nonempty('Name is required.'),
  email: z.string()
    .email('Enter a valid email address.')
    .nonempty('Email is required.'),
  subject: z.enum(['General', 'Billing', 'Technical', 'Instructor', 'Report'], {
    errorMap: () => ({ message: 'Please select a subject.' }),
  }),
  message: z.string()
    .min(10, 'Message must be at least 10 characters.')
    .max(5000, 'Message must be less than 5000 characters.')
    .nonempty('Message is required.'),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
