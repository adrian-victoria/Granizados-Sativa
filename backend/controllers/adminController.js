const { pool }  = require('../config/database');
const bcrypt    = require('bcryptjs');

// Listar todos los usuarios
async function listarUsuarios(req, res) {
  try {
    const { rows: usuarios } = await pool.query(`
      SELECT id, nombre, email, rol, activo, creado_en
      FROM usuarios
      ORDER BY creado_en DESC
    `);
    res.json({ usuarios });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener usuarios.' });
  }
}

// Crear usuario cajero
async function crearUsuario(req, res) {
  const { nombre, email, password, rol = 'cajero' } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ mensaje: 'Nombre, email y contraseña son obligatorios.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ mensaje: 'La contraseña debe tener mínimo 6 caracteres.' });
  }

  try {
    const { rows: existe } = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    if (existe.length > 0) {
      return res.status(409).json({ mensaje: 'Ya existe un usuario con ese email.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING id',
      [nombre.trim(), email.toLowerCase().trim(), hash, rol]
    );

    res.status(201).json({ mensaje: 'Usuario creado exitosamente.', id: rows[0].id });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear usuario.' });
  }
}

// Activar o desactivar usuario
async function toggleUsuario(req, res) {
  const { id } = req.params;

  if (Number(id) === req.usuario.id) {
    return res.status(400).json({ mensaje: 'No puedes desactivar tu propia cuenta.' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT activo FROM usuarios WHERE id = $1',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }

    const nuevoEstado = !rows[0].activo;
    await pool.query(
      'UPDATE usuarios SET activo = $1 WHERE id = $2',
      [nuevoEstado, id]
    );

    res.json({ mensaje: `Usuario ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente.` });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar usuario.' });
  }
}

// Cambiar contraseña de un usuario
async function cambiarPassword(req, res) {
  const { id } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ mensaje: 'La contraseña debe tener mínimo 6 caracteres.' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'UPDATE usuarios SET password = $1 WHERE id = $2',
      [hash, id]
    );
    res.json({ mensaje: 'Contraseña actualizada exitosamente.' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al cambiar contraseña.' });
  }
}

// Resumen general del sistema
async function resumenSistema(req, res) {
  try {
    const { rows: [ventas] }     = await pool.query(`
      SELECT COUNT(*) AS total, COALESCE(SUM(total), 0) AS monto
      FROM ventas
      WHERE DATE(fecha) = CURRENT_DATE
    `);
    const { rows: [productos] }  = await pool.query(
      'SELECT COUNT(*) AS total FROM productos WHERE activo = TRUE'
    );
    const { rows: [usuarios] }   = await pool.query(
      'SELECT COUNT(*) AS total FROM usuarios WHERE activo = TRUE'
    );
    const { rows: [cajaAbierta] } = await pool.query(
      "SELECT COUNT(*) AS total FROM cajas WHERE estado = 'abierta'"
    );

    res.json({
      ventas_hoy:   Number(ventas.total),
      monto_hoy:    Number(ventas.monto),
      productos:    Number(productos.total),
      usuarios:     Number(usuarios.total),
      caja_abierta: Number(cajaAbierta.total) > 0,
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener resumen.' });
  }
}

module.exports = { listarUsuarios, crearUsuario, toggleUsuario, cambiarPassword, resumenSistema };