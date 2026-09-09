function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  if (req.user.rol !== 'admin') {
    return res.status(403).json({
      error: 'Acceso Denegado',
      message: 'Esta funcionalidad requiere permisos de Administrador del sistema.'
    });
  }

  next();
}

module.exports = {
  requireAdmin
};
