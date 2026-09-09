const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Seguridad y Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Permitir solicitudes sin origen (curl, healthchecks, Postman) o si coincide con los permitidos
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error(`Origen CORS no permitido: ${origin}`));
    }
  },
  credentials: true
}));

// Límite ampliado a 10MB para soportar iconos PNG en Base64 cargados por el administrador
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Rate Limiting general (protección contra saturación)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Demasiadas solicitudes desde esta IP, por favor intente más tarde.' }
});
app.use('/api/', limiter);

// Rutas de la API
const authRoutes = require('./routes/auth');
const appsRoutes = require('./routes/apps');
const usersRoutes = require('./routes/users');
const groupsRoutes = require('./routes/groups');
const statsRoutes = require('./routes/stats');
const auditRoutes = require('./routes/audit');
const userConfigRoutes = require('./routes/userConfig');

app.use('/api/auth', authRoutes);
app.use('/api/apps', appsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/user-config', userConfigRoutes);

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Don Yeyo Manager API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Manejador 404
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada en la API de Don Yeyo Manager' });
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

// Solo escuchar en puerto local si no está corriendo como Serverless Function (Netlify)
if (process.env.NODE_ENV !== 'production' || !process.env.NETLIFY) {
  app.listen(PORT, HOST, () => {
    console.log(`========================================================`);
    console.log(`🚀 Don Yeyo Manager Backend corriendo en http://${HOST}:${PORT}`);
    console.log(`🔒 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS permitido para: ${allowedOrigins.join(', ')}`);
    console.log(`========================================================`);
  });
}

module.exports = app;
