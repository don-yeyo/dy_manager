# Don Yeyo Manager

Portal y Hub centralizado para nuclear el acceso a todas las herramientas y sistemas web corporativos de **Don Yeyo S.A.** Permite a los colaboradores acceder a sus aplicaciones de trabajo en un tablero interactivo según sus permisos asignados (individualmente o por pertenencia a grupos), garantizando seguridad, auditoría atómica mediante Triggers de base de datos, estadísticas de uso en tiempo real, soporte PWA y despliegue serverless en **Netlify Functions**.

---

## 🌟 Características Principales

1. **Tablero de Aplicaciones Dinámico (RBAC) y Personalizable:**
   - Muestra a cada usuario únicamente los sistemas autorizados a los que tiene permiso (asignación directa al usuario o heredada a través de sus grupos).
   - **Personalización del Tablero por Usuario:**
     - El usuario puede crear sus propias agrupaciones bajo titulares personalizados (ej. *Mis Favoritos*, *Accesos Diarios*, *Planta & Operaciones*).
     - Permite reordenar los enlaces en la grilla y moverlos entre secciones.
     - Se persiste en la tabla `usuario_tablero_config` de MySQL, manteniendo la misma configuración desde cualquier dispositivo (smartphone, tablet o PC de escritorio).
   - Buscador interactivo en tiempo real por nombre, descripción o área.
   - Filtros dinámicos por categorías (*Seguridad*, *Logística*, *Producción*, *Administración*, etc.).
   - Apertura segura en nueva pestaña (`rel="noopener noreferrer"`).
   - Soporte total para enlaces:
     - Protocolos: `http://` y `https://`.
     - Destinos: Nombres de dominio FQDN (`cie.donyeyo.com.ar`) e IPs privadas o públicas (`192.168.1.150`, `10.0.0.50`).
     - Puertos explícitos: `:8080`, `:3000`, `:8443`, etc.
     - Rutas y parámetros de consulta: `/sistema/modulo?origen=portal&emp=1`.

2. **Iconos Opcionales Persistidos en Base de Datos (PNG Base64 o Flat Icons):**
   - El administrador puede configurar opcionalmente un icono para cada aplicación.
   - Soporta catálogo de iconos flat vectoriales (Lucide) o subida directa de imágenes PNG/SVG.
   - Las imágenes se comprimen a canvas (máx 128x128) y se guardan como Data URL en Base64 en la columna `icono` (`MEDIUMTEXT`) de MySQL, permitiendo funcionamiento 100% serverless en Netlify sin requerir almacenamiento de archivos local.

3. **PWA (Progressive Web App):**
   - La aplicación es instalable en dispositivos móviles y de escritorio gracias a `vite-plugin-pwa`.
   - Incluye manifest corporativo Don Yeyo, iconos optimizados (192x192 y 512x512 maskable) y service worker automático para precaching de assets estáticos.

4. **Insignia de Versión Dinámica:**
   - La versión mostrada en el Header corporativo se toma automáticamente desde la línea 3 de `package.json` mediante la constante `__APP_VERSION__` inyectada en Vite.

5. **Auditoría Inmutable mediante TRIGGERS de MySQL:**
   - Triggers automáticos `AFTER INSERT`, `AFTER UPDATE` y `AFTER DELETE` en todas las entidades críticas (`usuarios`, `grupos`, `usuarios_grupos`, `aplicaciones`, `asignaciones_usuarios`, `asignaciones_grupos`).
   - Registra snapshots completos en formato `JSON` (`datos_anteriores` y `datos_nuevos`), asociando la fecha y el usuario responsable mediante la variable de sesión `@app_current_user`.
   - Visor de auditoría integrado de **solo lectura** para el Administrador con comparador visual de cambios (Diff JSON).

6. **Estadísticas de Accesos a la Botonera:**
   - Registra cada ingreso/clic a un enlace en `estadisticas_accesos` (con fecha, usuario, IP y navegador).
   - **Regla estricta:** Esta tabla **NO** tiene triggers de auditoría para garantizar alta concurrencia y no contaminar los logs administrativos.
   - Panel de estadísticas de **solo lectura** para el Administrador con métricas KPI, rankings de aplicaciones más visitadas y logs detallados.

7. **Seguridad y Encapsulación Estricta:**
   - Ninguna credencial ni dato crítico de la base de datos es expuesto en el frontend.
   - Toda la lógica sensible queda encapsulada en el backend / Netlify Functions detrás de middlewares de autenticación y validación de roles.

