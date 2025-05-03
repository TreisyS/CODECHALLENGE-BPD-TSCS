

import personModel, {IPerson} from '../models/person.model';
import { CreateProfileDto } from '../dtos/create-profile.dto';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/http-errors';
import {isValidEmail} from '../utils/email-utils';
import { generateToken } from "../utils/jwt";
import { validatePhone } from '../utils/phone-utils';
import { UpdateProfileDto } from '../dtos/update-profile-dto';
import { Types } from 'mongoose';
import { GetProfileQuery } from '../dtos/get-profile.dto';

/// Function to get the profile of the authenticated user
///     >>  getProfile  <<
export const getProfile = async (
query: GetProfileQuery
): Promise<{ data: IPerson[]; total: number, hasNextPage: boolean, hasPrevPage: boolean}> =>
{
const {search, estado, page = 1, limit = 10, sortBy = 'createdAt', sortOrder ='desc'} = query;

const safePage = Math.max(page, 1); // Page must be at least 1
const safeLimit = Math.max(Math.min(limit, 100), 1); // Limit between 1 and 100

const filters: any = { isDeleted: false };

if (estado) filters.estado = estado;

if (search)
{
    filters. $or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { cellphone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
    ];
}

//sortBy
const sortOptions = ['firstName', 'lastName', 'email', 'createdAt', 'updatedAt'];   
const safeSortBy = sortOptions.includes(sortBy) ? sortBy : 'createdAt';
//order
const sortDirection = sortOrder === 'asc' ? 1 : -1;


const total = await personModel.countDocuments(filters);

const data = await personModel
.find(filters)
.skip((page - 1) * safeLimit)
.sort({ [safeSortBy]: sortDirection })
.limit(safeLimit)
.lean();

return { data, total, hasNextPage: safePage * safeLimit < total, hasPrevPage: page > 1 };
}

/// Function to get a profile by ID
///     >>  getProfileById  <<
export const getProfileById = async (id: string): Promise<IPerson | null> => {
    const person = await personModel.findOne({ _id: id, isDeleted: false })
    .lean<IPerson>();
    return person;  
};
// Function to create a new profile 
//     >>  createProfile  <<
// new profile is created using the data from the request body
// jwt token is generated and returned along with the profile data

export interface CreateProfileResult
{
    profile: Omit<IPerson, '_id' | 'deletedAt' | 'isDeleted' | 'createdBy' | 'updatedBy'>;
    token: string
}

export async function createProfile
(
    dto: CreateProfileDto,
    createBy: string
): Promise<CreateProfileResult> 
{
    const email = dto.email.toLowerCase().trim();
    const telefono = dto.cellphone.trim();
    if (!(await isValidEmail(email)))
    {
        throw new BadRequestError('El email no es válido');
    }
    // Create a new user in the database
    const duplicateUser = await personModel
    .exists({ email: email, isDeleted: false})

    if (duplicateUser) {
       throw new ConflictError('El email ya existe');   
    }
    if (!(await validatePhone(telefono, dto.countryCode)))
    {
        throw new BadRequestError('El télefono no es válido o no es móvil');
    }

try
   {
    
const savedPersonDoc = await personModel.create(
    {
    ...dto,
    email,
    createdBy: createBy,
    updatedBy: createBy,
    updatedAt: new Date()
    });
      // Generate a JWT token for the new user (postcondicion)
     
  const token = generateToken({userId: savedPersonDoc._id, email: savedPersonDoc.email}, '1h');
      const profile = savedPersonDoc.toObject() as Omit<IPerson, '_id' | 'deletedAt' | 'isDeleted' | 'createdBy' | 'updatedBy'>;
      return {profile, token};
    }
    catch (error:any) {
     
    if (error.code === 11000 && error.keyPattern?.email)
         {
        throw new ConflictError('El email ya existe');
      }
      
        throw error;
    }

}

//UPDATEPROFILE

export interface UpdateProfileResult
{
    profile: Omit<IPerson, '_id' | 'deletedAt' | 'isDeleted' | 'createdBy' | 'updatedBy'>;

}

export async function updateProfile(id:string, dto:UpdateProfileDto, updatedBy:string):Promise <UpdateProfileResult>
{
    if(dto.email)
    {
        const email = dto.email.toLowerCase().trim();
        if (!(await isValidEmail(email))) {
          throw new BadRequestError('El email no es válido');
        }
        const exists = await personModel.exists({ email, isDeleted: false, _id: { $ne: id } });
        if (exists) {
          throw new ConflictError('El email ya existe');
        }
        dto.email=email;
    }
    if (dto.cellphone) {
        const ok = await validatePhone(dto.cellphone.trim(), dto.countryCode ?? '');
        if (!ok) {
          throw new BadRequestError('El teléfono no es válido o no es móvil');
        }
      }
      
      const update = await personModel.findByIdAndUpdate(
       {
        _id: id, isDeleted: false
       },
       {
        ...dto,
        updatedBy,
        updatedAt: new Date()

       },
       {
        new:true, runValidators:true, context:'query'
       }
      ).lean();

      if(!update)
     {
throw new NotFoundError('Perfil no encontrado');
      }
      return {
        profile: update as Omit<
          IPerson,
          '_id' | 'deletedAt' | 'isDeleted' | 'createdBy' | 'updatedBy'
        >,
      };
}

//SOFTDELETE

export interface SoftDeleteResult
{
    id:string;
    deletedAt:Date;
    estado: 'inactivo';
}
export async function softDeleteProfile
(
    id: string,
    deletedBy: string
): Promise <SoftDeleteResult>
{
if (!Types.ObjectId.isValid(id))
{
    throw new NotFoundError('Id Invalido');

}
const profile = await personModel.findOneAndUpdate({_id: id, isDeleted:false},
    {
        isDeleted:true,
        deletedAt: new Date(),
        updatedBy:deletedBy,
        updatedAt: new Date(),
        estado:'inactivo'
    },
    {
        new: true, projection: { _id: 1, deletedAt: 1, estado: 1 }
    }) as { _id: Types.ObjectId; deletedAt: Date; estado: string } | null;

    if (!profile) {
        throw new NotFoundError('Perfil no encontrado o ya eliminado');
      }
    
      return {
        id: profile!._id.toString(),
        deletedAt: profile.deletedAt!,   
        estado: 'inactivo'
      };
}
//REACTIVE PROFILE

export async function reactiveProfile (id: string, updatedBy: string):Promise<{ id: string; estado: string }> 
{
  if (!Types.ObjectId.isValid(id))
  {
    throw new NotFoundError('ID inválido');
  }

const profile = await personModel.findOneAndUpdate(
  {  _id: id, isDeleted: true},

  {
    isDeleted:false,
    deletedAt:null,
    estado:'activo',
    updatedBy:updatedBy, 
    updatedAt: new Date()
  },
  {
    new:true,
    projection: {_id: 1, estado: 1}
  }
);
if(!profile) throw new NotFoundError('Perfil no encontrado o no esta eliminado');

if(profile.estado === 'activo')
  throw new BadRequestError('El perfil ya está activo');
return {
  id: (profile as { _id: Types.ObjectId })._id.toString(),
  estado: 'activo'
};

}

//BORRADO COMPLETO

export async function deleteProfile(id: string): Promise<void> {
 
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundError('ID inválido');
    }
  
    const result = await personModel.findOneAndDelete({ _id: id, isDeleted: false });
  
    if (!result) {
      throw new NotFoundError('Perfil no encontrado o ya eliminado');
    }

  }
