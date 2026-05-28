// config/database.js
// Configura y exporta el pool de conexiones a PostgreSQL (Supabase)

const { Pool } = require('pg');
require('dotenv').config();

// Pool de conexiones: reutiliza conexiones en lugar de abrir una nueva por petición
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // necesario para Supabase
  },
  max: 10,          // máximo 10 conexiones simultáneas
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Función de prueba — se llama al iniciar el servidor
async function testConnection() {
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Conectado a PostgreSQL (Supabase) correctamente');
  } catch (error) {
    console.error('❌ Error al conectar a PostgreSQL:', error.message);
    process.exit(1); // detener el servidor si no hay BD
  } finally {
    if (client) client.release(); // devolver al pool siempre
  }
}

module.exports = { pool, testConnection };