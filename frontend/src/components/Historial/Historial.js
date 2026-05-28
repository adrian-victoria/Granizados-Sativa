import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Historial.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
export default function Historial() {
  const [ventas, setVentas]       = useState([]);
  const [resumen, setResumen]     = useState(null);
  const [cargando, setCargando]   = useState(true);
  const [error, setError]         = useState('');
  const [exito, setExito]         = useState('');
  const [fecha, setFecha]         = useState(new Date().toISOString().split('T')[0]);
  const [expandida, setExpandida] = useState(null);

  useEffect(() => { cargarDatos(); }, [fecha]);

  async function cargarDatos() {
    setCargando(true);
    try {
      const { data } = await axios.get(`${API}/api/historial?fecha=${fecha}`);
      setVentas(data.ventas);
      setResumen(data.resumen);
    } catch (e) {
      setError('Error al cargar historial.');
    } finally {
      setCargando(false);
    }
  }

  async function anular(id) {
    if (!window.confirm('¿Seguro que quieres anular esta venta? Se devolverá el stock.')) return;
    try {
      await axios.delete(`${API}/api/historial/${id}`);
      setExito('Venta anulada exitosamente.');
      cargarDatos();
      setTimeout(() => setExito(''), 3000);
    } catch (e) {
      setError(e.response?.data?.mensaje || 'Error al anular venta.');
    }
  }

  function formatPeso(n) {
    return `$${Number(n).toLocaleString('es-CO')}`;
  }

  function formatHora(fecha) {
    return new Date(fecha).toLocaleTimeString('es-CO', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  }

  if (cargando) return <div className="hist-cargando">Cargando historial...</div>;

  return (
    <div className="hist-page">
      <div className="hist-contenido">

        {/* Header */}
        <div className="hist-header">
          <h1 className="hist-titulo">Historial de Ventas</h1>
          <input
            type="date"
            className="hist-fecha"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
          />
        </div>

        {exito && <div className="hist-exito">✅ {exito}</div>}
        {error && <div className="hist-error">⚠️ {error}</div>}

        {/* Resumen del día */}
        {resumen && (
          <div className="hist-resumen">
            <div className="hist-stat">
              <span className="hs-icon">🛒</span>
              <span className="hs-valor">{resumen.total_ventas}</span>
              <span className="hs-label">Ventas</span>
            </div>
            <div className="hist-stat rojo">
              <span className="hs-icon">💰</span>
              <span className="hs-valor">{formatPeso(resumen.total_dia)}</span>
              <span className="hs-label">Total del día</span>
            </div>
            <div className="hist-stat verde">
              <span className="hs-icon">💵</span>
              <span className="hs-valor">{formatPeso(resumen.total_efectivo)}</span>
              <span className="hs-label">Efectivo</span>
            </div>
            <div className="hist-stat morado">
              <span className="hs-icon">📱</span>
              <span className="hs-valor">{formatPeso(resumen.total_transferencia)}</span>
              <span className="hs-label">Transferencia</span>
            </div>
          </div>
        )}

        {/* Lista de ventas */}
        {ventas.length === 0 ? (
          <div className="hist-vacio">
            <span>🧊</span>
            <p>No hay ventas registradas para esta fecha</p>
          </div>
        ) : (
          <div className="hist-lista">
            {ventas.map((v, i) => (
              <div key={v.id} className="hist-venta">
                <div className="hist-venta-header" onClick={() => setExpandida(expandida === v.id ? null : v.id)}>
                  <div className="hv-izq">
                    <span className="hv-num">#{ventas.length - i}</span>
                    <div>
                      <p className="hv-cajero">{v.cajero}</p>
                      <p className="hv-hora">🕐 {formatHora(v.fecha)} · {v.items.length} producto(s)</p>
                    </div>
                  </div>
                  <div className="hv-der">
                    <span className={`hv-metodo ${v.metodo_pago}`}>
                      {v.metodo_pago === 'efectivo' ? '💵' : '📱'} {v.metodo_pago}
                    </span>
                    <span className="hv-total">{formatPeso(v.total)}</span>
                    <span className="hv-chevron">{expandida === v.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Detalle expandible */}
                {expandida === v.id && (
                  <div className="hist-venta-detalle">
                    <table className="hv-tabla">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Cant.</th>
                          <th>Precio</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {v.items.map((item, j) => (
                          <tr key={j}>
                            <td>{item.nombre}</td>
                            <td>{item.cantidad}</td>
                            <td>{formatPeso(item.precio_unitario)}</td>
                            <td className="subtotal">{formatPeso(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="3" className="total-label">Total</td>
                          <td className="total-valor">{formatPeso(v.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                    <button className="btn-anular" onClick={() => anular(v.id)}>
                      🗑️ Anular venta
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}