import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import './Reportes.css';

const API = 'http://localhost:4000';
const ROJO    = '#e63030';
const MORADO  = '#7c3aed';
const VERDE   = '#00c864';

export default function Reportes() {
  const [semana, setSemana]       = useState([]);
  const [mes, setMes]             = useState({ datos: [], resumen: null });
  const [top, setTop]             = useState([]);
  const [hoy, setHoy]             = useState(null);
  const [cargando, setCargando]   = useState(true);
  const [vista, setVista]         = useState('semana');

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    try {
      const [rHoy, rSemana, rMes, rTop] = await Promise.all([
        axios.get(`${API}/api/reportes/hoy`),
        axios.get(`${API}/api/reportes/semana`),
        axios.get(`${API}/api/reportes/mes`),
        axios.get(`${API}/api/reportes/top`),
      ]);
      setHoy(rHoy.data.hoy);
      setSemana(rSemana.data.datos.map(d => ({
        ...d,
        dia: new Date(d.dia).toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit' }),
        total: Number(d.total),
        efectivo: Number(d.efectivo),
        transferencia: Number(d.transferencia),
      })));
      setMes({
        datos: rMes.data.datos.map(d => ({
          ...d,
          dia: new Date(d.dia).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
          total: Number(d.total),
        })),
        resumen: rMes.data.resumen,
      });
      setTop(rTop.data.productos.map(p => ({
        ...p,
        total_vendido: Number(p.total_vendido),
        total_ingresos: Number(p.total_ingresos),
      })));
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  }

  function formatPeso(n) {
    return `$${Number(n).toLocaleString('es-CO')}`;
  }

  const pieData = hoy ? [
    { name: 'Efectivo',      value: Number(hoy.efectivo) },
    { name: 'Transferencia', value: Number(hoy.transferencia) },
  ] : [];

  if (cargando) return <div className="rep-cargando">Cargando reportes...</div>;

  return (
    <div className="rep-page">
      <div className="rep-contenido">

        {/* Header */}
        <div className="rep-header">
          <h1 className="rep-titulo">Reportes</h1>
          <div className="rep-tabs">
            {['semana', 'mes', 'top'].map(v => (
              <button
                key={v}
                className={`rep-tab ${vista === v ? 'activo' : ''}`}
                onClick={() => setVista(v)}
              >
                {v === 'semana' ? '📅 Esta semana' : v === 'mes' ? '🗓️ Este mes' : '🏆 Más vendidos'}
              </button>
            ))}
          </div>
        </div>

        {/* Cards resumen de hoy */}
        {hoy && (
          <div className="rep-cards">
            <div className="rep-card">
              <span className="rep-card-icon">🛒</span>
              <span className="rep-card-valor">{hoy.ventas}</span>
              <span className="rep-card-label">Ventas hoy</span>
            </div>
            <div className="rep-card rojo">
              <span className="rep-card-icon">💰</span>
              <span className="rep-card-valor">{formatPeso(hoy.total)}</span>
              <span className="rep-card-label">Total hoy</span>
            </div>
            <div className="rep-card verde">
              <span className="rep-card-icon">💵</span>
              <span className="rep-card-valor">{formatPeso(hoy.efectivo)}</span>
              <span className="rep-card-label">Efectivo</span>
            </div>
            <div className="rep-card morado">
              <span className="rep-card-icon">📱</span>
              <span className="rep-card-valor">{formatPeso(hoy.transferencia)}</span>
              <span className="rep-card-label">Transferencia</span>
            </div>
          </div>
        )}

        {/* Vista semana */}
        {vista === 'semana' && (
          <div className="rep-seccion">
            <h2 className="rep-seccion-titulo">Ventas últimos 7 días</h2>

            {semana.length === 0 ? (
              <div className="rep-vacio">No hay ventas registradas esta semana</div>
            ) : (
              <>
                <div className="rep-grafica">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={semana} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="dia" tick={{ fill: '#666', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#666', fontSize: 12 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
                        labelStyle={{ color: '#fff' }}
                        formatter={v => formatPeso(v)}
                      />
                      <Bar dataKey="efectivo"      name="Efectivo"      fill={VERDE}  radius={[4,4,0,0]} />
                      <Bar dataKey="transferencia" name="Transferencia" fill={MORADO} radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Tabla semana */}
                <div className="rep-tabla">
                  <div className="rep-tabla-header">
                    <span>Día</span>
                    <span>Ventas</span>
                    <span>Efectivo</span>
                    <span>Transferencia</span>
                    <span>Total</span>
                  </div>
                  {semana.map((d, i) => (
                    <div key={i} className="rep-tabla-fila">
                      <span>{d.dia}</span>
                      <span>{d.num_ventas}</span>
                      <span className="verde">{formatPeso(d.efectivo)}</span>
                      <span className="morado">{formatPeso(d.transferencia)}</span>
                      <span className="blanco">{formatPeso(d.total)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Vista mes */}
        {vista === 'mes' && (
          <div className="rep-seccion">
            <h2 className="rep-seccion-titulo">Ventas del mes</h2>

            {mes.resumen && (
              <div className="rep-resumen-mes">
                <div className="rm-item">
                  <span className="rm-label">Total del mes</span>
                  <span className="rm-valor rojo">{formatPeso(mes.resumen.total_monto)}</span>
                </div>
                <div className="rm-item">
                  <span className="rm-label">Número de ventas</span>
                  <span className="rm-valor">{mes.resumen.total_ventas}</span>
                </div>
                <div className="rm-item">
                  <span className="rm-label">Promedio por venta</span>
                  <span className="rm-valor">{formatPeso(mes.resumen.promedio_venta)}</span>
                </div>
                <div className="rm-item">
                  <span className="rm-label">Efectivo</span>
                  <span className="rm-valor verde">{formatPeso(mes.resumen.efectivo)}</span>
                </div>
                <div className="rm-item">
                  <span className="rm-label">Transferencia</span>
                  <span className="rm-valor morado">{formatPeso(mes.resumen.transferencia)}</span>
                </div>
              </div>
            )}

            {mes.datos.length === 0 ? (
              <div className="rep-vacio">No hay ventas registradas este mes</div>
            ) : (
              <div className="rep-grafica">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mes.datos} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="dia" tick={{ fill: '#666', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#666', fontSize: 12 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
                      labelStyle={{ color: '#fff' }}
                      formatter={v => formatPeso(v)}
                    />
                    <Line type="monotone" dataKey="total" name="Total" stroke={ROJO} strokeWidth={2} dot={{ fill: ROJO, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Gráfica de torta métodos de pago */}
            {hoy && (Number(hoy.efectivo) > 0 || Number(hoy.transferencia) > 0) && (
              <div className="rep-pie-wrap">
                <h3 className="rep-pie-titulo">Métodos de pago (hoy)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name, percent}) => `${name} ${(percent*100).toFixed(0)}%`}>
                      <Cell fill={VERDE} />
                      <Cell fill={MORADO} />
                    </Pie>
                    <Tooltip formatter={v => formatPeso(v)} contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Vista top productos */}
        {vista === 'top' && (
          <div className="rep-seccion">
            <h2 className="rep-seccion-titulo">Productos más vendidos (últimos 30 días)</h2>
            {top.length === 0 ? (
              <div className="rep-vacio">No hay ventas registradas aún</div>
            ) : (
              <>
                <div className="rep-grafica">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={top.slice(0,7)} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis type="number" tick={{ fill: '#666', fontSize: 11 }} />
                      <YAxis type="category" dataKey="nombre" tick={{ fill: '#ccc', fontSize: 11 }} width={160} />
                      <Tooltip
                        contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
                        formatter={v => [`${v} unidades`, 'Vendidos']}
                      />
                      <Bar dataKey="total_vendido" name="Unidades vendidas" fill={ROJO} radius={[0,4,4,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="rep-tabla">
                  <div className="rep-tabla-header">
                    <span>#</span>
                    <span>Producto</span>
                    <span>Unidades</span>
                    <span>Ingresos</span>
                  </div>
                  {top.map((p, i) => (
                    <div key={i} className="rep-tabla-fila">
                      <span className={`rep-rank ${i < 3 ? 'top' : ''}`}>{i + 1}</span>
                      <span>{p.nombre}</span>
                      <span className="blanco">{p.total_vendido}</span>
                      <span className="rojo">{formatPeso(p.total_ingresos)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}