// src/tests/profile.controller.test.ts
import { Request, Response, NextFunction } from 'express'
import { Types } from 'mongoose'
import { handleGetProfiles, handleGetProfileById } from '../controllers/profile.controller'
import * as service from '../services/profile.service'
import { BadRequestError, NotFoundError, InternalError } from '../utils/http-error'

describe('Profile Controller', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: NextFunction

  beforeEach(() => {
    req = {}
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
    next = jest.fn()
  })

  describe('handleGetProfiles', () => {
    it('should return 200 and the list', async () => {
      const fakeResponse = {
        data: [{ firstName: 'A' }],
        total: 1,
        hasNextPage: false,
        hasPrevPage: false,
      }
      jest.spyOn(service, 'getProfile').mockResolvedValue(fakeResponse)

      req.query = { search: 'x', estado: 'activo', page: '2', limit: '5', sortBy: 'firstName', sortOrder: 'asc' }

      await handleGetProfiles(req as any, res as any, next)

      expect(service.getProfile).toHaveBeenCalledWith({
        search: 'x',
        estado: 'activo',
        page: 2,
        limit: 5,
        sortBy: 'firstName',
        sortOrder: 'asc',
      })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Perfiles obtenidos correctamente',
        ...fakeResponse,
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should call next with InternalError on service throw', async () => {
      const err = new Error('boom')
      jest.spyOn(service, 'getProfile').mockRejectedValue(err)

      req.query = {}

      await handleGetProfiles(req as any, res as any, next)

      expect(next).toHaveBeenCalledWith(expect.any(InternalError))
    })
  })

  describe('handleGetProfileById', () => {
    it('should return 400 if id is invalid', async () => {
      req.params = { id: 'not-an-objectid' }
      await handleGetProfileById(req as any, res as any, next)
      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError))
      expect(res.status).not.toHaveBeenCalled()
    })

    it('should return 200 and profile if found', async () => {
      const fakeProfile = { firstName: 'A' }
      jest.spyOn(service, 'getProfileById').mockResolvedValue(fakeProfile as any)

      const validId = new Types.ObjectId().toHexString()
      req.params = { id: validId }

      await handleGetProfileById(req as any, res as any, next)

      expect(service.getProfileById).toHaveBeenCalledWith(validId)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(fakeProfile)
      expect(next).not.toHaveBeenCalled()
    })

    it('should call next with NotFoundError if not found', async () => {
      jest.spyOn(service, 'getProfileById').mockResolvedValue(null as any)

      const validId = new Types.ObjectId().toHexString()
      req.params = { id: validId }

      await handleGetProfileById(req as any, res as any, next)

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError))
    })

    it('should call next with InternalError on service throw', async () => {
      const err = new Error('service fail')
      jest.spyOn(service, 'getProfileById').mockRejectedValue(err)

      const validId = new Types.ObjectId().toHexString()
      req.params = { id: validId }

      await handleGetProfileById(req as any, res as any, next)

      expect(next).toHaveBeenCalledWith(expect.any(InternalError))
    })
  })
})
