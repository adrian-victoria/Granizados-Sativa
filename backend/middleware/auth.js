// middleware/auth.js
// Verifica que el token JWT sea válido antes de procesar la ruta protegida

const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticación
 * Uso: router.get('/ruta-protegida', authMiddleware, controlador)
 */
function authMiddleware(req, res, next) {
  // El token viene en el header: Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ mensaje: 'Acceso denegado. Token requerido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded; // { id, nombre, email, rol }
    next();
  } catch (error) {
    return res.status(403).json({ mensaje: 'Token inválido o expirado.' });
  }
}

/**
 * Middleware de autorización por rol
 * Uso: router.delete('/ruta-admin', authMiddleware, soloAdmin, controlador)
 */
function soloAdmin(req, res, next) {
  if (req.usuario?.rol !== 'admin') {
    return res.status(403).json({ mensaje: 'Acceso restringido a administradores.' });
  }
  next();
}

module.exports = { authMiddleware, soloAdmin };
