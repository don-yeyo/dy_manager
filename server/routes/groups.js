const express = require('express');
const router = express.Router();
const { pool, executeWithUser } = require('../config/db');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/roleGuard');

/**
 * GET /api/groups
 * (Admin Only) Lista todos los grupos con recuento de miembros y aplicaciones
 */
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const [groups] = await pool.query(`
      SELECT g.*,
        (SELECT COUNT(*) FROM usuarios_grupos ug WHERE ug.grupo_id = g.id) as total_usuarios,
        (SELECT COUNT(*) FROM asignaciones_grupos ag WHERE ag.grupo_id = g.id) as total_apps
      FROM grupos g
      ORDER BY g.nombre ASC
    `);

    res.json({ groups });
  } catch (error) {
    console.error('[GET /api/groups Error]:', error);
    res.status(500).json({ error: 'Error al listar grupos: ' + error.message });
  }
});

/**
 * POST /api/groups
 * (Admin Only) Crea un nuevo grupo
 */
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre || !String(nombre).trim()) {
      return res.status(400).json({ error: 'El nombre del grupo es obligatorio.' });
    }

    const cleanNombre = String(nombre).trim();
    const cleanDesc = descripcion ? String(descripcion).trim() : null;

    const insertResult = await executeWithUser(req.user.email, async (conn) => {
      const [result] = await conn.query(
        'INSERT INTO grupos (nombre, descripcion, activo) VALUES (?, ?, 1)',
        [cleanNombre, cleanDesc]
      );
      return result;
    });

    res.status(201).json({
      message: 'Grupo creado exitosamente',
      group: {
        id: insertResult.insertId,
        nombre: cleanNombre,
        descripcion: cleanDesc,
        activo: 1
      }
    });
  } catch (error) {
    console.error('[POST /api/groups Error]:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe un grupo con ese nombre.' });
    }
    res.status(500).json({ error: 'Error al crear grupo: ' + error.message });
  }
});

/**
 * PUT /api/groups/:id
 * (Admin Only) Actualiza un grupo
 */
router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id, 10);
    const { nombre, descripcion, activo } = req.body;

    if (!nombre || !String(nombre).trim()) {
      return res.status(400).json({ error: 'El nombre del grupo es obligatorio.' });
    }

    const cleanNombre = String(nombre).trim();
    const cleanDesc = descripcion !== undefined ? String(descripcion).trim() : null;
    const cleanActivo = activo !== undefined ? (activo ? 1 : 0) : 1;

    await executeWithUser(req.user.email, async (conn) => {
      await conn.query(
        'UPDATE grupos SET nombre = ?, descripcion = ?, activo = ? WHERE id = ?',
        [cleanNombre, cleanDesc, cleanActivo, groupId]
      );
    });

    res.json({ message: 'Grupo actualizado exitosamente' });
  } catch (error) {
    console.error('[PUT /api/groups/:id Error]:', error);
    res.status(500).json({ error: 'Error al actualizar grupo: ' + error.message });
  }
});

/**
 * DELETE /api/groups/:id
 * (Admin Only) Elimina un grupo
 */
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id, 10);

    await executeWithUser(req.user.email, async (conn) => {
      await conn.query('DELETE FROM grupos WHERE id = ?', [groupId]);
    });

    res.json({ message: 'Grupo eliminado exitosamente' });
  } catch (error) {
    console.error('[DELETE /api/groups/:id Error]:', error);
    res.status(500).json({ error: 'Error al eliminar grupo: ' + error.message });
  }
});

/**
 * GET /api/groups/:id/details
 * (Admin Only) Retorna los miembros y aplicaciones asociadas al grupo
 */
router.get('/:id/details', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id, 10);

    const [members] = await pool.query(`
      SELECT u.id, u.email, u.nombre, u.rol, ug.created_at as unido_el
      FROM usuarios u
      INNER JOIN usuarios_grupos ug ON ug.usuario_id = u.id
      WHERE ug.grupo_id = ?
      ORDER BY u.nombre ASC
    `, [groupId]);

    const [apps] = await pool.query(`
      SELECT a.id, a.nombre, a.url, a.icono, a.categoria, ag.created_at as asignado_el, ag.asignado_por, ag.tipo_permiso
      FROM aplicaciones a
      INNER JOIN asignaciones_grupos ag ON ag.aplicacion_id = a.id
      WHERE ag.grupo_id = ?
      ORDER BY a.orden ASC, a.nombre ASC
    `, [groupId]);

    res.json({ members, apps });
  } catch (error) {
    console.error('[GET /api/groups/:id/details Error]:', error);
    res.status(500).json({ error: 'Error al obtener detalles del grupo: ' + error.message });
  }
});

/**
 * POST /api/groups/:id/members
 * (Admin Only) Actualiza los miembros de un grupo
 */
router.post('/:id/members', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id, 10);
    const { userIds } = req.body;

    if (!Array.isArray(userIds)) {
      return res.status(400).json({ error: 'userIds debe ser un array' });
    }

    await executeWithUser(req.user.email, async (conn) => {
      await conn.query('DELETE FROM usuarios_grupos WHERE grupo_id = ?', [groupId]);
      for (const uid of userIds) {
        await conn.query(
          'INSERT INTO usuarios_grupos (usuario_id, grupo_id) VALUES (?, ?)',
          [uid, groupId]
        );
      }
    });

    res.json({ message: 'Miembros del grupo actualizados exitosamente' });
  } catch (error) {
    console.error('[POST /api/groups/:id/members Error]:', error);
    res.status(500).json({ error: 'Error al actualizar miembros: ' + error.message });
  }
});

/**
 * POST /api/groups/:id/apps
 * (Admin Only) Actualiza las aplicaciones asignadas a este grupo
 * Soporta appAssignments ([{ id, tipo_permiso }]) o appIds ([id1, id2...])
 */
router.post('/:id/apps', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id, 10);
    const { appIds, appAssignments } = req.body;

    await executeWithUser(req.user.email, async (conn) => {
      await conn.query('DELETE FROM asignaciones_grupos WHERE grupo_id = ?', [groupId]);

      if (Array.isArray(appAssignments)) {
        for (const item of appAssignments) {
          const appId = typeof item === 'object' ? item.id : item;
          const tipo = (typeof item === 'object' && item.tipo_permiso === 'solo_ver') ? 'solo_ver' : 'acceso';
          if (appId) {
            await conn.query(
              'INSERT INTO asignaciones_grupos (grupo_id, aplicacion_id, asignado_por, tipo_permiso) VALUES (?, ?, ?, ?)',
              [groupId, appId, req.user.email, tipo]
            );
          }
        }
      } else if (Array.isArray(appIds)) {
        for (const appId of appIds) {
          await conn.query(
            'INSERT INTO asignaciones_grupos (grupo_id, aplicacion_id, asignado_por, tipo_permiso) VALUES (?, ?, ?, ?)',
            [groupId, appId, req.user.email, 'acceso']
          );
        }
      }
    });

    res.json({ message: 'Aplicaciones del grupo actualizadas exitosamente' });
  } catch (error) {
    console.error('[POST /api/groups/:id/apps Error]:', error);
    res.status(500).json({ error: 'Error al actualizar aplicaciones del grupo: ' + error.message });
  }
});

module.exports = router;
