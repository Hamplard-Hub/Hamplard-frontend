import { z } from 'zod';

export const instructorApplicationSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  expertiseArea: z.string().min(2, 'Expertise area is required'),
  portfolioUrl: e.string().url('Please enter a valid URL'),
  bio: e.string().min(10, 'Bio must be at least 10 characters'),
});

export type InstructorApplicationValues = z.infer<typeof instructorApplicationSchema>;