const express = require('express');
const { ventasSemana, ventasMes, productosTop, resumenHoy } = require('../controllers/reportesController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/hoy',      authMiddleware, resumenHoy);
router.get('/semana',   authMiddleware, ventasSemana);
router.get('/mes',      authMiddleware, ventasMes);
router.get('/top',      authMiddleware, productosTop);

module.exports = router;