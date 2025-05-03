import jwt from 'jsonwebtoken';
import {config } from '../config';

export function generateToken (payload: object, expiresIn: '1h')
{
    return jwt.sign(payload, config.JWT_SECRET, {expiresIn});
}