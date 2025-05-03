
import personModel from '../models/person.model';
import {
  createProfile,
  updateProfile,
  softDeleteProfile,
  reactiveProfile
} from '../services/profile.service';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/http-errors';
import * as emailUtils from '../utils/email-utils';
import * as phoneUtils from '../utils/phone-utils';

jest.mock('../models/person.model');

describe('profile.service.ts', () => {
  const validId = '64fc531f84b17a5a3b9c7c0a';
  const dto = {
    firstName: 'John',
    lastName: 'Doe',
    cellphone: '+1234567890',
    email: 'john@example.com',
    address: '123 Main St',
    countryCode: 'US'
  };
  const updatedBy = 'admin';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(emailUtils, 'isValidEmail').mockResolvedValue(true);
    jest.spyOn(phoneUtils, 'validatePhone').mockResolvedValue(true);
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  describe('createProfile', () => {
    it('should throw BadRequestError if email is invalid', async () => {
      jest.spyOn(emailUtils, 'isValidEmail').mockResolvedValue(false);
      await expect(createProfile(dto, updatedBy)).rejects.toBeInstanceOf(BadRequestError);
    });

    it('should throw ConflictError if email already exists', async () => {
      jest.spyOn(personModel, 'exists').mockResolvedValue(true as any);
      await expect(createProfile(dto, updatedBy)).rejects.toBeInstanceOf(ConflictError);
    });

    it('should create profile and return token', async () => {
      jest.spyOn(personModel, 'exists').mockResolvedValue(false as any);
      const mockDoc = {
        _id: validId,
        email: dto.email,
        toObject: () => ({ foo: 'bar' })
      };
      jest.spyOn(personModel, 'create').mockResolvedValue(mockDoc as any);

      const result = await createProfile(dto, updatedBy);
      expect(result.profile).toEqual({ foo: 'bar' });
      expect(typeof result.token).toBe('string'); // No verificación con JWT real
    });

    it('should handle Mongo duplicate key error as ConflictError', async () => {
      jest.spyOn(personModel, 'exists').mockResolvedValue(false as any);
      const dupErr: any = new Error();
      dupErr.code = 11000;
      dupErr.keyPattern = { email: 1 };
      jest.spyOn(personModel, 'create').mockRejectedValueOnce(dupErr);

      await expect(createProfile(dto, updatedBy)).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const updateDto = { email: 'new@example.com' };
      jest.spyOn(emailUtils, 'isValidEmail').mockResolvedValue(true);
      jest.spyOn(personModel, 'exists').mockResolvedValue(false as any);
      jest.spyOn(personModel, 'findByIdAndUpdate').mockReturnValue({
        lean: () => ({ email: 'new@example.com' })
      } as any);

      const result = await updateProfile(validId, updateDto, updatedBy);
      expect(result.profile).toHaveProperty('email', 'new@example.com');
    });

    it('should throw NotFoundError if profile does not exist', async () => {
      jest.spyOn(personModel, 'findByIdAndUpdate').mockReturnValue({
        lean: () => null
      } as any);
      await expect(updateProfile(validId, {}, updatedBy)).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('softDeleteProfile', () => {
    it('should soft delete a profile', async () => {
      jest.spyOn(personModel, 'findOneAndUpdate').mockResolvedValue({
        _id: validId,
        deletedAt: new Date(),
        estado: 'inactivo'
      } as any);

      const result = await softDeleteProfile(validId, updatedBy);
      expect(result.estado).toBe('inactivo');
    });

    it('should throw NotFoundError if profile not found', async () => {
      jest.spyOn(personModel, 'findOneAndUpdate').mockResolvedValue(null);
      await expect(softDeleteProfile(validId, updatedBy)).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('reactiveProfile', () => {
    it('should reactivate a logically deleted profile', async () => {
      jest.spyOn(personModel, 'findOneAndUpdate').mockResolvedValue({
        _id: validId,
        estado: 'pendiente'
      } as any);

      const result = await reactiveProfile(validId, updatedBy);
      expect(result.estado).toBe('activo');
    });

    it('should throw NotFoundError if profile not found', async () => {
      jest.spyOn(personModel, 'findOneAndUpdate').mockResolvedValue(null);
      await expect(reactiveProfile(validId, updatedBy)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('should throw BadRequestError if profile is already active', async () => {
      const profile = {
        _id: validId,
        estado: 'activo'
      };
      jest.spyOn(personModel, 'findOneAndUpdate').mockResolvedValue(profile as any);
      await expect(reactiveProfile(validId, updatedBy)).rejects.toBeInstanceOf(BadRequestError);
    });
  });
});
