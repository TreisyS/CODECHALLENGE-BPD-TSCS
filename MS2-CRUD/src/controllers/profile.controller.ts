import { Request, Response, RequestHandler, NextFunction} from "express";
import { createProfileSchema } from "../dtos/create-profile.dto";
import { createProfile, updateProfile, softDeleteProfile, deleteProfile, reactiveProfile } from "../services/profile.service";
import { ZodError } from "zod";
import { ConflictError } from "../utils/http-errors";
import { updateProfileSchema } from "../dtos/update-profile-dto";
import { Estado } from "../types/estado.constant";
import { sendCodeSchema }         from "../dtos/send-verification.dto";
import { verifyCodeSchema }       from "../dtos/send-verification.dto";
import { sendVerificationCode, verifyCode } from "../services/verification.service";
import { AuthenticatedRequest } from '../types/express';
import { getProfileById, getProfile } from '../services/profile.service';
import { GetProfileQuery } from '../dtos/get-profile.dto';
import { Types } from 'mongoose';
import { BadRequestError, NotFoundError, InternalError } from '../utils/http-errors';

/// Function to get the profile of the authenticated user
///     >>  handleGetProfile  <<
export const handleGetProfiles = async (
    req: AuthenticatedRequest, 
    res: Response, 
    next: NextFunction
    ): Promise<void> => {
        
   try 
   {
    const validSortBy = ['firstName', 'lastName', 'email', 'createdAt', 'updatedAt'];
    const validSortOrder = ['asc', 'desc'];

    const sortBy = req.query.sortBy as GetProfileQuery['sortBy'];
    const sortOrder = (req.query.sortOrder as GetProfileQuery['sortOrder']) || 'desc';
    
    if (sortBy && !validSortBy.includes(sortBy)) 
        throw new BadRequestError(`Invalid sortBy. Valid: ${validSortBy.join(', ')}`);

    if (sortOrder && !validSortOrder.includes(sortOrder)) 
        throw new BadRequestError(`Invalid sortOrder. Valid: ${validSortOrder.join(', ')}`);


    const query: GetProfileQuery = 
    {
    search: req.query.search as string,
    estado: req.query.estado as 'activo' | 'inactivo' | 'pendiente' | undefined,
    page: parseInt(req.query.page as string, 10) || 1,
    limit: parseInt(req.query.limit as string, 10) || 10,
    sortBy,
    sortOrder
 };

const { data, total, hasNextPage, hasPrevPage } = await getProfile(query);

res.status(200).json({
    message: 'Perfiles obtenidos correctamente',
    data,
    total,
    page: query.page,
    limit: query.limit,
    hasNextPage,
    hasPrevPage
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
        catch (error: any) {
          next(error);
        }
        
        
    }
    



//CREACION DE PROFILE
export const handleCreateProfile = async (
    req: Request,
    res: Response
) =>
{
try {
  
const dto = createProfileSchema.parse(req.body);
//logica de negocio 
const {profile, token} = await createProfile(dto, 'admin');
//response
res.status(201).json({
   message: 'Perfil creado correctamente',
   data: profile,
   token: token
});
return;
}
catch (err) {
if (err instanceof ZodError) {
 res.status(400).json({errors:err.format()});
 return;
}
if(err instanceof BadRequestError)
{
    res.status(400).json({message:err.message});
    return;
}
if (err instanceof ConflictError)
{
    res.status(409).json({message: err.message});
    return;
}
const error = err as { status?: number; message: string };
res.status(error.status || 500).json({message: error.message});

 
return;
}
};

export const handleUpdateProfile:RequestHandler = async (
   req, res, next
  ) :Promise<void> => {
    try
    {
const {id} = req.params;
const dto = updateProfileSchema.parse(req.body);
const update = await updateProfile(id, dto, 'admin');
res.status(200).json({message:'Perfil actualizado correctamente', data: update});
return;
    }
    catch(err: any){
        if (err instanceof ZodError) {
            res.status(400).json({ errors: err.format() });
            return;
          }
          if (
            err instanceof BadRequestError ||
            err instanceof ConflictError ||
            err instanceof NotFoundError
          ) {
            res.status(err.status).json({ message: err.message });
            return;
          }
          next(err);
          return;
        }
  }

  //GETESTADOS

  export const handleGetEstados = (_req: Request, res: Response) => {
    const estados = Object.values(Estado);
    res.status(200).json({
      message: 'Estados obtenidos correctamente',
      data: estados,
    });
  };

//SOFTDELETE

export const handleSoftDeleteProfile: RequestHandler = 
  async (req, res, next) => {
  
    try {
      const { id } = req.params;
      const result = await softDeleteProfile(id, 'admin');
      res.status(200).json({
        message: 'Perfil marcado como eliminado',
        data: result,
      });
      return;
    } catch (err: any) {
      if (err.status) {
        res.status(err.status).json({ message: err.message });
        return;
      }
      next(err);
    }
  };

  //DELETE

  export const handleDeleteProfile: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params;
      await deleteProfile(id);
      res.sendStatus(204).json({
        message: 'Perfil eliminado'
    
      })
    
      return;
    } catch (err: any) {
        if (err instanceof NotFoundError) {
          
            res.status(err.status).json({ message: err.message });
            return;
          }
          next(err);
        }
  };

  //REACTIVAR PERFIL
export const handleReactiveProfile:RequestHandler = async(req, res, next) =>
{
  try
  {
    const {id} = req.params;
    const result = await reactiveProfile(id, 'admin');
    res.status(200).json({
      message: 'Perfil reactivado correctamente',
      data: result,
    })
    return;
  }
  catch(err: any)
  {
    if(err instanceof NotFoundError || err instanceof BadRequestError)
    {
      res.status(err.status).json({message: err.message});
      return;
    }
    next(err);
  }
};

  //SEND CODE

  export const handleSendCode: RequestHandler = async (req, res, next) => {
    try {
      const { email } = sendCodeSchema.parse(req.body);
      await sendVerificationCode(email);
      res
        .status(200)
        .json({ success: true, message: "Código enviado correctamente" });
      return; 
    } catch (err: any) {
      if (err instanceof ZodError) {
        res.status(400).json({ errors: err.format() });
        return;
      }
      next(err);
    }
  };
  

  
  //VERIFY CODE
  export const handleVerifyCode: RequestHandler = async (req, res, next) => {
    try {
      const { email, code } = verifyCodeSchema.parse(req.body);
      await verifyCode(email, code);
      res
        .status(200)
        .json({ success: true, message: "Código verificado correctamente" });
      return; 
    } catch (err: any) {
      if (err instanceof ZodError) {
        res.status(400).json({ errors: err.format() });
        return;
      }
      if (err.status) {
        res.status(err.status).json({ message: err.message });
        return;
      }
      next(err);
    }
  };
  