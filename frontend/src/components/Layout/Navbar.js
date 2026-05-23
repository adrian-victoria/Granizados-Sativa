import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { usuario, cerrarSesion } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [abierto, setAbierto] = useState(false);

  const links = [
    { path: '/ventas',    label: 'Ventas',    icon: '🛒' },
    { path: '/historial', label: 'Historial', icon: '📋' },
    { path: '/productos', label: 'Productos', icon: '🧊' },
    { path: '/caja',      label: 'Caja',      icon: '💰' },
    { path: '/reportes',  label: 'Reportes',  icon: '📊' },
    { path: '/admin',     label: 'Admin',     icon: '⚙️' }
  ];

  function salir() {
    cerrarSesion();
    navigate('/login');
  }

  return (
    <>
      {/* Barra superior */}
      <nav className="navbar">
        <div className="navbar-logo" onClick={() => navigate('/ventas')}>
          <img src="/logo.png" alt="Sativa" className="navbar-img" />
          <span className="navbar-marca">SATIVA</span>
        </div>

        {/* Links escritorio */}
        <div className="navbar-links">
          {links.map(l => (
            <button
              key={l.path}
              className={`navbar-link ${location.pathname === l.path ? 'activo' : ''}`}
              onClick={() => navigate(l.path)}
            >
              <span>{l.icon}</span> {l.label}
            </button>
          ))}
        </div>

        {/* Usuario */}
        <div className="navbar-usuario">
          <span className="navbar-nombre">{usuario?.nombre}</span>
          <span className="navbar-rol">{usuario?.rol}</span>
          <button className="navbar-salir" onClick={salir}>Salir</button>
        </div>

        {/* Botón menú móvil */}
        <button className="navbar-hamburger" onClick={() => setAbierto(!abierto)}>
          {abierto ? '✕' : '☰'}
        </button>
      </nav>

      {/* Menú móvil */}
      {abierto && (
        <div className="navbar-movil">
          {links.map(l => (
            <button
              key={l.path}
              className={`navbar-movil-link ${location.pathname === l.path ? 'activo' : ''}`}
              onClick={() => { navigate(l.path); setAbierto(false); }}
            >
              <span>{l.icon}</span> {l.label}
            </button>
          ))}
          <button className="navbar-movil-salir" onClick={salir}>🚪 Cerrar sesión</button>
        </div>
      )}
    </>
  );
}