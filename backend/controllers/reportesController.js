const { pool } = require('../config/database');

// Ventas de los últimos 7 días
async function ventasSemana(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT 
        DATE(fecha) AS dia,
        COUNT(*) AS num_ventas,
        COALESCE(SUM(total), 0) AS total,
        COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END), 0) AS efectivo,
        COALESCE(SUM(CASE WHEN metodo_pago = 'transferencia' THEN total ELSE 0 END), 0) AS transferencia
      FROM ventas
      WHERE fecha >= CURRENT_DATE - INTERVAL '6 days'
      GROUP BY DATE(fecha)
      ORDER BY dia ASC
    `);
    res.json({ datos: rows });
  } catch (error) {
    console.error('[REPORTES ERROR]', error);
    res.status(500).json({ mensaje: 'Error al obtener reporte semanal.' });
  }
}

// Ventas del mes actual
async function ventasMes(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT 
        DATE(fecha) AS dia,
        COUNT(*) AS num_ventas,
        COALESCE(SUM(total), 0) AS total
      FROM ventas
      WHERE EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM fecha)  = EXTRACT(YEAR FROM CURRENT_DATE)
      GROUP BY DATE(fecha)
      ORDER BY dia ASC
    `);

    const { rows: resumenRows } = await pool.query(`
      SELECT 
        COUNT(*) AS total_ventas,
        COALESCE(SUM(total), 0) AS total_monto,
        COALESCE(AVG(total), 0) AS promedio_venta,
        COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END), 0) AS efectivo,
        COALESCE(SUM(CASE WHEN metodo_pago = 'transferencia' THEN total ELSE 0 END), 0) AS transferencia
      FROM ventas
      WHERE EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM fecha)  = EXTRACT(YEAR FROM CURRENT_DATE)
    `);

    res.json({ datos: rows, resumen: resumenRows[0] });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener reporte mensual.' });
  }
}

// Productos más vendidos
async function productosTop(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT 
        p.nombre,
        p.precio,
        SUM(d.cantidad) AS total_vendido,
        SUM(d.subtotal) AS total_ingresos
      FROM detalle_ventas d
      JOIN productos p ON d.producto_id = p.id
      JOIN ventas v ON d.venta_id = v.id
      WHERE v.fecha >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY p.id, p.nombre, p.precio
      ORDER BY total_vendido DESC
      LIMIT 10
    `);
    res.json({ productos: rows });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener productos top.' });
  }
}

// Resumen de hoy
async function resumenHoy(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT 
        COUNT(*) AS ventas,
        COALESCE(SUM(total), 0) AS total,
        COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END), 0) AS efectivo,
        COALESCE(SUM(CASE WHEN metodo_pago = 'transferencia' THEN total ELSE 0 END), 0) AS transferencia,
        COALESCE(AVG(total), 0) AS promedio
      FROM ventas
      WHERE DATE(fecha) = CURRENT_DATE
    `);
    res.json({ hoy: rows[0] });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener resumen de hoy.' });
  }
}

module.exports = { ventasSemana, ventasMes, productosTop, resumenHoy };