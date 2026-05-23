const { pool } = require('../config/database');

// Ventas del día con detalle de productos
async function ventasDelDia(req, res) {
  try {
    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];

    const [ventas] = await pool.query(`
      SELECT v.id, v.total, v.metodo_pago, v.fecha, u.nombre AS cajero
      FROM ventas v
      JOIN usuarios u ON v.usuario_id = u.id
      WHERE DATE(v.fecha) = ?
      ORDER BY v.fecha DESC
    `, [fecha]);

    // Para cada venta obtener sus productos
    const ventasConDetalle = await Promise.all(ventas.map(async (venta) => {
      const [items] = await pool.query(`
        SELECT d.cantidad, d.precio_unitario, d.subtotal, p.nombre
        FROM detalle_ventas d
        JOIN productos p ON d.producto_id = p.id
        WHERE d.venta_id = ?
      `, [venta.id]);
      return { ...venta, items };
    }));

    const total_dia = ventas.reduce((s, v) => s + Number(v.total), 0);
    const total_efectivo = ventas.filter(v => v.metodo_pago === 'efectivo').reduce((s, v) => s + Number(v.total), 0);
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
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Recuperar items para devolver stock
    const [items] = await connection.query(
      'SELECT producto_id, cantidad FROM detalle_ventas WHERE venta_id = ?', [id]
    );

    for (const item of items) {
      await connection.query(
        'UPDATE productos SET stock = stock + ? WHERE id = ?',
        [item.cantidad, item.producto_id]
      );
    }

    // Eliminar detalle y venta
    await connection.query('DELETE FROM detalle_ventas WHERE venta_id = ?', [id]);
    await connection.query('DELETE FROM ventas WHERE id = ?', [id]);

    await connection.commit();
    res.json({ mensaje: 'Venta anulada exitosamente.' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ mensaje: 'Error al anular venta.' });
  } finally {
    connection.release();
  }
}

module.exports = { ventasDelDia, anularVenta };