const express = require('express');
const multer  = require('multer');
const path    = require('path');
const { listar, crear, editar, eliminar, listarCategorias } = require('../controllers/productosController');
const { authMiddleware, soloAdmin } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `producto_${Date.now()}${path.extname(file.originalname)}`)
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/',           authMiddleware, listar);
router.get('/categorias', authMiddleware, listarCategorias);
router.post('/',          authMiddleware, soloAdmin, upload.single('imagen'), crear);
router.put('/:id',        authMiddleware, soloAdmin, upload.single('imagen'), editar);
router.delete('/:id',     authMiddleware, soloAdmin, eliminar);

module.exports = router;