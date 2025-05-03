import { Resolver } from "node:dns/promises";

const dns = new Resolver();

//Esto devuelve true si el dominio del email tiene al menos un registro MX
// y devuelve false si no tiene
// o si el dominio no existe

export async function isValidEmail(email:string): Promise<boolean>
{
    const [, domain] = email.split('@');
    if (!domain) {
        return false;
    }
    try {
        const records = await dns.resolveMx(domain);
        return records.length > 0;
    } catch (error) {
        return false;
    }
    
}