# Don Yeyo Manager

Portal y Hub centralizado para nuclear el acceso a todas las herramientas y sistemas web corporativos de **Don Yeyo S.A.** Permite a los colaboradores acceder a sus aplicaciones de trabajo en un tablero interactivo según sus permisos asignados (individualmente o por pertenencia a grupos), garantizando seguridad, auditoría atómica mediante Triggers de base de datos y estadísticas de uso en tiempo real.

---

## 🌟 Características Principales

1. **Tablero de Aplicaciones Dinámico (RBAC):**
   - Muestra a cada usuario únicamente los sistemas autorizados a los que tiene permiso (asignación directa al usuario o heredada a través de sus grupos).
   - Buscador interactivo en tiempo real por nombre, descripción o área.
   - Filtros dinámicos por categorías (Seguridad, Logística, Producción, Administración, etc.).
   - Apertura segura en nueva pestaña (`rel="noopener noreferrer"`).
   - Soporte total para enlaces:
     - Protocolos: `http://` y `https://`.
     - Destinos: Nombres de dominio FQDN (`cie.donyeyo.com.ar`) e IPs privadas o públicas (`192.168.1.150`, `10.0.0.50`).
     - Puertos explícitos: `:8080`, `:3000`, `:8443`, etc.
     - Rutas y parámetros de consulta: `/sistema/modulo?origen=portal&emp=1`.

2. **Gestor de Roles y Grupos:**
   - Roles iniciales: `admin` (administrador general) y `user` (usuario estándar).
   - Los administradores pueden crear grupos corporativos (ej. *Planta & Producción*, *Mantenimiento*, *Dirección*, *Portería*) y asignar aplicaciones tanto a un grupo entero como a usuarios individuales.

3. **Auditoría Inmutable mediante TRIGGERS de MySQL:**
   - La base de datos cuenta con triggers automáticos `AFTER INSERT`, `AFTER UPDATE` y `AFTER DELETE` en todas las entidades críticas (`usuarios`, `grupos`, `usuarios_grupos`, `aplicaciones`, `asignaciones_usuarios`, `asignaciones_grupos`).
   - Registra snapshots completos en formato `JSON` (`datos_anteriores` y `datos_nuevos`), asociando la fecha y el usuario responsable mediante la variable de sesión `@app_current_user`.
   - Visor de auditoría integrado de **solo lectura** para el Administrador con comparador visual de cambios (Diff JSON).

4. **Estadísticas de Accesos a la Botonera:**
   - Registra cada ingreso/clic a un enlace de la botonera en la tabla `estadisticas_accesos` (con fecha, usuario, IP y navegador).
   - **Regla estricta:** Esta tabla **NO** tiene triggers de auditoría para garantizar alta concurrencia y no contaminar los logs de cambios administrativos.
   - Panel de estadísticas de **solo lectura** para el Administrador con métricas KPI, rankings de aplicaciones más utilizadas y logs detallados.

5. **Autenticación SSO Microsoft (Entra ID) & Modo Mock:**
   - Soporte nativo para inicio de sesión corporativo con cuentas Office 365 (`@donyeyo.com.ar`) usando MSAL (`@azure/msal-browser` y `@azure/msal-react`).
   - Sincronización automática de usuarios al iniciar sesión.
   - **Bypass de Desarrollo (Mock Auth):** Permite trabajar y depurar localmente sin conexión activa a Azure AD mediante `VITE_MOCK_AUTH=true`.

6. **Estética y Sistema de Diseño Don Yeyo:**
   - Basado en el estándar corporativo de `dy_control_ingresos_egresos`.
   - Vanilla CSS modular con variables CSS (`--dy-blue: #0d2c5c`, `--dy-red: #e40521`).
   - Efectos Glassmorphic con `backdrop-filter`, tema Claro y Oscuro persistido en el navegador, Header corporativo y Drawer retráctil con control de acceso por rol.

---

## 🏛️ Arquitectura del Monorepo

