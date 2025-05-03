import NodeCache from "node-cache";
import nodemailer from 'nodemailer';
import {config} from '../config';
import { BadRequestError } from "../utils/http-errors";
import personModel from "../models/person.model";

const cache = new NodeCache({ stdTTL:config.VERIFICATION_CODE_TTL_MINUTES * 60});
export async function sendVerificationCode(email:string): Promise<void>
{
  const emailExists = await personModel.exists({email, isDeleted:false});
  if (emailExists)
  {
    throw new BadRequestError("El correo ya está registrado");

  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  cache.set(email, code);

  const transporter = nodemailer.createTransport
(
  {
    host: config.HOSTSERVER,
    port: 465,
    secure:true,
    auth:
    {
      user:config.VERIFICATION_EMAIL_FROM,
      pass: config.VERIFICATION_EMAIL_PASS
    },
  }
);
const html = `
<div style="font-family: sans-serif; text-align:center;">
  <h2>Código de verificación: </h2>
  <p style="font-size: 1.5rem; font-weight: bold;">${code}</p>
  <p>Este código expira en ${config.VERIFICATION_CODE_TTL_MINUTES} minutos.</p>
</div>
`;
await transporter.sendMail(
  {
    from:config.VERIFICATION_EMAIL_FROM,
    to: email, 
    subject: "Código de verificación",
    html,
  }
);
}

export async function verifyCode (email:string, code:string): Promise<void>
{
  const storage = cache.get<string>(email);
  if(!storage)
  {
    throw new BadRequestError("El código ha expirado o no existe.");
  }
  if(storage !== code)
  {
    throw new BadRequestError("Código incorrecto.");
  }
  cache.del(email);
}