8. **Autenticación SSO Microsoft (Entra ID) & Modo Mock:**
   - Soporte nativo para inicio de sesión corporativo con cuentas Office 365 (`@donyeyo.com.ar`) usando MSAL.
   - Sincronización automática de usuarios al iniciar sesión.
   - **Bypass de Desarrollo (Mock Auth):** Permite trabajar y depurar localmente sin conexión activa a Azure AD mediante `VITE_MOCK_AUTH=true`.

9. **Estética y Sistema de Diseño Don Yeyo:**
   - Basado en el estándar de `dy_control_ingresos_egresos`.
   - Vanilla CSS modular con variables CSS (`--dy-blue: #0d2c5c`, `--dy-red: #e40521`).
   - Efectos Glassmorphic con `backdrop-filter`, tema Claro y Oscuro persistido en el navegador, Header corporativo y Drawer retráctil con RBAC.

10. **Detector de Pérdida de Conexión a Base de Datos (`DbConnectionGuard`):**
    - Idéntico al estándar implementado en `dy_shigma`.
    - Monitorea periódicamente el estado de MySQL vía polling cada `VITE_DB_CONNECTION_CHECK_INTERVAL` segundos (por defecto 90s) contra el endpoint `/api/system/db-status`.
    - Captura inmediatamente cualquier error 500 o fallo de red en peticiones Axios mediante un CustomEvent global (`api-request-failed`), verificando al instante el estado de la BD.
    - Despliega un Modal crítico no cerrable con aviso visual y botón de reintento ("Reintentar Conexión"). Al restablecer la comunicación, recarga la aplicación automáticamente para evitar inconsistencias de estado.

11. **Vista Mobile Optimizada (Botonera Smartphone, Buscador Sticky & DYM):**
    - En dispositivos móviles, la barra superior se compacta mostrando el isotipo y las siglas **DY<span style="color:#e40521">M</span>** (con la M roja) junto a la versión sutil del aplicativo.
    - **Buscador Sticky de Ancho Completo:** Se ubica inmediatamente después del Navbar ocupando todo el ancho. Al desplazarse por la pantalla, el Navbar superior escrolea con la página pero el buscador se pega automáticamente al tope superior (`position: sticky; top: 0`), manteniéndose accesible en todo momento.
    - **Acceso a Personalización desde el Navbar:** Incorpora un botón con icono (`SlidersHorizontal`) directamente en la barra superior para abrir el modal de personalización del tablero tanto en escritorio como en mobile.
    - **Avatar Simétrico con Alto Contraste:** Botón concéntrico simétrico y fondo circular de alto contraste (Rojo Don Yeyo para Administradores y Azul corporativo saturado para Usuarios) garantizando legibilidad total del texto interno en temas Claro y Oscuro.
    - El titular *"Tablero de Aplicaciones"* se remueve en mobile y si el usuario cuenta con un solo agrupamiento, se oculta el título redundante.
    - Las tarjetas de acceso se transforman en una **botonera compacta táctil estilo smartphone** (apps con icono grande y nombre a dos líneas).
    - Para los usuarios regulares (`rol: 'user'`), se desactiva el Drawer menú lateral, ofreciendo una experiencia enfocada y minimalista.

12. **Aplicaciones Públicas, Permisos Diferenciados y Solicitud por Email:**
    - **No requiere seguridad:** Las aplicaciones marcadas como públicas (`requiere_seguridad = 0`) están disponibles automáticamente para todos los colaboradores de la empresa sin requerir asignación explícita.
    - **Tipos de Permiso:** Cada asignación a usuario o grupo define si la persona **"Puede acceder"** (ingreso directo) o **"Sólo puede ver"**.
    - **Solicitud de Acceso por Email (SMTP):** Al pulsar sobre una aplicación en modo *Sólo ver*, se abre un modal de solicitud que remite un correo corporativo formateado (idéntico al motor SMTP de `dy_firma_remitos`) a los administradores definidos en `EMAIL_DESTINATARIOS_SOLICITUDES`.

---

## 🏛️ Arquitectura y Despliegue en Netlify

