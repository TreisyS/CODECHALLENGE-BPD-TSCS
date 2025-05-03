// src/dtos/send-verification.dto.ts
import { z } from "zod";

export const sendCodeSchema = z.object({
  email: z.string().email({ message: "Email con formato inválido" })
});
export type SendCodeDto = z.infer<typeof sendCodeSchema>;

export const verifyCodeSchema =z.object 
(
  {
    email: z.string().email({message: "Email con formato inválido"}),
    code: z.string().length(6, {message: "El código debe tener 6 digitos"}),

  }
);

export type VerifyCodeDto = z.infer<typeof verifyCodeSchema>;
