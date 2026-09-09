const express = require('express');
const router = express.Router();
const { pool, executeWithUser } = require('../config/db');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/roleGuard');
const { isValidAppUrl } = require('../utils/urlValidator');
const { sendAccessRequestEmail } = require('../config/email');

/**
 * GET /api/apps/my-apps
 * Retorna las aplicaciones visibles para el usuario autenticado:
 * - Aplicaciones públicas con requiere_seguridad = 0 (visibles para todos con permiso 'acceso')
 * - Asignadas directamente a él (asignaciones_usuarios)
 * - O asignadas a cualquiera de los grupos a los que pertenece (asignaciones_grupos)
 * - Si es admin, puede solicitar todas (?all=true) o ver todas las activas por defecto
 */
router.get('/my-apps', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.rol === 'admin';
    const showAll = req.query.all === 'true' && isAdmin;

    let query;
    let params;

    if (showAll) {
      query = `
        SELECT a.id, a.nombre, a.descripcion, a.url, a.icono, a.categoria, a.color, a.orden,
               a.requiere_seguridad,
               1 as puede_acceder,
               'acceso' as tipo_permiso,
               'ADMIN_OVERRIDE' as origen_asignacion
        FROM aplicaciones a
        WHERE a.activo = 1
        ORDER BY a.orden ASC, a.nombre ASC
      `;
      params = [];
    } else {
      query = `
        SELECT 
          a.id, a.nombre, a.descripcion, a.url, a.icono, a.categoria, a.color, a.orden,
          a.requiere_seguridad,
          CASE 
            WHEN a.requiere_seguridad = 0 THEN 1
            WHEN ${isAdmin ? '1=1' : '1=0'} THEN 1
            WHEN MAX(CASE WHEN au.tipo_permiso = 'acceso' OR ag.tipo_permiso = 'acceso' THEN 1 ELSE 0 END) = 1 THEN 1
            ELSE 0
          END as puede_acceder,
          CASE 
            WHEN a.requiere_seguridad = 0 THEN 'acceso'
            WHEN ${isAdmin ? '1=1' : '1=0'} THEN 'acceso'
            WHEN MAX(CASE WHEN au.tipo_permiso = 'acceso' OR ag.tipo_permiso = 'acceso' THEN 1 ELSE 0 END) = 1 THEN 'acceso'
            ELSE 'solo_ver'
          END as tipo_permiso,
          CASE 
            WHEN a.requiere_seguridad = 0 THEN 'Pública'
            WHEN MAX(CASE WHEN au.id IS NOT NULL THEN 1 ELSE 0 END) = 1 AND MAX(CASE WHEN ag.id IS NOT NULL THEN 1 ELSE 0 END) = 1 THEN 'Directa y Grupo'
            WHEN MAX(CASE WHEN au.id IS NOT NULL THEN 1 ELSE 0 END) = 1 THEN 'Directa'
            WHEN MAX(CASE WHEN ag.id IS NOT NULL THEN 1 ELSE 0 END) = 1 THEN 'Grupo'
            ELSE 'Autorizado'
          END as origen_asignacion
        FROM aplicaciones a
        LEFT JOIN asignaciones_usuarios au ON au.aplicacion_id = a.id AND au.usuario_id = ?
        LEFT JOIN asignaciones_grupos ag ON ag.aplicacion_id = a.id AND ag.grupo_id IN (
          SELECT grupo_id FROM usuarios_grupos WHERE usuario_id = ?
        )
        WHERE a.activo = 1 AND (
          a.requiere_seguridad = 0 
          OR au.id IS NOT NULL 
          OR ag.id IS NOT NULL 
          ${isAdmin ? 'OR 1=1' : ''}
        )
        GROUP BY a.id
        ORDER BY a.orden ASC, a.nombre ASC
      `;
      params = [userId, userId];
    }

    const [rows] = await pool.query(query, params);
    res.json({ apps: rows });
  } catch (error) {
    console.error('[GET /api/apps/my-apps Error]:', error);
    res.status(500).json({ error: 'Error al obtener aplicaciones del usuario: ' + error.message });
  }
});

