const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'dy_manager',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  queueLimit: 0,
  connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '5000', 10),
  charset: 'utf8mb4'
});

// Helper para ejecutar consultas asociando el usuario actual a la sesión MySQL
// Esto permite que los TRIGGERS de auditoría guarden en `usuario_responsable`
// el email del usuario que ejecutó la acción.
async function executeWithUser(userEmail, queryFn) {
  const connection = await pool.getConnection();
  try {
    const emailToSet = userEmail || 'SISTEMA';
    await connection.query('SET @app_current_user = ?', [emailToSet]);
    const result = await queryFn(connection);
    return result;
  } finally {
    try {
      await connection.query('SET @app_current_user = NULL');
    } catch (_) {}
    connection.release();
  }
}

// Probar conexión al iniciar
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log(`[DB] Conectado exitosamente a MySQL (${process.env.DB_NAME || 'dy_manager'}) en ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '3306'}`);
    conn.release();
  } catch (err) {
    console.warn(`[DB WARNING] No se pudo conectar inmediatamente a MySQL: ${err.message}. Verifica que el servicio MySQL esté corriendo y las credenciales en .env sean correctas.`);
  }
})();

module.exports = {
  pool,
  executeWithUser
};
