const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authMiddleware } = require('../middlewares/authMiddleware');

/**
 * GET /api/user-config/board
 * Obtiene la configuración de personalización de la grilla del usuario:
 * secciones con sus titulares y el orden de las aplicaciones.
 */
router.get('/board', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      'SELECT configuracion, updated_at FROM usuario_tablero_config WHERE usuario_id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.json({
        hasCustomConfig: false,
        secciones: []
      });
    }

    let configuracion = rows[0].configuracion;
    if (typeof configuracion === 'string') {
      try {
        configuracion = JSON.parse(configuracion);
      } catch (_) {}
    }

    res.json({
      hasCustomConfig: true,
      secciones: configuracion || [],
      updatedAt: rows[0].updated_at
    });
  } catch (error) {
    console.error('[GET /api/user-config/board Error]:', error);
    res.status(500).json({ error: 'Error al obtener personalización del tablero: ' + error.message });
  }
});

/**
 * PUT /api/user-config/board
 * Guarda o actualiza las secciones y orden del tablero personalizado del usuario.
 */
router.put('/board', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { secciones } = req.body;

    if (!Array.isArray(secciones)) {
      return res.status(400).json({ error: 'secciones debe ser un array' });
    }

    const jsonString = JSON.stringify(secciones);

    await pool.query(
      `INSERT INTO usuario_tablero_config (usuario_id, configuracion)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE configuracion = VALUES(configuracion)`,
      [userId, jsonString]
    );

    res.json({
      ok: true,
      message: 'Configuración de tablero guardada exitosamente'
    });
  } catch (error) {
    console.error('[PUT /api/user-config/board Error]:', error);
    res.status(500).json({ error: 'Error al guardar personalización del tablero: ' + error.message });
  }
});

module.exports = router;
