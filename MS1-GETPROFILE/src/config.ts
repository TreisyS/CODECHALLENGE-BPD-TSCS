import dotenv from 'dotenv';
import {z} from 'zod';

dotenv.config();
const envSchema = z.object
(
    {
        PORT:            z.string().default('3000'),
        BASE_URL_MS2:    z.string(),
        JWT_SECRET:      z.string(),
        CORS_ORIGIN:     z.string().optional(),
        INTERNAL_USER:   z.string(),
        INTERNAL_PASS:   z.string(),
        NODE_ENV:        z.enum(['development','production','test']).default('development'), 
        API_KEY_SECRET:  z.string()
    }
)
const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
    console.error('Error en las variables de entorno:', parsedEnv.error.format());
    process.exit(1); // Exit the process if validation fails
}
export const config = parsedEnv.data;

