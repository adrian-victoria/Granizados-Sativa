import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export function AuthProvider({ children }) {
  const [usuario, setUsuario]   = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user  = localStorage.getItem('usuario');

    if (token && user) {
      setUsuario(JSON.parse(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setCargando(false);
  }, []);

  async function iniciarSesion(email, password) {
    const { data } = await axios.post(`${API}/api/auth/login`, { email, password }); // ← URL dinámica

    localStorage.setItem('token',   data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

    setUsuario(data.usuario);
    return data;
  }

  function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    delete axios.defaults.headers.common['Authorization'];
    setUsuario(null);
  }

  const esAdmin = usuario?.rol === 'admin';

  return (
    <AuthContext.Provider value={{ usuario, cargando, iniciarSesion, cerrarSesion, esAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}