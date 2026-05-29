const express = require('express');
const multer  = require('multer');
const { listar, crear, editar, eliminar, listarCategorias } = require('../controllers/productosController');
const { authMiddleware, soloAdmin } = require('../middleware/auth');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/',           authMiddleware, listar);
router.get('/categorias', authMiddleware, listarCategorias);
router.post('/',          authMiddleware, soloAdmin, upload.single('imagen'), crear);
router.put('/:id',        authMiddleware, soloAdmin, upload.single('imagen'), editar);
router.delete('/:id',     authMiddleware, soloAdmin, eliminar);

module.exports = router;