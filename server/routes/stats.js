const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/roleGuard');

/**
 * POST /api/stats/track
 * Registra un clic a un enlace de la botonera.
 * [ESTA RUTA NO PASA POR executeWithUser NI DISPARA TRIGGERS DE AUDITORÍA]
 */
router.post('/track', authMiddleware, async (req, res) => {
  try {
    const { appId } = req.body;

    if (!appId) {
      return res.status(400).json({ error: 'appId es obligatorio' });
    }

    const userId = req.user ? req.user.id : null;
    const email = req.user ? req.user.email : 'anonimo@donyeyo.com.ar';
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
    const userAgent = (req.headers['user-agent'] || '').substring(0, 255);

    // Insertar directamente en estadisticas_accesos sin triggers
    await pool.query(
      `INSERT INTO estadisticas_accesos (aplicacion_id, usuario_id, email_usuario, ip_origen, user_agent)
       VALUES (?, ?, ?, ?, ?)`,
      [appId, userId, email, ip, userAgent]
    );

    res.json({ ok: true });
  } catch (error) {
    console.error('[POST /api/stats/track Error]:', error);
    // No frenamos el flujo del usuario si la métrica falla
    res.status(200).json({ ok: false, error: error.message });
  }
});

/**
 * GET /api/stats/summary
 * (Admin Only - Solo Lectura) Métricas consolidadas de accesos
 */
router.get('/summary', authMiddleware, requireAdmin, async (req, res) => {
  try {
    // 1. Totales generales
    const [totalRows] = await pool.query('SELECT COUNT(*) as total FROM estadisticas_accesos');
    const totalAccesos = totalRows[0].total || 0;

    // 2. Accesos de hoy
    const [todayRows] = await pool.query(`
      SELECT COUNT(*) as total_hoy 
      FROM estadisticas_accesos 
      WHERE DATE(fecha_acceso) = CURDATE()
    `);
    const accesosHoy = todayRows[0].total_hoy || 0;

    // 3. Ranking de aplicaciones más utilizadas
    const [topApps] = await pool.query(`
      SELECT a.id, a.nombre, a.icono, a.color, a.categoria, COUNT(ea.id) as total_clics
      FROM aplicaciones a
      LEFT JOIN estadisticas_accesos ea ON ea.aplicacion_id = a.id
      GROUP BY a.id, a.nombre, a.icono, a.color, a.categoria
      ORDER BY total_clics DESC, a.nombre ASC
    `);

    // 4. Ranking de usuarios más activos
    const [topUsers] = await pool.query(`
      SELECT ea.email_usuario, COALESCE(u.nombre, ea.email_usuario) as nombre, COUNT(ea.id) as total_accesos
      FROM estadisticas_accesos ea
      LEFT JOIN usuarios u ON u.id = ea.usuario_id
      GROUP BY ea.email_usuario, u.nombre
      ORDER BY total_accesos DESC
      LIMIT 10
    `);

    // 5. Histórico por día (últimos 14 días)
    const [historyDays] = await pool.query(`
      SELECT DATE_FORMAT(fecha_acceso, '%Y-%m-%d') as fecha, COUNT(*) as cantidad
      FROM estadisticas_accesos
      WHERE fecha_acceso >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
      GROUP BY DATE_FORMAT(fecha_acceso, '%Y-%m-%d')
      ORDER BY fecha ASC
    `);

    res.json({
      totalAccesos,
      accesosHoy,
      topApps,
      topUsers,
      historyDays
    });
  } catch (error) {
    console.error('[GET /api/stats/summary Error]:', error);
    res.status(500).json({ error: 'Error al obtener resumen de estadísticas: ' + error.message });
  }
});

/**
 * GET /api/stats/logs
 * (Admin Only - Solo Lectura) Historial detallado de clics
 */
router.get('/logs', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const offset = parseInt(req.query.offset || '0', 10);
    const appId = req.query.appId ? parseInt(req.query.appId, 10) : null;

    let whereClause = '';
    let params = [];

    if (appId) {
      whereClause = 'WHERE ea.aplicacion_id = ?';
      params.push(appId);
    }

    params.push(limit, offset);

    const [rows] = await pool.query(`
      SELECT ea.id, ea.aplicacion_id, a.nombre as app_nombre, a.icono as app_icono, a.color as app_color,
             ea.email_usuario, COALESCE(u.nombre, ea.email_usuario) as usuario_nombre,
             ea.ip_origen, ea.user_agent, ea.fecha_acceso
      FROM estadisticas_accesos ea
      INNER JOIN aplicaciones a ON a.id = ea.aplicacion_id
      LEFT JOIN usuarios u ON u.id = ea.usuario_id
      ${whereClause}
      ORDER BY ea.fecha_acceso DESC
      LIMIT ? OFFSET ?
    `, params);

    res.json({ logs: rows });
  } catch (error) {
    console.error('[GET /api/stats/logs Error]:', error);
    res.status(500).json({ error: 'Error al obtener logs de estadísticas: ' + error.message });
  }
});

module.exports = router;
