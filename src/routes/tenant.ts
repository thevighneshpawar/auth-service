import express, { Request, Response, NextFunction } from 'express'
import { TenantController } from '../controller/TenantController'
import { TenantService } from '../services/TenantService'
import { AppDataSource } from '../config/data-source'
import { Tenant } from '../entity/Tenant'
import logger from '../config/logger'
import authenticate from '../middleware/authenticate'
import { canAccess } from '../middleware/canAccess'
import { Roles } from '../constants'
const router = express.Router()
const tenantRepository = AppDataSource.getRepository(Tenant)
const tenantService = new TenantService(tenantRepository)
const tenantController = new TenantController(tenantService, logger)

router.post('/', authenticate, canAccess([Roles.ADMIN]), (req, res, next) =>
    tenantController.create(req, res, next),
)

export default router
