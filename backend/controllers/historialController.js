const { pool } = require('../config/database');

// Ventas del día con detalle de productos
async function ventasDelDia(req, res) {
  try {
    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];

    const { rows: ventas } = await pool.query(`
      SELECT v.id, v.total, v.metodo_pago, v.fecha, u.nombre AS cajero
      FROM ventas v
      JOIN usuarios u ON v.usuario_id = u.id
      WHERE DATE(v.fecha) = $1
      ORDER BY v.fecha DESC
    `, [fecha]);

    // Para cada venta obtener sus productos
    const ventasConDetalle = await Promise.all(ventas.map(async (venta) => {
      const { rows: items } = await pool.query(`
        SELECT d.cantidad, d.precio_unitario, d.subtotal, p.nombre
        FROM detalle_ventas d
        JOIN productos p ON d.producto_id = p.id
        WHERE d.venta_id = $1
      `, [venta.id]);
      return { ...venta, items };
    }));

    const total_dia          = ventas.reduce((s, v) => s + Number(v.total), 0);
    const total_efectivo     = ventas.filter(v => v.metodo_pago === 'efectivo').reduce((s, v) => s + Number(v.total), 0);
    const total_transferencia = ventas.filter(v => v.metodo_pago === 'transferencia').reduce((s, v) => s + Number(v.total), 0);

    res.json({
      ventas: ventasConDetalle,
      resumen: {
        total_ventas: ventas.length,
        total_dia,
        total_efectivo,
        total_transferencia,
      }
    });
  } catch (error) {
    console.error('[HISTORIAL ERROR]', error);
    res.status(500).json({ mensaje: 'Error al obtener historial.' });
  }
}

// Anular una venta
async function anularVenta(req, res) {
  const { id } = req.params;
  // En PostgreSQL se usa client en lugar de connection
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Recuperar items para devolver stock
    const { rows: items } = await client.query(
      'SELECT producto_id, cantidad FROM detalle_ventas WHERE venta_id = $1', [id]
    );

    for (const item of items) {
      await client.query(
        'UPDATE productos SET stock = stock + $1 WHERE id = $2',
        [item.cantidad, item.producto_id]
      );
    }

    // Eliminar detalle y venta
    await client.query('DELETE FROM detalle_ventas WHERE venta_id = $1', [id]);
    await client.query('DELETE FROM ventas WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ mensaje: 'Venta anulada exitosamente.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[ANULAR VENTA ERROR]', error);
    res.status(500).json({ mensaje: 'Error al anular venta.' });
  } finally {
    client.release(); // siempre devolver al pool
  }
}

module.exports = { ventasDelDia, anularVenta };