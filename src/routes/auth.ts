import express from 'express'
import { AuthController } from '../controller/AuthController'

const router = express.Router()
const authController = new AuthController()
router.post('/register', (req, res) => authController.register(req, res))

export default router