/**
 * GET /api/apps
 * (Admin Only) Listado de todas las aplicaciones con conteo de asignaciones
 */
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*,
        (SELECT COUNT(*) FROM asignaciones_usuarios au WHERE au.aplicacion_id = a.id) as total_usuarios,
        (SELECT COUNT(*) FROM asignaciones_grupos ag WHERE ag.aplicacion_id = a.id) as total_grupos,
        (SELECT COUNT(*) FROM estadisticas_accesos ea WHERE ea.aplicacion_id = a.id) as total_accesos
      FROM aplicaciones a
      ORDER BY a.orden ASC, a.nombre ASC
    `);

    res.json({ apps: rows });
  } catch (error) {
    console.error('[GET /api/apps Error]:', error);
    res.status(500).json({ error: 'Error al listar aplicaciones: ' + error.message });
  }
});

/**
 * POST /api/apps
 * (Admin Only) Crea una nueva aplicación
 */
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { nombre, descripcion, url, icono, categoria, color, orden, activo, requiere_seguridad } = req.body;

    if (!nombre || !String(nombre).trim()) {
      return res.status(400).json({ error: 'El nombre de la aplicación es obligatorio.' });
    }

    const urlCheck = isValidAppUrl(url);
    if (!urlCheck.valid) {
      return res.status(400).json({ error: urlCheck.error });
    }

    const cleanNombre = String(nombre).trim();
    const cleanUrl = urlCheck.normalizedUrl;
    const cleanDesc = descripcion ? String(descripcion).trim() : null;
    const cleanIcon = icono ? String(icono).trim() : 'Globe';
    const cleanCat = categoria ? String(categoria).trim() : 'General';
    const cleanColor = color ? String(color).trim() : '#0d2c5c';
    const cleanOrden = parseInt(orden || 0, 10);
    const cleanActivo = activo !== undefined ? (activo ? 1 : 0) : 1;
    const cleanSeguridad = requiere_seguridad !== undefined ? (requiere_seguridad ? 1 : 0) : 1;

    const insertResult = await executeWithUser(req.user.email, async (conn) => {
      const [result] = await conn.query(
        `INSERT INTO aplicaciones (nombre, descripcion, url, icono, categoria, color, orden, activo, requiere_seguridad)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [cleanNombre, cleanDesc, cleanUrl, cleanIcon, cleanCat, cleanColor, cleanOrden, cleanActivo, cleanSeguridad]
      );
      return result;
    });

    res.status(201).json({
      message: 'Aplicación creada exitosamente',
      app: {
        id: insertResult.insertId,
        nombre: cleanNombre,
        descripcion: cleanDesc,
        url: cleanUrl,
        icono: cleanIcon,
        categoria: cleanCat,
        color: cleanColor,
        orden: cleanOrden,
        activo: cleanActivo,
        requiere_seguridad: cleanSeguridad
      }
    });
  } catch (error) {
    console.error('[POST /api/apps Error]:', error);
    res.status(500).json({ error: 'Error al crear aplicación: ' + error.message });
  }
});

/**
 * PUT /api/apps/:id
 * (Admin Only) Actualiza los datos de una aplicación
 */
router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const appId = parseInt(req.params.id, 10);
    const { nombre, descripcion, url, icono, categoria, color, orden, activo, requiere_seguridad } = req.body;

    if (!nombre || !String(nombre).trim()) {
      return res.status(400).json({ error: 'El nombre de la aplicación es obligatorio.' });
    }

    const urlCheck = isValidAppUrl(url);
    if (!urlCheck.valid) {
      return res.status(400).json({ error: urlCheck.error });
    }

    const cleanNombre = String(nombre).trim();
    const cleanUrl = urlCheck.normalizedUrl;
    const cleanDesc = descripcion !== undefined ? String(descripcion).trim() : null;
    const cleanIcon = icono ? String(icono).trim() : 'Globe';
    const cleanCat = categoria ? String(categoria).trim() : 'General';
    const cleanColor = color ? String(color).trim() : '#0d2c5c';
    const cleanOrden = parseInt(orden || 0, 10);
    const cleanActivo = activo !== undefined ? (activo ? 1 : 0) : 1;
    const cleanSeguridad = requiere_seguridad !== undefined ? (requiere_seguridad ? 1 : 0) : 1;

    await executeWithUser(req.user.email, async (conn) => {
      await conn.query(
        `UPDATE aplicaciones
         SET nombre = ?, descripcion = ?, url = ?, icono = ?, categoria = ?, color = ?, orden = ?, activo = ?, requiere_seguridad = ?
         WHERE id = ?`,
        [cleanNombre, cleanDesc, cleanUrl, cleanIcon, cleanCat, cleanColor, cleanOrden, cleanActivo, cleanSeguridad, appId]
      );
    });

    res.json({ message: 'Aplicación actualizada exitosamente' });
  } catch (error) {
    console.error('[PUT /api/apps/:id Error]:', error);
    res.status(500).json({ error: 'Error al actualizar aplicación: ' + error.message });
  }
});

/**
 * DELETE /api/apps/:id
 * (Admin Only) Elimina una aplicación
 */
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const appId = parseInt(req.params.id, 10);

    await executeWithUser(req.user.email, async (conn) => {
      await conn.query('DELETE FROM aplicaciones WHERE id = ?', [appId]);
    });

    res.json({ message: 'Aplicación eliminada exitosamente' });
  } catch (error) {
    console.error('[DELETE /api/apps/:id Error]:', error);
    res.status(500).json({ error: 'Error al eliminar aplicación: ' + error.message });
  }
});

/**
 * GET /api/apps/:id/assignments
 * (Admin Only) Retorna los usuarios y grupos asignados a esta aplicación
 */
