const { pool } = require('../config/database');
const path = require('path');
const fs = require('fs');

async function listar(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, c.nombre AS categoria
      FROM productos p
      JOIN categorias c ON p.categoria_id = c.id
      WHERE p.activo = TRUE
      ORDER BY c.nombre, p.nombre
    `);
    res.json({ productos: rows });
  } catch (error) {
    console.error('[PRODUCTOS ERROR]', error);
    res.status(500).json({ mensaje: 'Error al obtener productos.' });
  }
}

async function crear(req, res) {
  const { nombre, descripcion, precio, categoria_id, stock, stock_minimo, tiene_licor } = req.body;
  if (!nombre || !precio || !categoria_id) {
    return res.status(400).json({ mensaje: 'Nombre, precio y categoría son obligatorios.' });
  }
  const imagen_url = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const { rows } = await pool.query(
      `INSERT INTO productos (nombre, descripcion, precio, categoria_id, stock, stock_minimo, tiene_licor, imagen_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [nombre, descripcion || null, precio, categoria_id, stock || 0, stock_minimo || 5, tiene_licor === 'true', imagen_url]
    );
    res.status(201).json({ mensaje: 'Producto creado.', id: rows[0].id });
  } catch (error) {
    console.error('[CREAR ERROR]', error);
    res.status(500).json({ mensaje: 'Error al crear producto.' });
  }
}

async function editar(req, res) {
  const { id } = req.params;
  const { nombre, descripcion, precio, categoria_id, stock, stock_minimo, tiene_licor } = req.body;
  const imagen_url = req.file ? `/uploads/${req.file.filename}` : undefined;
  try {
    const campos = [];
    const valores = [];
    let i = 1; // contador de placeholders para PostgreSQL

    if (nombre)                     { campos.push(`nombre = $${i++}`);       valores.push(nombre); }
    if (descripcion)                { campos.push(`descripcion = $${i++}`);  valores.push(descripcion); }
    if (precio)                     { campos.push(`precio = $${i++}`);       valores.push(precio); }
    if (categoria_id)               { campos.push(`categoria_id = $${i++}`); valores.push(categoria_id); }
    if (stock !== undefined)        { campos.push(`stock = $${i++}`);        valores.push(stock); }
    if (stock_minimo !== undefined) { campos.push(`stock_minimo = $${i++}`); valores.push(stock_minimo); }
    if (tiene_licor !== undefined)  { campos.push(`tiene_licor = $${i++}`);  valores.push(tiene_licor === 'true'); }
    if (imagen_url)                 { campos.push(`imagen_url = $${i++}`);   valores.push(imagen_url); }

    valores.push(id); // el id va al final como $i
    await pool.query(
      `UPDATE productos SET ${campos.join(', ')} WHERE id = $${i}`,
      valores
    );
    res.json({ mensaje: 'Producto actualizado.' });
  } catch (error) {
    console.error('[EDITAR ERROR]', error);
    res.status(500).json({ mensaje: 'Error al editar producto.' });
  }
}

async function eliminar(req, res) {
  try {
    await pool.query('UPDATE productos SET activo = FALSE WHERE id = $1', [req.params.id]);
    res.json({ mensaje: 'Producto desactivado.' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar producto.' });
  }
}

async function listarCategorias(req, res) {
  try {
    const { rows } = await pool.query('SELECT * FROM categorias ORDER BY nombre');
    res.json({ categorias: rows });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener categorías.' });
  }
}

module.exports = { listar, crear, editar, eliminar, listarCategorias };