import dotenv from 'dotenv';
import {z} from 'zod';

dotenv.config();
const envSchema = z.object
(
    {
        PORT:            z.string().default('3000'),
        MONGO_URI:       z.string(),
        JWT_SECRET:      z.string(),
        CORS_ORIGIN:     z.string().optional(),
        INTERNAL_USER:   z.string(),
        INTERNAL_PASS:   z.string(),
        NODE_ENV:        z.enum(['development','production','test']).default('development'),
        NUMVERIFY_KEY:   z.string(),
        HOSTSERVER:      z.string(),  
        API_KEY_SECRET:  z.string(),
        VERIFICATION_EMAIL_FROM: z.string().email(),
        VERIFICATION_EMAIL_PASS: z.string(),
        VERIFICATION_CODE_TTL_MINUTES: z
        .string()
        .default("10")
        .transform((s) => {
          const n = parseInt(s, 10);
          if (Number.isNaN(n) || n <= 0) {
            throw new Error("VERIFICATION_CODE_TTL_MINUTES debe ser un entero positivo");
          }
          return n;}),
        });
const parsed= envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('Error en las variables de entorno:', parsed.error.format());
    process.exit(1); // Exit the process if validation fails
}
export const config = envSchema.parse(process.env);

