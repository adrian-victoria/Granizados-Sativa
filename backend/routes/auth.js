const express = require('express');
const { login, registro, perfil } = require('../controllers/authController');
const { authMiddleware, soloAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/login',    login);
router.get('/perfil',    authMiddleware, perfil);
router.post('/registro', authMiddleware, soloAdmin, registro);

module.exports = router;