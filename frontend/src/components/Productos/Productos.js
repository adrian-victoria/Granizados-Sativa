import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Productos.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export default function Productos() {
  const [productos, setProductos]       = useState([]);
  const [categorias, setCategorias]     = useState([]);
  const [filtro, setFiltro]             = useState('todos');
  const [cargando, setCargando]         = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm]                 = useState({
    nombre: '', descripcion: '', precio: '', categoria_id: '',
    stock: '', stock_minimo: '5', tiene_licor: 'false'
  });
  const [imagen, setImagen]   = useState(null);
  const [preview, setPreview] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError]     = useState('');
  const [exito, setExito]     = useState('');

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    try {
      const [resProd, resCat] = await Promise.all([
        axios.get(`${API}/api/productos`),
        axios.get(`${API}/api/productos/categorias`),
      ]);
      setProductos(resProd.data.productos);
      setCategorias(resCat.data.categorias);
    } catch (e) {
      setError('Error al cargar productos.');
    } finally {
      setCargando(false);
    }
  }

  function abrirModal(producto = null) {
    if (producto) {
      setForm({
        nombre:       producto.nombre,
        descripcion:  producto.descripcion || '',
        precio:       producto.precio,
        categoria_id: producto.categoria_id,
        stock:        producto.stock,
        stock_minimo: producto.stock_minimo,
        tiene_licor:  producto.tiene_licor ? 'true' : 'false',
      });
      setPreview(producto.imagen_url ? `${API}${producto.imagen_url}` : null);
      setEditandoId(producto.id);
    } else {
      setForm({ nombre: '', descripcion: '', precio: '', categoria_id: '', stock: '', stock_minimo: '5', tiene_licor: 'false' });
      setPreview(null);
      setEditandoId(null);
    }
    setImagen(null);
    setError('');
    setModalAbierto(true);
  }

  function manejarImagen(e) {
    const file = e.target.files[0];
    if (file) {
      setImagen(file);
      setPreview(URL.createObjectURL(file));
    }
  }

  async function guardar() {
    if (!form.nombre || !form.precio || !form.categoria_id) {
      setError('Nombre, precio y categoría son obligatorios.');
      return;
    }
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    if (imagen) data.append('imagen', imagen);

    try {
      if (editandoId) {
        await axios.put(`${API}/api/productos/${editandoId}`, data);
      } else {
        await axios.post(`${API}/api/productos`, data);
      }
      setExito(editandoId ? 'Producto actualizado.' : 'Producto creado.');
      setModalAbierto(false);
      cargarDatos();
      setTimeout(() => setExito(''), 3000);
    } catch (e) {
      setError(e.response?.data?.mensaje || 'Error al guardar.');
    }
  }

  async function eliminar(id) {
    if (!window.confirm('¿Desactivar este producto?')) return;
    await axios.delete(`${API}/api/productos/${id}`);
    cargarDatos();
  }

  const productosFiltrados = filtro === 'todos'
    ? productos
    : filtro === 'licor'
      ? productos.filter(p => p.tiene_licor)
      : productos.filter(p => !p.tiene_licor);

  if (cargando) return <div className="prod-cargando">Cargando productos...</div>;

  return (
    <div className="prod-page">
      <div className="prod-header">
        <div>
          <h1 className="prod-titulo">Productos</h1>
          <p className="prod-subtitulo">{productos.length} granizados disponibles</p>
        </div>
        <button className="btn-nuevo" onClick={() => abrirModal()}>+ Nuevo producto</button>
      </div>

      {exito && <div className="alerta-exito">✅ {exito}</div>}

      <div className="prod-filtros">
        {['todos', 'sin_licor', 'licor'].map(f => (
          <button
            key={f}
            className={`btn-filtro ${filtro === f ? 'activo' : ''}`}
            onClick={() => setFiltro(f)}
          >
            {f === 'todos' ? '🧊 Todos' : f === 'licor' ? '🍹 Con licor' : '❄️ Sin licor'}
          </button>
        ))}
      </div>

      <div className="prod-grid">
        {productosFiltrados.map(p => (
          <div key={p.id} className="prod-card">
            <div className="prod-img-wrap">
              {p.imagen_url
                ? <img src={`${API}${p.imagen_url}`} alt={p.nombre} className="prod-img" />
                : <div className="prod-img-placeholder">🧊</div>
              }
              {p.tiene_licor && <span className="badge-licor">🍹 Con licor</span>}
            </div>
            <div className="prod-info">
              <h3 className="prod-nombre">{p.nombre}</h3>
              {p.descripcion && <p className="prod-desc">{p.descripcion}</p>}
              <div className="prod-footer">
                <span className="prod-precio">${Number(p.precio).toLocaleString()}</span>
                <div className="prod-acciones">
                  <button className="btn-editar" onClick={() => abrirModal(p)}>✏️</button>
                  <button className="btn-eliminar" onClick={() => eliminar(p.id)}>🗑️</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal — sin cambios */}
      {modalAbierto && (
        <div className="modal-overlay" onClick={() => setModalAbierto(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editandoId ? 'Editar producto' : 'Nuevo producto'}</h2>
              <button className="modal-cerrar" onClick={() => setModalAbierto(false)}>✕</button>
            </div>

            {error && <div className="modal-error">⚠️ {error}</div>}

            <div className="modal-body">
              <div className="campo-imagen">
                <div className="img-preview" onClick={() => document.getElementById('inputImagen').click()}>
                  {preview
                    ? <img src={preview} alt="preview" />
                    : <div className="img-placeholder"><span>📷</span><p>Clic para subir imagen</p></div>
                  }
                </div>
                <input id="inputImagen" type="file" accept="image/*" onChange={manejarImagen} style={{ display: 'none' }} />
              </div>

              <div className="modal-campos">
                <div className="campo">
                  <label>Nombre *</label>
                  <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Ej: Granizado de Fresa" />
                </div>
                <div className="campo">
                  <label>Descripción</label>
                  <input value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} placeholder="Descripción opcional" />
                </div>
                <div className="campo-row">
                  <div className="campo">
                    <label>Precio *</label>
                    <input type="number" value={form.precio} onChange={e => setForm({...form, precio: e.target.value})} placeholder="0" />
                  </div>
                  <div className="campo">
                    <label>Stock</label>
                    <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} placeholder="0" />
                  </div>
                </div>
                <div className="campo">
                  <label>Categoría *</label>
                  <select value={form.categoria_id} onChange={e => setForm({...form, categoria_id: e.target.value})}>
                    <option value="">Seleccionar...</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div className="campo">
                  <label>¿Tiene licor?</label>
                  <select value={form.tiene_licor} onChange={e => setForm({...form, tiene_licor: e.target.value})}>
                    <option value="false">❄️ No tiene licor</option>
                    <option value="true">🍹 Sí tiene licor</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => setModalAbierto(false)}>Cancelar</button>
              <button className="btn-guardar" onClick={guardar}>
                {editandoId ? 'Actualizar' : 'Crear producto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}