const express = require('express');
const { registrarVenta, listarVentas, detalleVenta } = require('../controllers/ventasController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/',        authMiddleware, registrarVenta);
router.get('/',         authMiddleware, listarVentas);
router.get('/:id',      authMiddleware, detalleVenta);

module.exports = router;