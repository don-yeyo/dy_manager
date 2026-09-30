const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Cargar variables de entorno desde la raíz o server/.env
const rootEnvPath = path.resolve(__dirname, '../../.env');
const serverEnvPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
} else {
  dotenv.config();
}

const CSV_PATH = path.resolve(__dirname, '../../docs/relevamiento apps gestionpanificadodonyeyo@gmail.csv');
const RESPONSIBLE_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || 'gabrielt@donyeyo.com.ar';

function parseDateToMySql(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.trim().split(/[\/\-]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')} 00:00:00`;
    } else {
      // DD/MM/YYYY
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day} 00:00:00`;
    }
  }
  return null;
}

function getCategoryColor(category) {
  switch ((category || '').trim()) {
    case 'Panificado PE':
      return '#0d2c5c';
    case 'Panificado HY':
      return '#1e3a8a';
    case 'SEH':
      return '#d97706';
    case 'Laboratorio ER':
      return '#059669';
    case 'RRHH':
      return '#7c3aed';
    default:
      return '#0d2c5c';
  }
}

async function runImport() {
  console.log('--- INICIO DE IMPORTACIÓN DE APLICACIONES ---');
  console.log(`Leyendo CSV desde: ${CSV_PATH}`);
  
  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`El archivo CSV no existe en la ruta: ${CSV_PATH}`);
  }

  const rawCsv = fs.readFileSync(CSV_PATH, 'utf8');
  const lines = rawCsv.split(/\r?\n/).filter(l => l.trim().length > 0);
  const headers = lines[0].split(';').map(h => h.trim());

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(';');
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = (parts[idx] || '').trim();
    });
    rows.push(row);
  }

  console.log(`Total de filas detectadas en el CSV: ${rows.length}`);

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectTimeout: 10000
  });

  try {
    // Definir usuario responsable para auditoría por triggers
    await conn.query('SET @app_current_user = ?', [RESPONSIBLE_EMAIL]);

    // Verificar existencia de los grupos Directorio (1) y Sistemas (3)
    const [targetGroups] = await conn.query('SELECT id, nombre FROM grupos WHERE id IN (1, 3)');
    console.log('Grupos destino verificados en BD:', targetGroups);
    if (targetGroups.length < 2) {
      console.warn('[ADVERTENCIA] No se encontraron ambos grupos (Directorio id=1 y Sistemas id=3). Verifique la tabla grupos.');
    }

    // Obtener orden actual máximo
    const [[{ max_orden }]] = await conn.query('SELECT COALESCE(MAX(orden), 0) as max_orden FROM aplicaciones');
    let currentOrden = max_orden;

    console.log(`Último orden registrado en aplicaciones: ${currentOrden}`);

    let insertCount = 0;
    let assignmentCount = 0;
    let skippedCount = 0;

    for (const item of rows) {
      const nombre = item.nombre;
      const url = item.url;
      const descripcion = item.descripcion || null;
      const categoria = item.categoria || 'General';
      const color = getCategoryColor(categoria);
      const icono = 'AppWindow';
      
      const activo = item.activo && item.activo.toLowerCase() === 'no' ? 0 : 1;
      const requiere_seguridad = 1;
      const updatedAtVal = parseDateToMySql(item['Actualizado']) || '2026-09-01 00:00:00';
      const createdAtVal = updatedAtVal; // Respetamos la fecha del relevamiento

      // Verificar si ya existe por nombre o URL para evitar duplicados en re-ejecuciones
      const [existing] = await conn.query(
        'SELECT id FROM aplicaciones WHERE url = ? OR nombre = ?',
        [url, nombre]
      );

      let appId;
      if (existing.length > 0) {
        appId = existing[0].id;
        console.log(`Aplicación existente "${nombre}" (ID: ${appId}). Actualizando updated_at...`);
        await conn.query(
          'UPDATE aplicaciones SET updated_at = ?, categoria = ?, activo = ? WHERE id = ?',
          [updatedAtVal, categoria, activo, appId]
        );
        skippedCount++;
      } else {
        currentOrden += 1;
        const [insertRes] = await conn.query(
          `INSERT INTO aplicaciones 
            (nombre, descripcion, url, icono, categoria, color, orden, activo, requiere_seguridad, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [nombre, descripcion, url, icono, categoria, color, currentOrden, activo, requiere_seguridad, createdAtVal, updatedAtVal]
        );
        appId = insertRes.insertId;
        insertCount++;
      }

      // Asignar al grupo Directorio (id = 1) y Sistemas (id = 3) con tipo_permiso = 'acceso'
      const gruposIds = [1, 3];
      for (const gId of gruposIds) {
        const [assignRes] = await conn.query(
          `INSERT INTO asignaciones_grupos (grupo_id, aplicacion_id, asignado_por, tipo_permiso, created_at)
           VALUES (?, ?, ?, 'acceso', NOW())
           ON DUPLICATE KEY UPDATE tipo_permiso = 'acceso'`,
          [gId, appId, RESPONSIBLE_EMAIL]
        );
        if (assignRes.affectedRows > 0) {
          assignmentCount++;
        }
      }
    }

    console.log('----------------------------------------------------');
    console.log(`Importación finalizada con éxito:`);
    console.log(`- Aplicaciones insertadas: ${insertCount}`);
    console.log(`- Aplicaciones ya existentes actualizadas: ${skippedCount}`);
    console.log(`- Asignaciones a grupos creadas/verificadas: ${assignmentCount}`);
    console.log('----------------------------------------------------');

  } catch (err) {
    console.error('[ERROR EN IMPORTACIÓN]:', err);
    throw err;
  } finally {
    try {
      await conn.query('SET @app_current_user = NULL');
    } catch (_) {}
    await conn.end();
  }
}

runImport().catch(err => {
  console.error(err);
  process.exit(1);
});
