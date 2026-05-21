const express = require('express');
const { estadoCaja, abrirCaja, cerrarCaja, historial } = require('../controllers/cajaController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/',         authMiddleware, estadoCaja);
router.post('/abrir',   authMiddleware, abrirCaja);
router.post('/cerrar',  authMiddleware, cerrarCaja);
router.get('/historial',authMiddleware, historial);

module.exports = router;