import jwt, {JwtPayload} from 'jsonwebtoken';
import { config } from '../config';
import { BadRequestError } from './http-error';

export interface TokenPayload extends JwtPayload {
    userId: string;
    email: string;
    [key: string]: any;
  }

export function generatetoken
(
    payload: object,
    expiresIn:string,
): string
{
    return jwt.sign(
        payload,
        config.JWT_SECRET,
        { expiresIn: expiresIn as any }  
      );

}

//verifica 

export function verifyToken (token: string):TokenPayload
{
    return jwt.verify(token, config.JWT_SECRET) as  TokenPayload;
}

//bearer token


export function getBearerToken(authHeader?: string): string {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new BadRequestError('Token no proporcionado o mal formado');
  }
  return authHeader.substring('Bearer '.length);
}