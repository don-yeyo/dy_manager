const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

/**
 * GET /api/system/version
 * Retorna la versión del backend y estado.
 */
router.get('/version', (req, res) => {
  let pkg;
  try {
    pkg = require('../../package.json');
  } catch (_) {
    pkg = { version: '1.0.0' };
  }

  const clientVersion = req.query.v;
  res.json({
    system: 'Don Yeyo Manager',
    serverVersion: pkg.version,
    needsUpdate: clientVersion ? pkg.version !== clientVersion : false
  });
});

/**
 * GET /api/system/db-status
 * Verifica la disponibilidad de la conexión a MySQL ejecutando un query liviano.
 */
router.get('/db-status', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query('SELECT 1');
    connection.release();

    return res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Healthcheck /system/db-status] Database connection failed:', error.message);
    return res.status(500).json({
      status: 'error',
      database: 'disconnected',
      message: error.message
    });
  }
});

module.exports = router;
