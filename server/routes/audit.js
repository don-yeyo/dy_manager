const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/roleGuard');

/**
 * GET /api/audit
 * (Admin Only - Solo Lectura) Consulta los registros inmutables de auditoría
 */
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const offset = parseInt(req.query.offset || '0', 10);
    const tabla = req.query.tabla ? String(req.query.tabla).trim() : null;
    const operacion = req.query.operacion ? String(req.query.operacion).trim() : null;
    const usuario = req.query.usuario ? String(req.query.usuario).trim() : null;

    let conditions = [];
    let params = [];

    if (tabla) {
      conditions.push('tabla_afectada = ?');
      params.push(tabla);
    }

    if (operacion) {
      conditions.push('operacion = ?');
      params.push(operacion);
    }

    if (usuario) {
      conditions.push('usuario_responsable LIKE ?');
      params.push(`%${usuario}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total de registros para paginación
    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM auditoria ${whereClause}`, params);
    const total = countRows[0].total;

    // Obtener registros
    const queryParams = [...params, limit, offset];
    const [rows] = await pool.query(`
      SELECT id, tabla_afectada, operacion, registro_id, datos_anteriores, datos_nuevos, usuario_responsable, fecha
      FROM auditoria
      ${whereClause}
      ORDER BY fecha DESC, id DESC
      LIMIT ? OFFSET ?
    `, queryParams);

    res.json({
      total,
      limit,
      offset,
      logs: rows
    });
  } catch (error) {
    console.error('[GET /api/audit Error]:', error);
    res.status(500).json({ error: 'Error al consultar auditoría: ' + error.message });
  }
});

module.exports = router;
