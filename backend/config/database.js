// config/database.js
// Configura y exporta el pool de conexiones a MySQL

const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool de conexiones: reutiliza conexiones en lugar de abrir una nueva por petición
const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               process.env.DB_PORT     || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'granizados_db',
  waitForConnections: true,
  connectionLimit:    10,   // máximo 10 conexiones simultáneas
  queueLimit:         0,
  charset:            'utf8mb4',
});

// Función de prueba — se llama al iniciar el servidor
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conectado a MySQL correctamente');
    connection.release(); // devolver al pool
  } catch (error) {
    console.error('❌ Error al conectar a MySQL:', error.message);
    process.exit(1); // detener el servidor si no hay BD
  }
}

module.exports = { pool, testConnection };
