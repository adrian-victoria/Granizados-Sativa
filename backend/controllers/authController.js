// controllers/authController.js
// Lógica de negocio para autenticación de usuarios

const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const { pool }  = require('../config/database');

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
async function login(req, res) {
  const { email, password } = req.body;

  // 1. Validar que vienen los campos
  if (!email || !password) {
    return res.status(400).json({ mensaje: 'Email y contraseña son obligatorios.' });
  }

  try {
    // 2. Buscar usuario activo por email
    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE email = ? AND activo = TRUE',
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
    }

    const usuario = rows[0];

    // 3. Comparar la contraseña con el hash guardado
    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
    }

    // 4. Generar token JWT con 8 horas de vigencia
    const payload = {
      id:     usuario.id,
      nombre: usuario.nombre,
      email:  usuario.email,
      rol:    usuario.rol,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    // 5. Responder con token y datos del usuario (sin la contraseña)
    res.json({
      mensaje: 'Inicio de sesión exitoso.',
      token,
      usuario: {
        id:     usuario.id,
        nombre: usuario.nombre,
        email:  usuario.email,
        rol:    usuario.rol,
      },
    });

  } catch (error) {
    console.error('[LOGIN ERROR]', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
}

/**
 * POST /api/auth/registro
 * Body: { nombre, email, password, rol }
 * Solo administradores pueden crear usuarios
 */
async function registro(req, res) {
  const { nombre, email, password, rol = 'cajero' } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ mensaje: 'Nombre, email y contraseña son obligatorios.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ mensaje: 'La contraseña debe tener mínimo 6 caracteres.' });
  }

  try {
    // Verificar que el email no exista
    const [existe] = await pool.query(
      'SELECT id FROM usuarios WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (existe.length > 0) {
      return res.status(409).json({ mensaje: 'Ya existe un usuario con ese email.' });
    }

    // Hashear la contraseña (10 rondas de salt)
    const hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
      [nombre.trim(), email.toLowerCase().trim(), hash, rol]
    );

    res.status(201).json({
      mensaje: 'Usuario creado exitosamente.',
      usuarioId: result.insertId,
    });

  } catch (error) {
    console.error('[REGISTRO ERROR]', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
}

/**
 * GET /api/auth/perfil
 * Devuelve los datos del usuario autenticado
 */
async function perfil(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, email, rol, creado_en FROM usuarios WHERE id = ?',
      [req.usuario.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }

    res.json({ usuario: rows[0] });
  } catch (error) {
    console.error('[PERFIL ERROR]', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
}

module.exports = { login, registro, perfil };
