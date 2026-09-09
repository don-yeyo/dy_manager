const { pool } = require('../config/db');

async function authMiddleware(req, res, next) {
  try {
    // Extraer email desde el header x-user-email o desde Bearer token / Mock
    const userEmail = req.headers['x-user-email'] || req.headers['x-auth-email'];

    if (!userEmail) {
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Falta cabecera de identificación de usuario (x-user-email)'
      });
    }

    const cleanEmail = String(userEmail).trim().toLowerCase();

    // Buscar en la base de datos
    const [rows] = await pool.query(
      'SELECT id, email, nombre, rol, activo FROM usuarios WHERE LOWER(email) = ?',
      [cleanEmail]
    );

    if (rows.length === 0) {
      // El usuario no está registrado aún
      return res.status(401).json({
        error: 'Usuario no registrado',
        message: `El usuario con email ${cleanEmail} no está registrado en Don Yeyo Manager.`
      });
    }

    const user = rows[0];

    if (!user.activo) {
      return res.status(403).json({
        error: 'Usuario inactivo',
        message: 'Tu cuenta de usuario ha sido desactivada. Consulta con el Administrador.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[authMiddleware Error]:', error);
    res.status(500).json({ error: 'Error al verificar autenticación del usuario' });
  }
}

module.exports = {
  authMiddleware
};
