const { pool }  = require('../config/database');
const bcrypt    = require('bcryptjs');

// Listar todos los usuarios
async function listarUsuarios(req, res) {
  try {
    const [usuarios] = await pool.query(`
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
    const [existe] = await pool.query(
      'SELECT id FROM usuarios WHERE email = ?',
      [email.toLowerCase().trim()]
    );
    if (existe.length > 0) {
      return res.status(409).json({ mensaje: 'Ya existe un usuario con ese email.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
      [nombre.trim(), email.toLowerCase().trim(), hash, rol]
    );

    res.status(201).json({ mensaje: 'Usuario creado exitosamente.', id: result.insertId });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear usuario.' });
  }
}

// Activar o desactivar usuario
async function toggleUsuario(req, res) {
  const { id } = req.params;

  // No permitir desactivarse a sí mismo
  if (Number(id) === req.usuario.id) {
    return res.status(400).json({ mensaje: 'No puedes desactivar tu propia cuenta.' });
  }

  try {
    const [rows] = await pool.query('SELECT activo FROM usuarios WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }

    const nuevoEstado = !rows[0].activo;
    await pool.query('UPDATE usuarios SET activo = ? WHERE id = ?', [nuevoEstado, id]);

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
    await pool.query('UPDATE usuarios SET password = ? WHERE id = ?', [hash, id]);
    res.json({ mensaje: 'Contraseña actualizada exitosamente.' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al cambiar contraseña.' });
  }
}

// Resumen general del sistema
async function resumenSistema(req, res) {
  try {
    const [[ventas]]    = await pool.query('SELECT COUNT(*) AS total, COALESCE(SUM(total),0) AS monto FROM ventas WHERE DATE(fecha) = CURDATE()');
    const [[productos]] = await pool.query('SELECT COUNT(*) AS total FROM productos WHERE activo = TRUE');
    const [[usuarios]]  = await pool.query('SELECT COUNT(*) AS total FROM usuarios WHERE activo = TRUE');
    const [[cajaAbierta]] = await pool.query('SELECT COUNT(*) AS total FROM cajas WHERE estado = "abierta"');

    res.json({
      ventas_hoy:    ventas.total,
      monto_hoy:     ventas.monto,
      productos:     productos.total,
      usuarios:      usuarios.total,
      caja_abierta:  cajaAbierta.total > 0,
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener resumen.' });
  }
}

module.exports = { listarUsuarios, crearUsuario, toggleUsuario, cambiarPassword, resumenSistema };