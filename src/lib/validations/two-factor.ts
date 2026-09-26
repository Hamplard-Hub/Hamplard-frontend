import { z } from 'zod';

export const twoFactorCodeSchema = z.object({
  code: z.string()
    .length(6, 'Code must be 6 digits.')
    .regex(/^\d+$/, 'Code must contain only numbers.'),
});

export type TwoFactorCodeInput = z.infer<typeof twoFactorCodeSchema>;
