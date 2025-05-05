import {Request, Response, NextFunction} from 'express';
import { AuthenticatedRequest } from '../types/express';
import { getProfileById, getProfile } from '../services/profile.service';
import { GetProfileQuery } from '../dtos/get-profile.dto';
import { Types } from 'mongoose';
import { BadRequestError, NotFoundError, InternalError } from '../utils/http-error';

/// Function to get the profile of the authenticated user
///     >>  handleGetProfile  <<
export const handleGetProfiles = async (
    req: AuthenticatedRequest, 
    res: Response, 
    next: NextFunction
    ): Promise<void> => {
        
   try 
   {
   
    const query: GetProfileQuery = {
        search: req.query.search as string,
        estado: req.query.estado as any,
        page: parseInt(req.query.page as string, 10) || 1,
        limit: parseInt(req.query.limit as string, 10) || 10,
        sortBy: req.query.sortBy as any,
        sortOrder: (req.query.sortOrder as any) || 'desc',
      };
      const response = await getProfile(query);

    res.status(200).json({
      message: 'Perfiles obtenidos correctamente',
      ...response,
    });
}
catch (err: any) 
{
    next(err.status ? err : new InternalError(err.message));
}
    };

/// Function to get a profile by ID
///     >>  handleGetProfileById  <<
export const handleGetProfileById = async (
    req: Request,
    res: Response,
    next: NextFunction): Promise<void> =>
    { 
    
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) 
        return next(new BadRequestError('ID inválido'));
        try 
        {
           
            const profile = await getProfileById(id);

            if (!profile)
            {  throw new NotFoundError('Perfil no encontrado');
            }
            res.status(200).json(profile);
            
        }
        catch (err: any) {
            if (err.response?.status === 404) {
              throw new NotFoundError('Perfil no encontrado');
            }
            throw new InternalError('Error consultando MS2');
          }
    }
    
