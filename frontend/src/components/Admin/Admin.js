import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Admin() {
  const [usuarios, setUsuarios]   = useState([]);
  const [resumen, setResumen]     = useState(null);
  const [cargando, setCargando]   = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalPass, setModalPass] = useState(null);
  const [form, setForm]           = useState({ nombre: '', email: '', password: '', rol: 'cajero' });
  const [nuevaPass, setNuevaPass] = useState('');
  const [error, setError]         = useState('');
  const [exito, setExito]         = useState('');
  const [procesando, setProcesando] = useState(false);
  const [mostrarNuevaPass, setMostrarNuevaPass] = useState(false);
  const [mostrarPass, setMostrarPass] = useState(false);

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    try {
      const [resU, resR] = await Promise.all([
        axios.get(`${API}/api/admin/usuarios`),
        axios.get(`${API}/api/admin/resumen`),
      ]);
      setUsuarios(resU.data.usuarios);
      setResumen(resR.data);
    } catch (e) {
      setError('Error al cargar datos.');
    } finally {
      setCargando(false);
    }
  }

  async function crearUsuario() {
    if (!form.nombre || !form.email || !form.password) {
      setError('Todos los campos son obligatorios.');
      return;
    }
    setProcesando(true);
    setError('');
    try {
      await axios.post(`${API}/api/admin/usuarios`, form);
      setExito('Usuario creado exitosamente.');
      setModalAbierto(false);
      setForm({ nombre: '', email: '', password: '', rol: 'cajero' });
      cargarDatos();
      setTimeout(() => setExito(''), 3000);
    } catch (e) {
      setError(e.response?.data?.mensaje || 'Error al crear usuario.');
    } finally {
      setProcesando(false);
    }
  }

  async function toggleUsuario(id) {
    try {
      await axios.patch(`${API}/api/admin/usuarios/${id}/toggle`);
      cargarDatos();
    } catch (e) {
      setError(e.response?.data?.mensaje || 'Error al actualizar usuario.');
    }
  }

  async function cambiarPassword() {
    if (!nuevaPass || nuevaPass.length < 6) {
      setError('La contraseña debe tener mínimo 6 caracteres.');
      return;
    }
    setProcesando(true);
    try {
      await axios.patch(`${API}/api/admin/usuarios/${modalPass.id}/password`, { password: nuevaPass });
      setExito('Contraseña actualizada.');
      setModalPass(null);
      setNuevaPass('');
      setTimeout(() => setExito(''), 3000);
    } catch (e) {
      setError(e.response?.data?.mensaje || 'Error al cambiar contraseña.');
    } finally {
      setProcesando(false);
    }
  }

  function formatFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  if (cargando) return <div className="admin-cargando">Cargando panel admin...</div>;

  return (
    <div className="admin-page">
      <div className="admin-contenido">

        {/* Header */}
        <div className="admin-header">
          <h1 className="admin-titulo">Panel Admin</h1>
          <button className="btn-nuevo-usuario" onClick={() => { setModalAbierto(true); setError(''); setMostrarPass(false); }}>
            + Nuevo usuario
          </button>
        </div>

        {exito && <div className="admin-exito">✅ {exito}</div>}
        {error && <div className="admin-error">⚠️ {error}</div>}

        {/* Resumen del sistema */}
        {resumen && (
          <div className="admin-stats">
            <div className="admin-stat">
              <span className="astat-icon">🛒</span>
              <span className="astat-valor">{resumen.ventas_hoy}</span>
              <span className="astat-label">Ventas hoy</span>
            </div>
            <div className="admin-stat">
              <span className="astat-icon">💰</span>
              <span className="astat-valor">${Number(resumen.monto_hoy).toLocaleString()}</span>
              <span className="astat-label">Recaudado hoy</span>
            </div>
            <div className="admin-stat">
              <span className="astat-icon">🧊</span>
              <span className="astat-valor">{resumen.productos}</span>
              <span className="astat-label">Productos activos</span>
            </div>
            <div className="admin-stat">
              <span className="astat-icon">👥</span>
              <span className="astat-valor">{resumen.usuarios}</span>
              <span className="astat-label">Usuarios activos</span>
            </div>
            <div className="admin-stat">
              <span className="astat-icon">{resumen.caja_abierta ? '🟢' : '🔴'}</span>
              <span className="astat-valor">{resumen.caja_abierta ? 'Abierta' : 'Cerrada'}</span>
              <span className="astat-label">Estado caja</span>
            </div>
          </div>
        )}

        {/* Lista de usuarios */}
        <div className="admin-seccion">
          <h2 className="admin-seccion-titulo">Usuarios del sistema</h2>
          <div className="usuarios-lista">
            {usuarios.map(u => (
              <div key={u.id} className={`usuario-card ${!u.activo ? 'inactivo' : ''}`}>
                <div className="usuario-avatar">
                  {u.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="usuario-info">
                  <p className="usuario-nombre">{u.nombre}</p>
                  <p className="usuario-email">{u.email}</p>
                  <p className="usuario-fecha">Desde {formatFecha(u.creado_en)}</p>
                </div>
                <div className="usuario-derecha">
                  <span className={`usuario-rol ${u.rol}`}>{u.rol}</span>
                  <span className={`usuario-estado ${u.activo ? 'activo' : 'inactivo'}`}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  <div className="usuario-acciones">
                    <button
                      className="btn-pass"
                      onClick={() => { setModalPass(u); setNuevaPass(''); setError(''); setMostrarNuevaPass(false); }}
                      title="Cambiar contraseña"
                    >🔑</button>
                    <button
                      className={`btn-toggle ${u.activo ? 'desactivar' : 'activar'}`}
                      onClick={() => toggleUsuario(u.id)}
                      title={u.activo ? 'Desactivar' : 'Activar'}
                    >{u.activo ? '🚫' : '✅'}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal nuevo usuario */}
      {modalAbierto && (
        <div className="modal-overlay" onClick={() => setModalAbierto(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nuevo usuario</h2>
              <button className="modal-cerrar" onClick={() => setModalAbierto(false)}>✕</button>
            </div>
            {error && <div className="modal-error">⚠️ {error}</div>}
            <div className="modal-body">
              <div className="campo">
                <label>Nombre completo *</label>
                <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Ej: Juan García" />
              </div>
              <div className="campo">
                <label>Correo electrónico *</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="juan@sativa.com" />
              </div>
              <div className="campo">
                <label>Contraseña * (mínimo 6 caracteres)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={mostrarPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    placeholder="••••••••"
                    style={{ width: '100%', paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPass(v => !v)}
                    style={{
                      position: 'absolute', right: '10px',
                      background: 'none', border: 'none',
                      cursor: 'pointer', fontSize: '16px', opacity: 0.6
                    }}
                  >
                    {mostrarPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div className="campo">
                <label>Rol</label>
                <select value={form.rol} onChange={e => setForm({...form, rol: e.target.value})}>
                  <option value="cajero">Cajero</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => setModalAbierto(false)}>Cancelar</button>
              <button className="btn-guardar" onClick={crearUsuario} disabled={procesando}>
                {procesando ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cambiar contraseña */}
      {modalPass && (
        <div className="modal-overlay" onClick={() => setModalPass(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cambiar contraseña</h2>
              <button className="modal-cerrar" onClick={() => setModalPass(null)}>✕</button>
            </div>
            {error && <div className="modal-error">⚠️ {error}</div>}
            <div className="modal-body">
              <p style={{color:'#888', fontSize:'0.9rem'}}>
                Usuario: <strong style={{color:'#fff'}}>{modalPass.nombre}</strong>
              </p>
              <div className="campo">
                <label>Nueva contraseña *</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={mostrarNuevaPass ? 'text' : 'password'}
                    value={nuevaPass}
                    onChange={e => setNuevaPass(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    style={{ width: '100%', paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarNuevaPass(v => !v)}
                    style={{
                      position: 'absolute', right: '10px',
                      background: 'none', border: 'none',
                      cursor: 'pointer', fontSize: '16px', opacity: 0.6
                    }}
                  >
                    {mostrarNuevaPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => setModalPass(null)}>Cancelar</button>
              <button className="btn-guardar" onClick={cambiarPassword} disabled={procesando}>
                {procesando ? 'Guardando...' : 'Actualizar contraseña'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}