router.get('/:id/assignments', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const appId = parseInt(req.params.id, 10);

    const [users] = await pool.query(`
      SELECT u.id, u.email, u.nombre, au.created_at as asignado_el, au.asignado_por, au.tipo_permiso
      FROM usuarios u
      INNER JOIN asignaciones_usuarios au ON au.usuario_id = u.id
      WHERE au.aplicacion_id = ?
    `, [appId]);

    const [groups] = await pool.query(`
      SELECT g.id, g.nombre, g.descripcion, ag.created_at as asignado_el, ag.asignado_por, ag.tipo_permiso
      FROM grupos g
      INNER JOIN asignaciones_grupos ag ON ag.grupo_id = g.id
      WHERE ag.aplicacion_id = ?
    `, [appId]);

    res.json({ users, groups });
  } catch (error) {
    console.error('[GET /api/apps/:id/assignments Error]:', error);
    res.status(500).json({ error: 'Error al obtener asignaciones: ' + error.message });
  }
});

/**
 * POST /api/apps/:id/assignments
 * (Admin Only) Modifica las asignaciones de usuarios y grupos para esta aplicación
 * Soportando tipo_permiso ('acceso' | 'solo_ver')
 */
router.post('/:id/assignments', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const appId = parseInt(req.params.id, 10);
    // userAssignments y groupAssignments pueden ser arrays de objetos: [{ id, tipo_permiso }] o arrays simples de IDs numéricos
    const { userIds, groupIds, userAssignments, groupAssignments } = req.body;

    await executeWithUser(req.user.email, async (conn) => {
      // 1. Asignaciones de usuarios
      await conn.query('DELETE FROM asignaciones_usuarios WHERE aplicacion_id = ?', [appId]);

      if (Array.isArray(userAssignments)) {
        for (const item of userAssignments) {
          const uid = typeof item === 'object' ? item.id : item;
          const tipo = (typeof item === 'object' && item.tipo_permiso === 'solo_ver') ? 'solo_ver' : 'acceso';
          if (uid) {
            await conn.query(
              'INSERT INTO asignaciones_usuarios (usuario_id, aplicacion_id, asignado_por, tipo_permiso) VALUES (?, ?, ?, ?)',
              [uid, appId, req.user.email, tipo]
            );
          }
        }
      } else if (Array.isArray(userIds)) {
        for (const uid of userIds) {
          await conn.query(
            'INSERT INTO asignaciones_usuarios (usuario_id, aplicacion_id, asignado_por, tipo_permiso) VALUES (?, ?, ?, ?)',
            [uid, appId, req.user.email, 'acceso']
          );
        }
      }

      // 2. Asignaciones de grupos
      await conn.query('DELETE FROM asignaciones_grupos WHERE aplicacion_id = ?', [appId]);

      if (Array.isArray(groupAssignments)) {
        for (const item of groupAssignments) {
          const gid = typeof item === 'object' ? item.id : item;
          const tipo = (typeof item === 'object' && item.tipo_permiso === 'solo_ver') ? 'solo_ver' : 'acceso';
          if (gid) {
            await conn.query(
              'INSERT INTO asignaciones_grupos (grupo_id, aplicacion_id, asignado_por, tipo_permiso) VALUES (?, ?, ?, ?)',
              [gid, appId, req.user.email, tipo]
            );
          }
        }
      } else if (Array.isArray(groupIds)) {
        for (const gid of groupIds) {
          await conn.query(
            'INSERT INTO asignaciones_grupos (grupo_id, aplicacion_id, asignado_por, tipo_permiso) VALUES (?, ?, ?, ?)',
            [gid, appId, req.user.email, 'acceso']
          );
        }
      }
    });

    res.json({ message: 'Asignaciones actualizadas exitosamente' });
  } catch (error) {
    console.error('[POST /api/apps/:id/assignments Error]:', error);
    res.status(500).json({ error: 'Error al actualizar asignaciones: ' + error.message });
  }
});

/**
 * POST /api/apps/:id/request-access
 * Permite a un usuario solicitar acceso a una aplicación que tiene asignada en modo "solo_ver".
 * Envía la solicitud por correo a los administradores configurados en .env
 */
router.post('/:id/request-access', authMiddleware, async (req, res) => {
  try {
    const appId = parseInt(req.params.id, 10);
    const { mensaje } = req.body;

    const [rows] = await pool.query(
      'SELECT id, nombre, descripcion, url, categoria FROM aplicaciones WHERE id = ? AND activo = 1',
      [appId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'La aplicación no existe o no está activa.' });
    }

    const app = rows[0];

    // Enviar correo de notificación
    await sendAccessRequestEmail({
      user: req.user,
      app,
      mensaje: mensaje ? String(mensaje).trim() : ''
    });

    res.json({
      message: `Solicitud de acceso enviada correctamente para ${app.nombre}. Los administradores se comunicarán contigo a la brevedad.`
    });
  } catch (error) {
    console.error('[POST /api/apps/:id/request-access Error]:', error);
    res.status(500).json({ error: 'No se pudo enviar la solicitud de acceso: ' + error.message });
  }
});

module.exports = router;
