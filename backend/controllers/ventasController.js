const { pool } = require('../config/database');

// Registrar una venta completa
async function registrarVenta(req, res) {
  const { items, metodo_pago, caja_id } = req.body;
  const usuario_id = req.usuario.id;

  if (!items || items.length === 0) {
    return res.status(400).json({ mensaje: 'La venta debe tener al menos un producto.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Calcular total
    const total = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    // Buscar caja abierta si no viene
    let cajaId = caja_id;
    if (!cajaId) {
      const { rows: cajas } = await client.query(
        "SELECT id FROM cajas WHERE usuario_id = $1 AND estado = 'abierta' ORDER BY fecha_apertura DESC LIMIT 1",
        [usuario_id]
      );
      if (cajas.length > 0) {
        cajaId = cajas[0].id;
      } else {
        // Crear caja automáticamente si no hay una abierta
        const { rows: nuevaCaja } = await client.query(
          "INSERT INTO cajas (usuario_id, monto_inicial, estado) VALUES ($1, 0, 'abierta') RETURNING id",
          [usuario_id]
        );
        cajaId = nuevaCaja[0].id;
      }
    }

    // Insertar venta
    const { rows: ventaRows } = await client.query(
      'INSERT INTO ventas (caja_id, usuario_id, total, metodo_pago) VALUES ($1, $2, $3, $4) RETURNING id',
      [cajaId, usuario_id, total, metodo_pago]
    );

    const ventaId = ventaRows[0].id;

    // Insertar detalle de cada producto
    for (const item of items) {
      await client.query(
        'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES ($1, $2, $3, $4, $5)',
        [ventaId, item.producto_id, item.cantidad, item.precio, item.precio * item.cantidad]
      );

      // Descontar stock
      await client.query(
        'UPDATE productos SET stock = stock - $1 WHERE id = $2',
        [item.cantidad, item.producto_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ mensaje: 'Venta registrada exitosamente.', ventaId, total });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[VENTA ERROR]', error);
    res.status(500).json({ mensaje: 'Error al registrar la venta.' });
  } finally {
    client.release();
  }
}

// Listar ventas del día
async function listarVentas(req, res) {
  try {
    const { rows: ventas } = await pool.query(`
      SELECT v.*, u.nombre AS cajero,
             COUNT(d.id) AS total_items
      FROM ventas v
      JOIN usuarios u ON v.usuario_id = u.id
      LEFT JOIN detalle_ventas d ON v.id = d.venta_id
      WHERE DATE(v.fecha) = CURRENT_DATE
      GROUP BY v.id, u.nombre
      ORDER BY v.fecha DESC
    `);

    const total_dia = ventas.reduce((sum, v) => sum + Number(v.total), 0);
    res.json({ ventas, total_dia });
  } catch (error) {
    console.error('[LISTAR VENTAS ERROR]', error);
    res.status(500).json({ mensaje: 'Error al obtener ventas.' });
  }
}

// Detalle de una venta
async function detalleVenta(req, res) {
  try {
    const { rows: items } = await pool.query(`
      SELECT d.*, p.nombre AS producto
      FROM detalle_ventas d
      JOIN productos p ON d.producto_id = p.id
      WHERE d.venta_id = $1
    `, [req.params.id]);
    res.json({ items });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener detalle.' });
  }
}

module.exports = { registrarVenta, listarVentas, detalleVenta };