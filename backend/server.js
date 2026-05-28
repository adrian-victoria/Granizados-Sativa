require('dotenv').config();
const express            = require('express');
const cors               = require('cors');
const path               = require('path');
const fs                 = require('fs');
const { testConnection } = require('./config/database');

const authRoutes      = require('./routes/auth');
const productosRoutes = require('./routes/productos');
const ventasRoutes    = require('./routes/ventas');
const cajaRoutes      = require('./routes/caja');
const adminRoutes     = require('./routes/admin');
const reportesRoutes  = require('./routes/reportes');
const historialRoutes = require('./routes/historial');

const app  = express();
const PORT = process.env.PORT || 4000;

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://thriving-perception-production-2ccd.up.railway.app', // Railway (anterior)
    process.env.FRONTEND_URL,                                      // Vercel (nuevo) ← desde .env
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',      authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/ventas',    ventasRoutes);
app.use('/api/caja',      cajaRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/reportes',  reportesRoutes);

app.get('/api/health', (req, res) => {
  res.json({ estado: 'OK', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada.' });
});

async function iniciar() {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📋 Entorno: ${process.env.NODE_ENV || 'desarrollo'}`);
  });
}

iniciar();