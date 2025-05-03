import { Router } from "express";

import { handleGetProfileById, handleGetProfiles} from "../controllers/profile.controller";
const router = Router();
import {verifyServiceKey } from '../middlewares/auth.middleware';



//Comunicacion MSERVICIOS
router.use('/internal', verifyServiceKey);
router.get('/internal/profiles', handleGetProfiles);
router.get('/internal/profiles/:id', handleGetProfileById);
export default router;