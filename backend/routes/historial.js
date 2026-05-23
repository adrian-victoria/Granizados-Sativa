const express = require('express');
const { ventasDelDia, anularVenta } = require('../controllers/historialController');
const { authMiddleware, soloAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/',        authMiddleware, ventasDelDia);
router.delete('/:id',  authMiddleware, soloAdmin, anularVenta);

module.exports = router;