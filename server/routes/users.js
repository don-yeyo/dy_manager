const express = require('express');
const router = express.Router();
const { pool, executeWithUser } = require('../config/db');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/roleGuard');

/**
 * GET /api/users
 * (Admin Only) Lista todos los usuarios con sus grupos asociados y conteo de apps asignadas
 */
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT u.id, u.email, u.nombre, u.rol, u.activo, u.created_at, u.updated_at,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT('id', g.id, 'nombre', g.nombre)
          )
          FROM usuarios_grupos ug
          INNER JOIN grupos g ON g.id = ug.grupo_id
          WHERE ug.usuario_id = u.id
        ) as grupos,
        (
          SELECT COUNT(*)
          FROM asignaciones_usuarios au
          WHERE au.usuario_id = u.id
        ) as total_apps_directas
      FROM usuarios u
      ORDER BY u.nombre ASC
    `);

    res.json({ users });
  } catch (error) {
    console.error('[GET /api/users Error]:', error);
    res.status(500).json({ error: 'Error al listar usuarios: ' + error.message });
  }
});

/**
 * POST /api/users
 * (Admin Only) Da de alta un usuario manualmente
 */
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { email, nombre, rol, groupIds } = req.body;

    if (!email || !String(email).trim()) {
      return res.status(400).json({ error: 'El email del usuario es obligatorio.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanNombre = (nombre && String(nombre).trim()) || cleanEmail.split('@')[0];
    const cleanRol = rol === 'admin' ? 'admin' : 'user';

    const insertResult = await executeWithUser(req.user.email, async (conn) => {
      const [res] = await conn.query(
        'INSERT INTO usuarios (email, nombre, rol, activo) VALUES (?, ?, ?, 1)',
        [cleanEmail, cleanNombre, cleanRol]
      );
      const newUserId = res.insertId;

      if (Array.isArray(groupIds)) {
        for (const gid of groupIds) {
          await conn.query(
            'INSERT INTO usuarios_grupos (usuario_id, grupo_id) VALUES (?, ?)',
            [newUserId, gid]
          );
        }
      }

      return res;
    });

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: insertResult.insertId,
        email: cleanEmail,
        nombre: cleanNombre,
        rol: cleanRol,
        activo: 1
      }
    });
  } catch (error) {
    console.error('[POST /api/users Error]:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe un usuario con este correo electrónico.' });
    }
    res.status(500).json({ error: 'Error al crear usuario: ' + error.message });
  }
});

/**
 * PUT /api/users/:id/role
 * (Admin Only) Cambia el rol de un usuario
 */
router.put('/:id/role', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const { rol } = req.body;

    if (!['admin', 'user'].includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido. Debe ser admin o user.' });
    }

    // Evitar que el admin actual se quite su propio rol de admin si es el único
    if (targetUserId === req.user.id && rol !== 'admin') {
      const [adminCount] = await pool.query("SELECT COUNT(*) as count FROM usuarios WHERE rol = 'admin' AND activo = 1");
      if (adminCount[0].count <= 1) {
        return res.status(400).json({ error: 'No puedes revocar tu propio rol de admin si eres el único administrador activo.' });
      }
    }

    await executeWithUser(req.user.email, async (conn) => {
      await conn.query('UPDATE usuarios SET rol = ? WHERE id = ?', [rol, targetUserId]);
    });

    res.json({ message: `Rol actualizado a ${rol} exitosamente` });
  } catch (error) {
    console.error('[PUT /api/users/:id/role Error]:', error);
    res.status(500).json({ error: 'Error al cambiar rol: ' + error.message });
  }
});

/**
 * PUT /api/users/:id/status
 * (Admin Only) Activa o desactiva un usuario
 */
router.put('/:id/status', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const { activo } = req.body;

    const newStatus = activo ? 1 : 0;

    if (targetUserId === req.user.id && !newStatus) {
      return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta de usuario.' });
    }

    await executeWithUser(req.user.email, async (conn) => {
      await conn.query('UPDATE usuarios SET activo = ? WHERE id = ?', [newStatus, targetUserId]);
    });

    res.json({ message: `Estado del usuario actualizado exitosamente` });
  } catch (error) {
    console.error('[PUT /api/users/:id/status Error]:', error);
    res.status(500).json({ error: 'Error al cambiar estado: ' + error.message });
  }
});

/**
 * GET /api/users/:id/apps
 * (Admin Only) Obtiene las aplicaciones asignadas directamente a un usuario
 */
router.get('/:id/apps', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    const [rows] = await pool.query(`
      SELECT a.id, a.nombre, a.url, a.icono, a.categoria, au.created_at as asignado_el, au.asignado_por
      FROM aplicaciones a
      INNER JOIN asignaciones_usuarios au ON au.aplicacion_id = a.id
      WHERE au.usuario_id = ?
    `, [userId]);

    res.json({ apps: rows });
  } catch (error) {
    console.error('[GET /api/users/:id/apps Error]:', error);
    res.status(500).json({ error: 'Error al obtener aplicaciones del usuario: ' + error.message });
  }
});

/**
 * POST /api/users/:id/apps
 * (Admin Only) Asigna o reemplaza aplicaciones asignadas directamente a un usuario
 */
router.post('/:id/apps', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { appIds } = req.body; // Array de IDs de aplicaciones

    if (!Array.isArray(appIds)) {
      return res.status(400).json({ error: 'appIds debe ser un array' });
    }

    await executeWithUser(req.user.email, async (conn) => {
      await conn.query('DELETE FROM asignaciones_usuarios WHERE usuario_id = ?', [userId]);
      for (const appId of appIds) {
        await conn.query(
          'INSERT INTO asignaciones_usuarios (usuario_id, aplicacion_id, asignado_por) VALUES (?, ?, ?)',
          [userId, appId, req.user.email]
        );
      }
    });

    res.json({ message: 'Aplicaciones del usuario actualizadas exitosamente' });
  } catch (error) {
    console.error('[POST /api/users/:id/apps Error]:', error);
    res.status(500).json({ error: 'Error al actualizar aplicaciones: ' + error.message });
  }
});

module.exports = router;
