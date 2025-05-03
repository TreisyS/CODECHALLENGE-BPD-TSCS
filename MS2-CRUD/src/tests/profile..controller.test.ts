import { Request, Response } from 'express';
import { ZodError, ZodIssue, ZodIssueCode } from 'zod';
import { createProfileSchema } from '../dtos/create-profile.dto';
import { handleCreateProfile, handleReactiveProfile } from '../controllers/profile.controller';
import { NotFoundError } from '../utils/http-errors';
import * as service from '../services/profile.service';
import * as phoneUtils from '../utils/phone-utils';
import { BadRequestError, ConflictError } from '../utils/http-errors';
import { handleUpdateProfile } from '../controllers/profile.controller';



describe('handleCreateProfile controller', () => {
  let req: Partial<Request>;
  let res: Response;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;
    jest.restoreAllMocks();
    jest.spyOn(phoneUtils, 'validatePhone').mockResolvedValue(true); 

  });
  it('returns 400 if DTO parsing fails', async () => {
    // Construimos un ZodIssue válido
    const fakeIssue: ZodIssue = {
      code: ZodIssueCode.custom,      // tipo de error cualquiera
      path: ['email'],                // campo que "falla"
      message: 'Invalid email',       // mensaje
    };
    // Hacemos que parse() lance el ZodError con el issue
    jest
      .spyOn(createProfileSchema, 'parse')
      .mockImplementation(() => { throw new ZodError([fakeIssue]); });
  
    await handleCreateProfile(req as Request, res);
  
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ errors: expect.any(Object) });
  });
  it('returns 400 if service throws BadRequestError', async () => {
    const validDto = { firstName: 'A', lastName: 'B', cellphone: '+123', email: 'a@b.com', address: 'X' };
    req.body = validDto;
    jest.spyOn(phoneUtils, 'validatePhone').mockResolvedValue(true);
    jest.spyOn(createProfileSchema, 'parse').mockReturnValue(validDto as any);
    jest.spyOn(service, 'createProfile').mockRejectedValueOnce(new BadRequestError('Bad email'));

    await handleCreateProfile(req as Request, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Bad email' });
  });

  it('returns 409 if service throws ConflictError', async () => {
    const validDto = { firstName: 'A', lastName: 'B', cellphone: '+123', email: 'a@b.com', address: 'X' };
    req.body = validDto;
    jest.spyOn(createProfileSchema, 'parse').mockReturnValue(validDto as any);
    jest.spyOn(service, 'createProfile').mockRejectedValueOnce(new ConflictError('Email exists'));

    await handleCreateProfile(req as Request, res);
    expect(res.status).toHaveBeenCalledWith(409); 
    expect(res.json).toHaveBeenCalledWith({ message: 'Email exists' });
  });

  it('returns 201 and payload on success', async () => {
    const validDto = { firstName: 'A', lastName: 'B', cellphone: '+123', email: 'a@b.com', address: 'X' };
    const fakeResult = { profile: { foo: 'bar' }, token: 'tok' };
    req.body = validDto;
    jest.spyOn(createProfileSchema, 'parse').mockReturnValue(validDto as any);
    jest.spyOn(service, 'createProfile').mockResolvedValueOnce(fakeResult as any);

    await handleCreateProfile(req as Request, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Perfil creado correctamente',
      data: fakeResult.profile,
      token: fakeResult.token
    });
    
  });
});

describe('handleReactiveProfile controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = { params: { id: '123' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.restoreAllMocks();
    jest.spyOn(phoneUtils, 'validatePhone').mockResolvedValue(true); // ✅ <<--- AGREGA ESTA LÍNEA

  });

  it('returns 200 and data on success', async () => {
    const mockResult = { id: '123', estado: 'activo' };
    jest.spyOn(service, 'reactiveProfile').mockResolvedValueOnce(mockResult);
    jest.spyOn(phoneUtils, 'validatePhone').mockResolvedValue(true);
    await handleReactiveProfile(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Perfil reactivado correctamente',
      data: mockResult
    });
  });
  jest.spyOn(phoneUtils, 'validatePhone').mockResolvedValue(true);
  it('returns 404 if profile not found', async () => {
    const error = new NotFoundError('Perfil no encontrado');
    jest.spyOn(service, 'reactiveProfile').mockRejectedValueOnce(error);

    await handleReactiveProfile(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Perfil no encontrado' });
  });

  it('returns 400 if profile already active', async () => {
    const error = new BadRequestError('El perfil ya está activo');
    jest.spyOn(service, 'reactiveProfile').mockRejectedValueOnce(error);

    await handleReactiveProfile(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'El perfil ya está activo' });
  });

  it('calls next on unhandled error', async () => {
    const error = new Error('Unhandled');
    jest.spyOn(service, 'reactiveProfile').mockRejectedValueOnce(error);
    jest.spyOn(phoneUtils, 'validatePhone').mockResolvedValue(true);
    await handleReactiveProfile(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});


describe('handleUpdateProfile controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      params: { id: '123' },
      body: {
        firstName: 'Updated',
        email: 'updated@example.com'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.restoreAllMocks();
    jest.spyOn(phoneUtils, 'validatePhone').mockResolvedValue(true); 

  });
  it('should return 200 and updated data', async () => {
    const mockData = { profile: { firstName: 'Updated' } };
    jest.spyOn(service, 'updateProfile').mockResolvedValue(mockData as any);

    await handleUpdateProfile(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Perfil actualizado correctamente',
      data: mockData
    });
  });

  it('should return 409 if conflict', async () => {
    jest.spyOn(service, 'updateProfile').mockRejectedValue(new ConflictError('El email ya existe'));

    await handleUpdateProfile(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: 'El email ya existe' });
  });

  it('should return 400 if bad data', async () => {
    jest.spyOn(service, 'updateProfile').mockRejectedValue(new BadRequestError('Email inválido'));

    await handleUpdateProfile(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Email inválido' });
  });

  it('should call next on unknown errors', async () => {
    const err = new Error('unknown');
    jest.spyOn(service, 'updateProfile').mockRejectedValue(err);

    await handleUpdateProfile(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});
