import axios from 'axios';
import { config } from '../config';
import { BadRequestError } from './http-errors';

const BASEURL = 'http://apilayer.net/api/validate';

interface NumVerifyError {
    code: number;
    type: string;
  }
  
  
  interface NumVerifyResponse {
    success?: boolean;
    error?: NumVerifyError;
    valid?: boolean;
    line_type?: string;
  }
  

export async function validatePhone(phone: string, countryCode:string): Promise<boolean>
{
    const {data} = await axios.get<NumVerifyResponse>(BASEURL,
        {
            params:
            {
                access_key: config.NUMVERIFY_KEY,
                number: phone,
                country_code: countryCode,
                format:1
            }
        });

        if (data.success === false && data.error)
        {
            throw new BadRequestError(data.error.type);
        }

    return data.valid === true && data.line_type === 'mobile';

}