```
DonYeyoMannager/
├── netlify.toml               # Configuración de Netlify: build, redirects y funciones
├── schema.sql                 # DDL de MySQL con tablas, índices, seeds y TRIGGERS
├── README.md                  # Documentación principal del sistema
├── package.json               # Versión de la herramienta y scripts generales
├── .env.template              # Plantilla de variables de entorno global
├── .gitignore                 # Reglas limpias de exclusión para Git
├── client/                    # Frontend React 19 + Vite 6 + PWA
│   ├── package.json           # Dependencias cliente autónomas
│   ├── vite.config.js         # Configuración Vite, PWA y define __APP_VERSION__
│   ├── index.html             # Entrypoint HTML con viewport y Google Fonts
│   ├── public/
│   │   ├── favicon.svg        # Isotipo Don Yeyo
│   │   └── icons/             # Iconos PWA (icon-192x192.png, icon-512x512.png)
│   └── src/
│       ├── index.css          # Tokens CSS Don Yeyo, glassmorphism y tema oscuro
│       ├── main.jsx           # Entrypoint con MsalProvider y ThemeProvider
│       ├── App.jsx            # Enrutamiento y Route Guards (Auth & Admin)
│       ├── config/            # AuthContext, ThemeContext, msal.js
│       ├── components/        # Layout, Header, Drawer, AppCard, Modal, Button, FormElements
│       ├── pages/             # Dashboard, AdminApps, AdminUsersGroups, AuditLog, StatsDashboard, Login
│       └── services/          # Cliente Axios (AuthService, AppsService, UserConfigService, etc.)
└── server/                    # Backend Node.js Express + Serverless Function
    ├── package.json           # Dependencias backend autónomas
    ├── index.js               # Servidor Express con Helmet, CORS, Morgan y Rate-limit
    ├── netlify-handler.js     # Handler serverless-http para Netlify Functions
    ├── config/
    │   └── db.js              # Pool MySQL y executeWithUser para triggers
    ├── middlewares/           # authMiddleware.js, roleGuard.js
    ├── utils/                 # urlValidator.js
    └── routes/                # auth.js, apps.js, users.js, groups.js, stats.js, audit.js, userConfig.js
```

### Configuración de Netlify Functions (`netlify.toml`)
Netlify compila automáticamente el cliente y mapea las rutas API:
- **Build Command:** `npm run build --prefix client`
- **Publish Directory:** `client/dist`
- **Functions Directory:** `server`
- **Redirects:**
  - `/api/*` -> `/.netlify/functions/netlify-handler/api/:splat` (200)
  - `/*` -> `/index.html` (200)

---

## 🗄️ Base de Datos y Triggers de Auditoría

El archivo [`schema.sql`](file:///c:/Users/gabrielt/Documents/Proyectos/DonYeyoMannager/schema.sql) contiene la estructura completa para MySQL 8.0 o MariaDB 10.5+:

### Tablas:
1. `usuarios`: personal corporativo sincronizado por Microsoft SSO.
2. `grupos`: grupos de trabajo (ej. *Planta*, *Dirección*, *Logística*).
3. `usuarios_grupos`: relación N:M de miembros en cada grupo.
4. `aplicaciones`: catálogo de sistemas con `icono` en `MEDIUMTEXT NULL` (soporta PNG base64 y flat icons).
5. `asignaciones_usuarios`: asignación individual de una app a un usuario.
6. `asignaciones_grupos`: asignación colectiva de una app a un grupo.
7. `auditoria`: **alimentada automáticamente mediante TRIGGERS** con `datos_anteriores` y `datos_nuevos` en JSON, operación (`INSERT`, `UPDATE`, `DELETE`) y `usuario_responsable`.
8. `estadisticas_accesos`: registros de clics y visitas a cada enlace (**sin triggers de auditoría** por diseño).
9. `usuario_tablero_config`: almacena la personalización de secciones, titulares y orden del tablero por cada usuario en formato JSON.

---

## 🚀 Ejecución en Entorno Local (Independiente)

Cada subproyecto (`client` y `server`) cuenta con sus propios `node_modules` y scripts independientes, por lo que **no se requiere `node_modules` en la raíz**:

### 1. Iniciar Backend (Terminal 1):
```bash
cd server
npm install   # (solo la primera vez)
npm run dev
```
Escuchará en `http://localhost:3001`.

### 2. Iniciar Frontend (Terminal 2):
```bash
cd client
npm install   # (solo la primera vez)
npm run dev
```
Abrirá el portal PWA en `http://localhost:5173`.