```
DonYeyoMannager/
├── package.json               # Scripts concurrentes raíz (dev, install-all, build)
├── .gitignore                 # Reglas de exclusión para Git
├── .env.template              # Plantilla de variables de entorno global
├── .env                       # Variables locales del proyecto
├── schema.sql                 # DDL de MySQL con tablas, índices, seeds y TRIGGERS
├── README.md                  # Documentación principal del sistema
├── client/                    # Frontend React 19 + Vite 6
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── .env.template
│   ├── .env
│   ├── public/
│   │   └── favicon.svg        # Isotipo Don Yeyo
│   └── src/
│       ├── index.css          # Tokens CSS Don Yeyo, glassmorphism y tema oscuro
│       ├── main.jsx           # Entrypoint con MsalProvider y ThemeProvider
│       ├── App.jsx            # Enrutamiento y Route Guards (Auth & Admin)
│       ├── config/
│       │   ├── msal.js        # Configuración Azure AD
│       │   ├── AuthContext.jsx# Estado de autenticación SSO y Mock
│       │   └── ThemeContext.jsx # Manejador de tema claro/oscuro
│       ├── components/
│       │   ├── Layout.jsx     # Contenedor con Header y Drawer
│       │   ├── Header.jsx     # Barra superior con logo, toggle tema y avatar
│       │   ├── Drawer.jsx     # Menú lateral responsivo con RBAC
│       │   ├── AppCard.jsx    # Tarjeta de aplicación con métricas y apertura
│       │   ├── Modal.jsx      # Diálogos emergentes con glassmorphism
│       │   ├── Button.jsx     # Botones primarios, secundarios y de peligro
│       │   └── FormElements.jsx # Inputs, selects y textareas
│       ├── pages/
│       │   ├── Login.jsx      # Pantalla de bienvenida Don Yeyo
│       │   ├── Dashboard.jsx  # Tablero de aplicaciones asignadas
│       │   ├── AdminApps.jsx  # Gestor de catálogo y asignación de apps
│       │   ├── AdminUsersGroups.jsx # Gestor de usuarios, roles y grupos
│       │   ├── AuditLog.jsx   # Visor de auditoría por triggers (solo lectura)
│       │   └── StatsDashboard.jsx # Panel de estadísticas de accesos (solo lectura)
│       └── services/
│           └── api.js         # Cliente Axios e interceptor de sesión
└── server/                    # Backend Node.js Express
    ├── package.json
    ├── index.js               # Entrypoint con Helmet, CORS, Morgan y Rate-limit
    ├── .env.template
    ├── .env
    ├── config/
    │   └── db.js              # Pool MySQL y executeWithUser para triggers
    ├── middlewares/
    │   ├── authMiddleware.js  # Verificador de usuario autenticado
    │   └── roleGuard.js       # Verificador de rol admin
    ├── utils/
    │   └── urlValidator.js    # Validador de URLs con dominios, IPs, puertos y queries
    └── routes/
        ├── auth.js            # Sync de usuario SSO
        ├── apps.js            # CRUD de aplicaciones y asignaciones
        ├── users.js           # CRUD de usuarios y cambio de roles
        ├── groups.js          # CRUD de grupos corporativos y miembros
        ├── stats.js           # Registro de clics y reportes
        └── audit.js           # Consulta de auditoría inmutable
```

---

## 🗄️ Base de Datos y Triggers de Auditoría

