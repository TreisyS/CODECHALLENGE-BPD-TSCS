import { Router } from "express";

import {
  handleCreateProfile, handleUpdateProfile, handleGetEstados, handleDeleteProfile, handleSoftDeleteProfile,handleSendCode, handleVerifyCode,handleGetProfileById, handleGetProfiles,
  handleReactiveProfile
} from '../controllers/profile.controller';

import {authenticatedTokenInternal, verifyServiceKey } from "../middlewares/auth.middleware";
const router = Router();

//
 // POST /api/v1/profiles
// Crear un nuevo perfil.
// // Se protege con API Key interna 

router.post('/profiles', authenticatedTokenInternal, handleCreateProfile);


//PATCH

router.patch('/profiles/:id', authenticatedTokenInternal, handleUpdateProfile);

//GET
router.get('/profiles/estados', handleGetEstados);

//BORRADO LOGICO
router.delete ('/profiles/:id', authenticatedTokenInternal, handleSoftDeleteProfile); 
//DELETE
router.delete ('/profiles/:id/hard', authenticatedTokenInternal, handleDeleteProfile);

//ENVIAR CODIGO DE VERIFICACION DE EMAIL

router.post(
  "/profiles/enviar-codigo-verificacion",
   authenticatedTokenInternal,
   handleSendCode
);
//VERIFICAR CODIGO DE VERIFICACION DE EMAIL
router.post(
  "/profiles/verificar-codigo",
   authenticatedTokenInternal,
   handleVerifyCode
);

//REACTIVACION DE PERFIL
router.patch('/profiles/reactivate-profile/:id', authenticatedTokenInternal, handleReactiveProfile);


//COMUNICACION ENTRE LOS MS
router.get('/internal/profiles', verifyServiceKey, handleGetProfiles);
router.get('/internal/profiles/:id', verifyServiceKey, handleGetProfileById);

export default router;
