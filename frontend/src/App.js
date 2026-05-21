import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login    from './components/Auth/Login';
import Productos from './components/Productos/Productos';
import Ventas   from './components/Ventas/Ventas';
import Navbar   from './components/Layout/Navbar';
import Caja from './components/Caja/Caja';
import Admin from './components/Admin/Admin';
import Reportes from './components/Reportes/Reportes';

function RutaProtegida({ children }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return <div style={{
    minHeight:'100vh', display:'flex', alignItems:'center',
    justifyContent:'center', background:'#0a0a0a', color:'#e63030',
    fontFamily:'DM Sans, sans-serif'
  }}>Cargando…</div>;
  return usuario ? children : <Navigate to="/login" replace />;
}

function RutaPublica({ children }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return null;
  return !usuario ? children : <Navigate to="/ventas" replace />;
}

function Layout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            <RutaPublica><Login /></RutaPublica>
          } />
          <Route path="/ventas" element={
            <RutaProtegida>
              <Layout><Ventas /></Layout>
            </RutaProtegida>
          } />
          <Route path="/productos" element={
            <RutaProtegida>
              <Layout><Productos /></Layout>
            </RutaProtegida>
          } />
          <Route path="/" element={<Navigate to="/ventas" replace />} />
          <Route path="*" element={<Navigate to="/ventas" replace />} />
          <Route path="/caja" element={
  <RutaProtegida>
    <Layout><Caja /></Layout>
  </RutaProtegida>
} />
<Route path="/admin" element={
  <RutaProtegida>
    <Layout><Admin /></Layout>
  </RutaProtegida>
} />
<Route path="/reportes" element={
  <RutaProtegida>
    <Layout><Reportes /></Layout>
  </RutaProtegida>
} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}