import { z } from 'zod';
import isEmail from 'validator/lib/isEmail';
import isISO31661Alpha2 from 'validator/lib/isISO31661Alpha2';

export const updateProfileSchema = z
  .object({
    firstName: z.string().min(1, { message: 'Nombre requerido' }),
    lastName: z.string().min(1, { message: 'Apellido requerido' }),
    countryCode: z
      .string()
      .length(2, { message: 'Código de país debe tener 2 letras' })
      .refine((c) => isISO31661Alpha2(c), { message: 'Código de país inválido' })
      .transform((c) => c.toUpperCase()),
    cellphone: z.string().min(1, { message: 'Teléfono requerido' }),
    email: z
      .string()
      .refine((val) => isEmail(val), { message: 'Email con formato inválido' }),
    address: z.string().min(1, { message: 'Dirección es requerida' }),
  })
  .strict()
  .partial(); 

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;