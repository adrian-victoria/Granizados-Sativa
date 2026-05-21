const express = require('express');
const { listarUsuarios, crearUsuario, toggleUsuario, cambiarPassword, resumenSistema } = require('../controllers/adminController');
const { authMiddleware, soloAdmin } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren ser admin
router.get('/resumen',              authMiddleware, soloAdmin, resumenSistema);
router.get('/usuarios',             authMiddleware, soloAdmin, listarUsuarios);
router.post('/usuarios',            authMiddleware, soloAdmin, crearUsuario);
router.patch('/usuarios/:id/toggle',authMiddleware, soloAdmin, toggleUsuario);
router.patch('/usuarios/:id/password', authMiddleware, soloAdmin, cambiarPassword);

module.exports = router;