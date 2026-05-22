import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Ventas.css';

const API = 'https://granizados-sativa-production.up.railway.app';

export default function Ventas() {
  const [productos, setProductos]     = useState([]);
  const [carrito, setCarrito]         = useState([]);
  const [metodoPago, setMetodoPago]   = useState('efectivo');
  const [ventas, setVentas]           = useState([]);
  const [totalDia, setTotalDia]       = useState(0);
  const [cargando, setCargando]       = useState(true);
  const [procesando, setProcesando]   = useState(false);
  const [exito, setExito]             = useState('');
  const [error, setError]             = useState('');
  const [busqueda, setBusqueda]       = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todos');
  const [categorias, setCategorias]   = useState([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      const [resProd, resCat, resVentas] = await Promise.all([
        axios.get(`${API}/api/productos`),
        axios.get(`${API}/api/productos/categorias`),
        axios.get(`${API}/api/ventas`),
      ]);
      setProductos(resProd.data.productos);
      setCategorias(resCat.data.categorias);
      setVentas(resVentas.data.ventas);
      setTotalDia(resVentas.data.total_dia);
    } catch (e) {
      setError('Error al cargar datos.');
    } finally {
      setCargando(false);
    }
  }

  function agregarAlCarrito(producto) {
    setCarrito(prev => {
      const existe = prev.find(i => i.producto_id === producto.id);
      if (existe) {
        return prev.map(i =>
          i.producto_id === producto.id
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        );
      }
      return [...prev, {
        producto_id: producto.id,
        nombre:      producto.nombre,
        precio:      Number(producto.precio),
        cantidad:    1,
        imagen_url:  producto.imagen_url,
      }];
    });
  }

  function cambiarCantidad(producto_id, delta) {
    setCarrito(prev =>
      prev.map(i => i.producto_id === producto_id
        ? { ...i, cantidad: Math.max(1, i.cantidad + delta) }
        : i
      )
    );
  }

  function quitarDelCarrito(producto_id) {
    setCarrito(prev => prev.filter(i => i.producto_id !== producto_id));
  }

  const totalCarrito = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);

  async function cobrar() {
    if (carrito.length === 0) return;
    setProcesando(true);
    setError('');
    try {
      await axios.post(`${API}/api/ventas`, {
        items:       carrito,
        metodo_pago: metodoPago,
      });
      setExito(`¡Venta de $${totalCarrito.toLocaleString()} registrada! 🎉`);
      setCarrito([]);
      cargarDatos();
      setTimeout(() => setExito(''), 4000);
    } catch (e) {
      setError(e.response?.data?.mensaje || 'Error al registrar venta.');
    } finally {
      setProcesando(false);
    }
  }

  const productosFiltrados = productos.filter(p => {
    const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = categoriaFiltro === 'todos' || p.categoria_id === Number(categoriaFiltro);
    return coincideBusqueda && coincideCategoria;
  });

  if (cargando) return <div className="v-cargando">Cargando...</div>;

  return (
    <div className="v-page">
      {/* Panel izquierdo — productos */}
      <div className="v-izquierda">
        <div className="v-header">
          <h1 className="v-titulo">Nueva Venta</h1>
          <div className="v-total-dia">
            Total del día: <strong>${Number(totalDia).toLocaleString()}</strong>
          </div>
        </div>

        {/* Búsqueda y filtros */}
        <div className="v-filtros">
          <input
            className="v-busqueda"
            placeholder="🔍 Buscar producto..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <div className="v-cats">
            <button
              className={`v-cat ${categoriaFiltro === 'todos' ? 'activo' : ''}`}
              onClick={() => setCategoriaFiltro('todos')}
            >Todos</button>
            {categorias.map(c => (
              <button
                key={c.id}
                className={`v-cat ${categoriaFiltro === c.id ? 'activo' : ''}`}
                onClick={() => setCategoriaFiltro(c.id)}
              >{c.nombre}</button>
            ))}
          </div>
        </div>

        {/* Grid de productos */}
        <div className="v-grid">
          {productosFiltrados.map(p => (
            <div key={p.id} className="v-prod" onClick={() => agregarAlCarrito(p)}>
              <div className="v-prod-img">
                {p.imagen_url
                  ? <img src={`${API}${p.imagen_url}`} alt={p.nombre} />
                  : <span>🧊</span>
                }
              </div>
              <div className="v-prod-info">
                <p className="v-prod-nombre">{p.nombre}</p>
                <p className="v-prod-precio">${Number(p.precio).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho — carrito */}
      <div className="v-derecha">
        <h2 className="v-carrito-titulo">🛒 Carrito</h2>

        {exito && <div className="v-exito">{exito}</div>}
        {error && <div className="v-error">⚠️ {error}</div>}

        {carrito.length === 0 ? (
          <div className="v-carrito-vacio">
            <span>🧊</span>
            <p>Toca un producto para agregarlo</p>
          </div>
        ) : (
          <>
            <div className="v-items">
              {carrito.map(item => (
                <div key={item.producto_id} className="v-item">
                  <div className="v-item-info">
                    <p className="v-item-nombre">{item.nombre}</p>
                    <p className="v-item-subtotal">
                      ${(item.precio * item.cantidad).toLocaleString()}
                    </p>
                  </div>
                  <div className="v-item-controles">
                    <button onClick={() => cambiarCantidad(item.producto_id, -1)}>−</button>
                    <span>{item.cantidad}</span>
                    <button onClick={() => cambiarCantidad(item.producto_id, +1)}>+</button>
                    <button className="v-quitar" onClick={() => quitarDelCarrito(item.producto_id)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total y pago */}
            <div className="v-resumen">
              <div className="v-total">
                <span>Total</span>
                <strong>${totalCarrito.toLocaleString()}</strong>
              </div>

              <div className="v-metodo">
                <button
                  className={`v-metodo-btn ${metodoPago === 'efectivo' ? 'activo' : ''}`}
                  onClick={() => setMetodoPago('efectivo')}
                >💵 Efectivo</button>
                <button
                  className={`v-metodo-btn ${metodoPago === 'transferencia' ? 'activo' : ''}`}
                  onClick={() => setMetodoPago('transferencia')}
                >📱 Transferencia</button>
              </div>

              <button
                className={`v-cobrar ${procesando ? 'procesando' : ''}`}
                onClick={cobrar}
                disabled={procesando}
              >
                {procesando ? 'Registrando...' : `Cobrar $${totalCarrito.toLocaleString()}`}
              </button>

              <button className="v-limpiar" onClick={() => setCarrito([])}>
                Limpiar carrito
              </button>
            </div>
          </>
        )}

        {/* Últimas ventas del día */}
        {ventas.length > 0 && (
          <div className="v-historial">
            <h3 className="v-historial-titulo">Ventas de hoy</h3>
            {ventas.slice(0, 5).map(v => (
              <div key={v.id} className="v-historial-item">
                <div>
                  <p className="v-h-cajero">{v.cajero}</p>
                  <p className="v-h-hora">
                    {new Date(v.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    {' · '}{v.metodo_pago}
                  </p>
                </div>
                <p className="v-h-total">${Number(v.total).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}