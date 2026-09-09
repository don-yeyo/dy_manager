const express = require('express');
const router = express.Router();
const { pool, executeWithUser } = require('../config/db');
const { authMiddleware } = require('../middlewares/authMiddleware');

/**
 * POST /api/auth/sync
 * Sincroniza el usuario tras autenticarse con Microsoft SSO (o Mock).
 * Si no existe, lo da de alta automáticamente.
 */
router.post('/sync', async (req, res) => {
  try {
    const { email, nombre } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email requerido para la sincronización' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanNombre = (nombre && String(nombre).trim()) || cleanEmail.split('@')[0];

    // Verificar si el usuario ya existe
    const [existing] = await pool.query(
      'SELECT id, email, nombre, rol, activo FROM usuarios WHERE LOWER(email) = ?',
      [cleanEmail]
    );

    let user;

    if (existing.length === 0) {
      // Determinar si debe ser admin (si es el configurado en .env o si no hay ningún usuario aún)
      const defaultAdmin = (process.env.DEFAULT_ADMIN_EMAIL || '').toLowerCase().trim();
      const [countRows] = await pool.query('SELECT COUNT(*) as total FROM usuarios');
      const isFirstUser = countRows[0].total === 0;
      const shouldBeAdmin = isFirstUser || (defaultAdmin && cleanEmail === defaultAdmin);
      const rol = shouldBeAdmin ? 'admin' : 'user';

      // Insertar mediante executeWithUser para que el trigger de auditoría registre la creación
      const insertResult = await executeWithUser(cleanEmail, async (conn) => {
        const [res] = await conn.query(
          'INSERT INTO usuarios (email, nombre, rol, activo) VALUES (?, ?, ?, 1)',
          [cleanEmail, cleanNombre, rol]
        );
        return res;
      });

      user = {
        id: insertResult.insertId,
        email: cleanEmail,
        nombre: cleanNombre,
        rol,
        activo: 1
      };
    } else {
      user = existing[0];

      if (!user.activo) {
        return res.status(403).json({
          error: 'Usuario inactivo',
          message: 'Tu cuenta ha sido desactivada por el administrador.'
        });
      }

      // Si cambió el nombre, actualizarlo
      if (cleanNombre && cleanNombre !== user.nombre) {
        await executeWithUser(cleanEmail, async (conn) => {
          await conn.query('UPDATE usuarios SET nombre = ? WHERE id = ?', [cleanNombre, user.id]);
        });
        user.nombre = cleanNombre;
      }
    }

    // Obtener los grupos del usuario
    const [groupRows] = await pool.query(
      `SELECT g.id, g.nombre, g.descripcion 
       FROM grupos g
       INNER JOIN usuarios_grupos ug ON ug.grupo_id = g.id
       WHERE ug.usuario_id = ? AND g.activo = 1`,
      [user.id]
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        grupos: groupRows
      }
    });
  } catch (error) {
    console.error('[POST /api/auth/sync Error]:', error);
    res.status(500).json({ error: 'Error al sincronizar usuario: ' + error.message });
  }
});

/**
 * GET /api/auth/me
 * Retorna los datos del usuario actual y sus grupos.
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [groupRows] = await pool.query(
      `SELECT g.id, g.nombre, g.descripcion 
       FROM grupos g
       INNER JOIN usuarios_grupos ug ON ug.grupo_id = g.id
       WHERE ug.usuario_id = ? AND g.activo = 1`,
      [req.user.id]
    );

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        nombre: req.user.nombre,
        rol: req.user.rol,
        grupos: groupRows
      }
    });
  } catch (error) {
    console.error('[GET /api/auth/me Error]:', error);
    res.status(500).json({ error: 'Error al obtener sesión: ' + error.message });
  }
});

module.exports = router;
