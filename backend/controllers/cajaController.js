const { pool } = require('../config/database');

// Verificar si hay caja abierta
async function estadoCaja(req, res) {
  try {
    const { rows: cajas } = await pool.query(`
      SELECT c.*, u.nombre AS cajero
      FROM cajas c
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.estado = 'abierta'
      ORDER BY c.fecha_apertura DESC
      LIMIT 1
    `);

    if (cajas.length === 0) {
      return res.json({ abierta: false, caja: null });
    }

    const { rows: totales } = await pool.query(`
      SELECT 
        COUNT(*) AS total_ventas,
        COALESCE(SUM(total), 0) AS total_efectivo,
        COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END), 0) AS efectivo,
        COALESCE(SUM(CASE WHEN metodo_pago = 'transferencia' THEN total ELSE 0 END), 0) AS transferencia
      FROM ventas
      WHERE caja_id = $1
    `, [cajas[0].id]);

    res.json({
      abierta: true,
      caja: cajas[0],
      resumen: {
        ...totales[0],
        total_ventas:   Number(totales[0].total_ventas),
        total_efectivo: Number(totales[0].total_efectivo),
        efectivo:       Number(totales[0].efectivo),
        transferencia:  Number(totales[0].transferencia),
      }
    });
  } catch (error) {
    console.error('[CAJA ERROR]', error);
    res.status(500).json({ mensaje: 'Error al obtener estado de caja.' });
  }
}

// Abrir caja
async function abrirCaja(req, res) {
  const { monto_inicial } = req.body;
  const usuario_id = req.usuario.id;

  try {
    const { rows: cajas } = await pool.query(
      "SELECT id FROM cajas WHERE estado = 'abierta' LIMIT 1"
    );

    if (cajas.length > 0) {
      return res.status(400).json({ mensaje: 'Ya hay una caja abierta.' });
    }

    const { rows } = await pool.query(
      "INSERT INTO cajas (usuario_id, monto_inicial, estado) VALUES ($1, $2, 'abierta') RETURNING id",
      [usuario_id, monto_inicial || 0]
    );

    res.status(201).json({
      mensaje: 'Caja abierta exitosamente.',
      cajaId: rows[0].id
    });
  } catch (error) {
    console.error('[ABRIR CAJA ERROR]', error);
    res.status(500).json({ mensaje: 'Error al abrir caja.' });
  }
}

// Cerrar caja
async function cerrarCaja(req, res) {
  const { monto_final, notas } = req.body;

  try {
    const { rows: cajas } = await pool.query(
      "SELECT id FROM cajas WHERE estado = 'abierta' LIMIT 1"
    );

    if (cajas.length === 0) {
      return res.status(400).json({ mensaje: 'No hay caja abierta.' });
    }

    await pool.query(
      `UPDATE cajas 
       SET estado = 'cerrada', fecha_cierre = NOW(), monto_final = $1, notas = $2
       WHERE id = $3`,
      [monto_final || 0, notas || null, cajas[0].id]
    );

    res.json({ mensaje: 'Caja cerrada exitosamente.' });
  } catch (error) {
    console.error('[CERRAR CAJA ERROR]', error);
    res.status(500).json({ mensaje: 'Error al cerrar caja.' });
  }
}

// Historial de cajas
async function historial(req, res) {
  try {
    const { rows: cajas } = await pool.query(`
      SELECT c.*, u.nombre AS cajero,
        COALESCE((SELECT SUM(total) FROM ventas WHERE caja_id = c.id), 0) AS total_ventas,
        COALESCE((SELECT COUNT(*) FROM ventas WHERE caja_id = c.id), 0) AS num_ventas
      FROM cajas c
      JOIN usuarios u ON c.usuario_id = u.id
      ORDER BY c.fecha_apertura DESC
      LIMIT 30
    `);
    res.json({ cajas });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener historial.' });
  }
}

module.exports = { estadoCaja, abrirCaja, cerrarCaja, historial };