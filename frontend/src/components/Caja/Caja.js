import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Caja.css';

const API = 'http://localhost:4000';

export default function Caja() {
  const [estado, setEstado]         = useState(null);
  const [historial, setHistorial]   = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [montoInicial, setMontoInicial] = useState('');
  const [montoFinal, setMontoFinal] = useState('');
  const [notas, setNotas]           = useState('');
  const [procesando, setProcesando] = useState(false);
  const [exito, setExito]           = useState('');
  const [error, setError]           = useState('');
  const [confirmarCierre, setConfirmarCierre] = useState(false);

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    try {
      const [resEstado, resHistorial] = await Promise.all([
        axios.get(`${API}/api/caja`),
        axios.get(`${API}/api/caja/historial`),
      ]);
      setEstado(resEstado.data);
      setHistorial(resHistorial.data.cajas);
    } catch (e) {
      setError('Error al cargar datos de caja.');
    } finally {
      setCargando(false);
    }
  }

  async function abrir() {
    setProcesando(true);
    setError('');
    try {
      await axios.post(`${API}/api/caja/abrir`, {
        monto_inicial: Number(montoInicial) || 0
      });
      setExito('¡Caja abierta exitosamente!');
      setMontoInicial('');
      cargarDatos();
      setTimeout(() => setExito(''), 3000);
    } catch (e) {
      setError(e.response?.data?.mensaje || 'Error al abrir caja.');
    } finally {
      setProcesando(false);
    }
  }

  async function cerrar() {
    setProcesando(true);
    setError('');
    try {
      await axios.post(`${API}/api/caja/cerrar`, {
        monto_final: Number(montoFinal) || 0,
        notas
      });
      setExito('¡Caja cerrada exitosamente!');
      setMontoFinal('');
      setNotas('');
      setConfirmarCierre(false);
      cargarDatos();
      setTimeout(() => setExito(''), 3000);
    } catch (e) {
      setError(e.response?.data?.mensaje || 'Error al cerrar caja.');
    } finally {
      setProcesando(false);
    }
  }

  function formatPeso(n) {
    return `$${Number(n).toLocaleString('es-CO')}`;
  }

  function formatHora(fecha) {
    return new Date(fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }

  function formatFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  if (cargando) return <div className="caja-cargando">Cargando caja...</div>;

  return (
    <div className="caja-page">
      <div className="caja-contenido">

        {/* Header */}
        <div className="caja-header">
          <h1 className="caja-titulo">Caja Diaria</h1>
          <div className={`caja-estado-badge ${estado?.abierta ? 'abierta' : 'cerrada'}`}>
            {estado?.abierta ? '🟢 Caja Abierta' : '🔴 Caja Cerrada'}
          </div>
        </div>

        {exito && <div className="caja-exito">✅ {exito}</div>}
        {error && <div className="caja-error">⚠️ {error}</div>}

        {/* Caja abierta — resumen */}
        {estado?.abierta && (
          <div className="caja-resumen">
            <div className="caja-info">
              <p className="caja-cajero">Abierta por: <strong>{estado.caja.cajero}</strong></p>
              <p className="caja-hora">Desde las {formatHora(estado.caja.fecha_apertura)}</p>
              <p className="caja-base">Base inicial: <strong>{formatPeso(estado.caja.monto_inicial)}</strong></p>
            </div>

            <div className="caja-stats">
              <div className="caja-stat">
                <span className="stat-label">Total ventas</span>
                <span className="stat-valor">{formatPeso(estado.resumen.total_efectivo)}</span>
              </div>
              <div className="caja-stat">
                <span className="stat-label">Efectivo</span>
                <span className="stat-valor verde">{formatPeso(estado.resumen.efectivo)}</span>
              </div>
              <div className="caja-stat">
                <span className="stat-label">Transferencia</span>
                <span className="stat-valor morado">{formatPeso(estado.resumen.transferencia)}</span>
              </div>
              <div className="caja-stat">
                <span className="stat-label">Nº ventas</span>
                <span className="stat-valor">{estado.resumen.total_ventas}</span>
              </div>
            </div>

            <div className="caja-total-grande">
              <span>En caja ahora</span>
              <strong>{formatPeso(Number(estado.caja.monto_inicial) + Number(estado.resumen.efectivo))}</strong>
            </div>

            {/* Cerrar caja */}
            {!confirmarCierre ? (
              <button className="btn-cerrar-caja" onClick={() => setConfirmarCierre(true)}>
                🔒 Cerrar Caja
              </button>
            ) : (
              <div className="cierre-form">
                <h3>Confirmar cierre de caja</h3>
                <div className="campo">
                  <label>Dinero contado en caja</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={montoFinal}
                    onChange={e => setMontoFinal(e.target.value)}
                  />
                </div>
                <div className="campo">
                  <label>Notas del cierre (opcional)</label>
                  <textarea
                    placeholder="Ej: Todo cuadra, sin novedad..."
                    value={notas}
                    onChange={e => setNotas(e.target.value)}
                    rows={3}
                  />
                </div>
                {montoFinal && (
                  <div className={`diferencia ${Number(montoFinal) >= Number(estado.caja.monto_inicial) + Number(estado.resumen.efectivo) ? 'positiva' : 'negativa'}`}>
                    Diferencia: {formatPeso(Number(montoFinal) - Number(estado.caja.monto_inicial) - Number(estado.resumen.efectivo))}
                  </div>
                )}
                <div className="cierre-botones">
                  <button className="btn-cancelar" onClick={() => setConfirmarCierre(false)}>Cancelar</button>
                  <button className="btn-confirmar-cierre" onClick={cerrar} disabled={procesando}>
                    {procesando ? 'Cerrando...' : 'Confirmar cierre'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Caja cerrada — abrir */}
        {!estado?.abierta && (
          <div className="caja-abrir">
            <div className="caja-abrir-icon">💰</div>
            <h2>No hay caja abierta</h2>
            <p>Abre la caja para comenzar a registrar ventas</p>
            <div className="campo">
              <label>Dinero inicial en caja</label>
              <input
                type="number"
                placeholder="Ej: 50000"
                value={montoInicial}
                onChange={e => setMontoInicial(e.target.value)}
              />
            </div>
            <button className="btn-abrir-caja" onClick={abrir} disabled={procesando}>
              {procesando ? 'Abriendo...' : '🟢 Abrir Caja'}
            </button>
          </div>
        )}

        {/* Historial */}
        {historial.length > 0 && (
          <div className="caja-historial">
            <h2 className="historial-titulo">Historial de Cajas</h2>
            <div className="historial-lista">
              {historial.map(c => (
                <div key={c.id} className="historial-item">
                  <div className="historial-fecha">
                    <span className={`historial-dot ${c.estado === 'abierta' ? 'abierta' : 'cerrada'}`} />
                    <div>
                      <p className="h-fecha">{formatFecha(c.fecha_apertura)}</p>
                      <p className="h-cajero">{c.cajero}</p>
                    </div>
                  </div>
                  <div className="historial-datos">
                    <span className="h-ventas">{c.num_ventas} ventas</span>
                    <span className="h-total">{formatPeso(c.total_ventas)}</span>
                    <span className={`h-estado ${c.estado}`}>{c.estado}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}