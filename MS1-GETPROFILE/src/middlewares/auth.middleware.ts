import { NextFunction,  Response, Request } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { config } from '../config';


export function authenticatedTokenInternal
(   req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void
{
    const auth = req.headers.authorization as string | undefined;
if (!auth || !auth.startsWith('Basic'))
{
    res.status(401).json({message: 'Datos no proporcionados'});
    return;
}

//decodificacion
const b64 = auth.split(' ')[1];
const [user, pass] = Buffer
.from(b64, 'base64')
.toString()
.split(':', 2);

if(user !== config.INTERNAL_USER|| pass !== config.INTERNAL_PASS)
 {
console.warn('Credenciales no proporcionada o inválida'); 
res.status(401).json({ message: 'Credenciales no proporcionada o inválida' });
return;
}
next();
}

//Comunicacion Microservicios
//Verificar key

export const verifyServiceKey = (req: Request, res: Response, next: NextFunction) : void =>
    {
        const serviceKey = req.headers['mservice-key'] as string;
        const expectedKey = config.API_KEY_SECRET;
    
        if(!serviceKey || serviceKey !== expectedKey)
        {
             res.status(403).json({
                message: 'No autorizado: key invalida o inexistente'});
                return;
        }
       next();
       
    };
    