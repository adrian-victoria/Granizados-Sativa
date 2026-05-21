// src/components/Auth/Login.js
// Pantalla de inicio de sesión

import React, { useState } from 'react';
import { useNavigate }      from 'react-router-dom';
import { useAuth }          from '../../context/AuthContext';
import './Login.css';

export default function Login() {
  const navigate              = useNavigate();
  const { iniciarSesion }     = useAuth();

  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarPass, setMostrarPass] = useState(false);

  function manejarCambio(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(''); // limpiar error al escribir
  }

  async function manejarSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setCargando(true);
    try {
      await iniciarSesion(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al iniciar sesión.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login-page">
      {/* Fondo decorativo */}
      <div className="login-bg">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <div className="login-card">
        {/* Logo / Marca */}
        <div className="login-header">
  <img
    src="/logo.png"
    alt="Sativa Granizados"
    className="login-logo"
  />
  <p className="login-subtitle">Sistema de Ventas · Granizados</p>
</div>
        {/* Formulario */}
        <form className="login-form" onSubmit={manejarSubmit} noValidate>

          {error && (
            <div className="login-error" role="alert">
              <span></span> {error}
            </div>
          )}

          <div className="campo">
            <label htmlFor="email">Correo electrónico</label>
            <div className="input-wrapper">
              <span className="input-icon"></span>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="admin@granizados.com"
                value={form.email}
                onChange={manejarCambio}
                disabled={cargando}
              />
            </div>
          </div>

          <div className="campo">
            <label htmlFor="password">Contraseña</label>
            <div className="input-wrapper">
              <span className="input-icon"></span>
              <input
                id="password"
                type={mostrarPass ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={manejarCambio}
                disabled={cargando}
              />
              <button
                type="button"
                className="toggle-pass"
                onClick={() => setMostrarPass(v => !v)}
                aria-label="Mostrar/ocultar contraseña"
              >
                {mostrarPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`btn-login ${cargando ? 'btn-loading' : ''}`}
            disabled={cargando}
          >
            {cargando ? (
              <>
                <span className="spinner" /> Ingresando…
              </>
            ) : (
              'Ingresar al sistema'
            )}
          </button>
        </form>

        <p className="login-footer">
          GraniSys v1.0 · Usuario por defecto: <strong>admin@granizados.com</strong>
        </p>
      </div>
    </div>
  );
}