El archivo [`schema.sql`](file:///c:/Users/gabrielt/Documents/Proyectos/DonYeyoMannager/schema.sql) contiene la estructura completa para MySQL 8.0 o MariaDB 10.5+:

### Tablas:
1. `usuarios`: personal corporativo sincronizado por Microsoft SSO.
2. `grupos`: grupos de trabajo (ej. *Planta*, *Dirección*, *Logística*).
3. `usuarios_grupos`: relación de miembros en cada grupo.
4. `aplicaciones`: catálogo de sistemas con nombre, descripción, URL completa, icono y color.
5. `asignaciones_usuarios`: asignación individual de una app a un usuario.
6. `asignaciones_grupos`: asignación colectiva de una app a un grupo.
7. `auditoria`: **alimentada automáticamente mediante TRIGGERS** con `datos_anteriores` y `datos_nuevos` en JSON, operación (`INSERT`, `UPDATE`, `DELETE`) y `usuario_responsable`.
8. `estadisticas_accesos`: registros de clics y visitas a cada enlace (**sin triggers de auditoría** por diseño).

### Triggers automáticos incluidos:
- `trg_usuarios_insert`, `trg_usuarios_update`, `trg_usuarios_delete`
- `trg_grupos_insert`, `trg_grupos_update`, `trg_grupos_delete`
- `trg_usuarios_grupos_insert`, `trg_usuarios_grupos_delete`
- `trg_aplicaciones_insert`, `trg_aplicaciones_update`, `trg_aplicaciones_delete`
- `trg_asig_usuarios_insert`, `trg_asig_usuarios_delete`
- `trg_asig_grupos_insert`, `trg_asig_grupos_delete`

---

## ⚙️ Variables de Entorno

Toda la configuración se encuentra parametrizada sin ningún tipo de hardcodeo. Revisa los archivos `.env.template` en la raíz, en `client/` y en `server/`:

| Variable | Descripción | Valor por Defecto |
| :--- | :--- | :--- |
| `PORT` | Puerto de escucha del backend Express | `3001` |
| `HOST` | Host del servidor backend | `0.0.0.0` |
| `DB_HOST` | Host de la base de datos MySQL | `localhost` |
| `DB_PORT` | Puerto del motor MySQL | `3306` |
| `DB_USER` | Usuario de MySQL | `root` |
| `DB_PASSWORD` | Contraseña de MySQL | `root` |
| `DB_NAME` | Nombre de la base de datos | `dy_manager` |
| `CORS_ORIGIN` | Origen frontend permitido para peticiones | `http://localhost:5173` |
| `DEFAULT_ADMIN_EMAIL` | Email al que se le otorga rol admin automáticamente | `admin@donyeyo.com.ar` |
| `VITE_API_URL` | URL base de la API consumida por el frontend | `http://localhost:3001/api` |
| `VITE_AZURE_AD_CLIENT_ID`| Client ID (Application ID) de Azure AD / Entra ID | `00000000-0000-...` |
| `VITE_AZURE_AD_TENANT_ID`| Tenant ID del directorio de Microsoft Entra | `common` |
| `VITE_MOCK_AUTH` | Habilita el bypass de autenticación para desarrollo local | `true` |
| `VITE_MOCK_AUTH_EMAIL` | Email utilizado durante el modo Mock | `admin@donyeyo.com.ar` |

---

## 🚀 Puesta en Marcha (Instalación Rápida)

### 1. Clonar el repositorio y configurar variables:
```bash
# Copiar las plantillas a los archivos .env
cp .env.template .env
cp client/.env.template client/.env
cp server/.env.template server/.env
```

### 2. Inicializar la base de datos MySQL:
Ejecuta el script SQL en tu cliente de base de datos preferido (DBeaver, MySQL Workbench o terminal):
```bash
mysql -u root -p < schema.sql
```

### 3. Instalar dependencias de todo el monorepo:
Desde la raíz del proyecto:
```bash
npm run install-all
```

### 4. Iniciar en entorno de desarrollo con Hot-Reload:
```bash
npm run dev
```
Este comando ejecutará concurrentemente:
- **Backend Express:** en `http://localhost:3001` (con recarga automática mediante `nodemon`).
- **Frontend Vite:** en `http://localhost:5173` (con Fast Refresh instantáneo).

---

## 🔐 Configuración de Microsoft Entra ID (Azure AD SSO)

Para producción o pruebas con el inquilino real de Microsoft:
1. Ingresa a [Microsoft Entra Admin Center](https://entra.microsoft.com/).
2. Ve a **Aplicaciones > Registro de aplicaciones > Nuevo registro**.
3. Registra el nombre de la app (ej. `Don Yeyo Manager`).
4. Tipo de cuenta: *Solo las cuentas de este directorio organizativo (inquilino único)* o *Multiinquilino*.
5. URI de redirección: Plataforma **SPA (Single Page Application)** con valor `http://localhost:5173` (y la URL de producción correspondiente).
6. Copia el **Id. de aplicación (cliente)** y el **Id. de directorio (inquilino)** en los archivos `.env` (`VITE_AZURE_AD_CLIENT_ID` y `VITE_AZURE_AD_TENANT_ID`).
7. Desactiva el modo mock en `.env`: `VITE_MOCK_AUTH=false`.
