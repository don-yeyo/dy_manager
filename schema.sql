-- ========================================================================
-- DON YEYO MANAGER - SCHEMA DE BASE DE DATOS Y AUDITORÍA POR TRIGGERS
-- Estándar Don Yeyo S.A.
-- Motor: MySQL 8.0+ / MariaDB 10.5+
-- ========================================================================

CREATE DATABASE IF NOT EXISTS `dy_manager` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `dy_manager`;

-- ------------------------------------------------------------------------
-- 1. TABLA: usuarios
-- Guarda el personal corporativo sincronizado mediante Microsoft SSO (Entra ID)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `nombre` VARCHAR(150) NOT NULL,
  `rol` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_usuarios_email` (`email`),
  INDEX `idx_usuarios_rol` (`rol`)
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------
-- 2. TABLA: grupos
-- Conjunto de usuarios que comparten permisos a aplicaciones
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `grupos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL UNIQUE,
  `descripcion` VARCHAR(255) NULL,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------
-- 3. TABLA: usuarios_grupos (Relación N:M)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios_grupos` (
  `usuario_id` INT NOT NULL,
  `grupo_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`usuario_id`, `grupo_id`),
  CONSTRAINT `fk_ug_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ug_grupo` FOREIGN KEY (`grupo_id`) REFERENCES `grupos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------
-- 4. TABLA: aplicaciones
-- Catálogo de herramientas y sistemas de la empresa
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `aplicaciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` TEXT NULL,
  `url` VARCHAR(500) NOT NULL,
  `icono` MEDIUMTEXT NULL,
  `categoria` VARCHAR(50) NOT NULL DEFAULT 'General',
  `color` VARCHAR(25) NOT NULL DEFAULT '#0d2c5c',
  `orden` INT NOT NULL DEFAULT 0,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_apps_activo` (`activo`),
  INDEX `idx_apps_categoria` (`categoria`)
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------
-- 5. TABLA: asignaciones_usuarios
-- Asignación directa de una aplicación a un usuario particular
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `asignaciones_usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` INT NOT NULL,
  `aplicacion_id` INT NOT NULL,
  `asignado_por` VARCHAR(150) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_usuario_app` (`usuario_id`, `aplicacion_id`),
  CONSTRAINT `fk_au_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_au_app` FOREIGN KEY (`aplicacion_id`) REFERENCES `aplicaciones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------
-- 6. TABLA: asignaciones_grupos
-- Asignación de una aplicación a todos los miembros de un grupo
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `asignaciones_grupos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `grupo_id` INT NOT NULL,
  `aplicacion_id` INT NOT NULL,
  `asignado_por` VARCHAR(150) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_grupo_app` (`grupo_id`, `aplicacion_id`),
  CONSTRAINT `fk_ag_grupo` FOREIGN KEY (`grupo_id`) REFERENCES `grupos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ag_app` FOREIGN KEY (`aplicacion_id`) REFERENCES `aplicaciones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------
-- 7. TABLA: auditoria
-- Tabla inmutable que se alimenta EXCLUSIVAMENTE mediante TRIGGERS
-- Registra creaciones, modificaciones y eliminaciones de entidades críticas.
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `auditoria` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `tabla_afectada` VARCHAR(50) NOT NULL,
  `operacion` ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  `registro_id` VARCHAR(100) NOT NULL,
  `datos_anteriores` JSON NULL,
  `datos_nuevos` JSON NULL,
  `usuario_responsable` VARCHAR(150) NULL,
  `fecha` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_auditoria_tabla` (`tabla_afectada`),
  INDEX `idx_auditoria_operacion` (`operacion`),
  INDEX `idx_auditoria_fecha` (`fecha`)
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------
-- 8. TABLA: estadisticas_accesos
-- Registra cada ingreso/click a un enlace del tablero.
-- [REGLA EXPRESA: NO DEBE TENER TRIGGERS DE AUDITORÍA]
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `estadisticas_accesos` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `aplicacion_id` INT NOT NULL,
  `usuario_id` INT NULL,
  `email_usuario` VARCHAR(150) NOT NULL,
  `ip_origen` VARCHAR(45) NULL,
  `user_agent` VARCHAR(255) NULL,
  `fecha_acceso` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_stats_app` (`aplicacion_id`),
  INDEX `idx_stats_user` (`usuario_id`),
  INDEX `idx_stats_fecha` (`fecha_acceso`),
  CONSTRAINT `fk_ea_app` FOREIGN KEY (`aplicacion_id`) REFERENCES `aplicaciones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ea_user` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------
-- 9. TABLA: usuario_tablero_config
-- Guarda la personalización de cada usuario: secciones con titulares y orden
-- Se sincroniza en todos los dispositivos desde los que ingrese el usuario.
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuario_tablero_config` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` INT NOT NULL UNIQUE,
  `configuracion` JSON NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_utc_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ========================================================================
-- TRIGGERS DE AUDITORÍA AUTOMÁTICA
-- Utilizan la variable de sesión @app_current_user si está definida;
-- de lo contrario recurren a CURRENT_USER().
-- ========================================================================

DELIMITER $$

-- ------------------------------------------------------------------------
-- TRIGGERS PARA: usuarios
-- ------------------------------------------------------------------------
DROP TRIGGER IF EXISTS `trg_usuarios_insert`$$
CREATE TRIGGER `trg_usuarios_insert`
AFTER INSERT ON `usuarios`
FOR EACH ROW
BEGIN
  INSERT INTO `auditoria` (`tabla_afectada`, `operacion`, `registro_id`, `datos_anteriores`, `datos_nuevos`, `usuario_responsable`)
  VALUES (
    'usuarios',
    'INSERT',
    NEW.id,
    NULL,
    JSON_OBJECT('id', NEW.id, 'email', NEW.email, 'nombre', NEW.nombre, 'rol', NEW.rol, 'activo', NEW.activo),
    COALESCE(@app_current_user, CURRENT_USER())
  );
END$$

DROP TRIGGER IF EXISTS `trg_usuarios_update`$$
CREATE TRIGGER `trg_usuarios_update`
AFTER UPDATE ON `usuarios`
FOR EACH ROW
BEGIN
  INSERT INTO `auditoria` (`tabla_afectada`, `operacion`, `registro_id`, `datos_anteriores`, `datos_nuevos`, `usuario_responsable`)
  VALUES (
    'usuarios',
    'UPDATE',
    NEW.id,
    JSON_OBJECT('id', OLD.id, 'email', OLD.email, 'nombre', OLD.nombre, 'rol', OLD.rol, 'activo', OLD.activo),
    JSON_OBJECT('id', NEW.id, 'email', NEW.email, 'nombre', NEW.nombre, 'rol', NEW.rol, 'activo', NEW.activo),
    COALESCE(@app_current_user, CURRENT_USER())
  );
END$$

DROP TRIGGER IF EXISTS `trg_usuarios_delete`$$
CREATE TRIGGER `trg_usuarios_delete`
AFTER DELETE ON `usuarios`
FOR EACH ROW
BEGIN
  INSERT INTO `auditoria` (`tabla_afectada`, `operacion`, `registro_id`, `datos_anteriores`, `datos_nuevos`, `usuario_responsable`)
  VALUES (
    'usuarios',
    'DELETE',
    OLD.id,
    JSON_OBJECT('id', OLD.id, 'email', OLD.email, 'nombre', OLD.nombre, 'rol', OLD.rol, 'activo', OLD.activo),
    NULL,
    COALESCE(@app_current_user, CURRENT_USER())
  );
END$$

-- ------------------------------------------------------------------------
-- TRIGGERS PARA: grupos
-- ------------------------------------------------------------------------
DROP TRIGGER IF EXISTS `trg_grupos_insert`$$
CREATE TRIGGER `trg_grupos_insert`
AFTER INSERT ON `grupos`
FOR EACH ROW
BEGIN
  INSERT INTO `auditoria` (`tabla_afectada`, `operacion`, `registro_id`, `datos_anteriores`, `datos_nuevos`, `usuario_responsable`)
  VALUES (
    'grupos',
    'INSERT',
    NEW.id,
    NULL,
    JSON_OBJECT('id', NEW.id, 'nombre', NEW.nombre, 'descripcion', NEW.descripcion, 'activo', NEW.activo),
    COALESCE(@app_current_user, CURRENT_USER())
  );
END$$

DROP TRIGGER IF EXISTS `trg_grupos_update`$$
CREATE TRIGGER `trg_grupos_update`
AFTER UPDATE ON `grupos`
FOR EACH ROW
BEGIN
  INSERT INTO `auditoria` (`tabla_afectada`, `operacion`, `registro_id`, `datos_anteriores`, `datos_nuevos`, `usuario_responsable`)
  VALUES (
    'grupos',
    'UPDATE',
    NEW.id,
    JSON_OBJECT('id', OLD.id, 'nombre', OLD.nombre, 'descripcion', OLD.descripcion, 'activo', OLD.activo),
    JSON_OBJECT('id', NEW.id, 'nombre', NEW.nombre, 'descripcion', NEW.descripcion, 'activo', NEW.activo),
    COALESCE(@app_current_user, CURRENT_USER())
  );
END$$

DROP TRIGGER IF EXISTS `trg_grupos_delete`$$
CREATE TRIGGER `trg_grupos_delete`
AFTER DELETE ON `grupos`
FOR EACH ROW
BEGIN
  INSERT INTO `auditoria` (`tabla_afectada`, `operacion`, `registro_id`, `datos_anteriores`, `datos_nuevos`, `usuario_responsable`)
  VALUES (
    'grupos',
    'DELETE',
    OLD.id,
    JSON_OBJECT('id', OLD.id, 'nombre', OLD.nombre, 'descripcion', OLD.descripcion, 'activo', OLD.activo),
    NULL,
    COALESCE(@app_current_user, CURRENT_USER())
  );
END$$

-- ------------------------------------------------------------------------
-- TRIGGERS PARA: usuarios_grupos
-- ------------------------------------------------------------------------
DROP TRIGGER IF EXISTS `trg_usuarios_grupos_insert`$$
CREATE TRIGGER `trg_usuarios_grupos_insert`
AFTER INSERT ON `usuarios_grupos`
FOR EACH ROW
BEGIN
  INSERT INTO `auditoria` (`tabla_afectada`, `operacion`, `registro_id`, `datos_anteriores`, `datos_nuevos`, `usuario_responsable`)
  VALUES (
    'usuarios_grupos',
    'INSERT',
    CONCAT(NEW.usuario_id, '-', NEW.grupo_id),
    NULL,
    JSON_OBJECT('usuario_id', NEW.usuario_id, 'grupo_id', NEW.grupo_id),
    COALESCE(@app_current_user, CURRENT_USER())
  );
END$$

DROP TRIGGER IF EXISTS `trg_usuarios_grupos_delete`$$
CREATE TRIGGER `trg_usuarios_grupos_delete`
AFTER DELETE ON `usuarios_grupos`
FOR EACH ROW
BEGIN
  INSERT INTO `auditoria` (`tabla_afectada`, `operacion`, `registro_id`, `datos_anteriores`, `datos_nuevos`, `usuario_responsable`)
  VALUES (
    'usuarios_grupos',
    'DELETE',
    CONCAT(OLD.usuario_id, '-', OLD.grupo_id),
    JSON_OBJECT('usuario_id', OLD.usuario_id, 'grupo_id', OLD.grupo_id),
    NULL,
    COALESCE(@app_current_user, CURRENT_USER())
  );
END$$

-- ------------------------------------------------------------------------
-- TRIGGERS PARA: aplicaciones
-- ------------------------------------------------------------------------
DROP TRIGGER IF EXISTS `trg_aplicaciones_insert`$$
CREATE TRIGGER `trg_aplicaciones_insert`
AFTER INSERT ON `aplicaciones`
FOR EACH ROW
BEGIN
  INSERT INTO `auditoria` (`tabla_afectada`, `operacion`, `registro_id`, `datos_anteriores`, `datos_nuevos`, `usuario_responsable`)
  VALUES (
    'aplicaciones',
    'INSERT',
    NEW.id,
    NULL,
    JSON_OBJECT('id', NEW.id, 'nombre', NEW.nombre, 'url', NEW.url, 'icono', NEW.icono, 'categoria', NEW.categoria, 'activo', NEW.activo),
    COALESCE(@app_current_user, CURRENT_USER())
  );
END$$

DROP TRIGGER IF EXISTS `trg_aplicaciones_update`$$
CREATE TRIGGER `trg_aplicaciones_update`
AFTER UPDATE ON `aplicaciones`
FOR EACH ROW
BEGIN
  INSERT INTO `auditoria` (`tabla_afectada`, `operacion`, `registro_id`, `datos_anteriores`, `datos_nuevos`, `usuario_responsable`)
  VALUES (
    'aplicaciones',
    'UPDATE',
    NEW.id,
    JSON_OBJECT('id', OLD.id, 'nombre', OLD.nombre, 'url', OLD.url, 'icono', OLD.icono, 'categoria', OLD.categoria, 'activo', OLD.activo),
    JSON_OBJECT('id', NEW.id, 'nombre', NEW.nombre, 'url', NEW.url, 'icono', NEW.icono, 'categoria', NEW.categoria, 'activo', NEW.activo),
    COALESCE(@app_current_user, CURRENT_USER())
  );
END$$

DROP TRIGGER IF EXISTS `trg_aplicaciones_delete`$$
CREATE TRIGGER `trg_aplicaciones_delete`
AFTER DELETE ON `aplicaciones`
FOR EACH ROW
BEGIN
  INSERT INTO `auditoria` (`tabla_afectada`, `operacion`, `registro_id`, `datos_anteriores`, `datos_nuevos`, `usuario_responsable`)
  VALUES (
    'aplicaciones',
    'DELETE',
    OLD.id,
    JSON_OBJECT('id', OLD.id, 'nombre', OLD.nombre, 'url', OLD.url, 'icono', OLD.icono, 'categoria', OLD.categoria, 'activo', OLD.activo),
    NULL,
    COALESCE(@app_current_user, CURRENT_USER())
  );
END$$

-- ------------------------------------------------------------------------
-- TRIGGERS PARA: asignaciones_usuarios
-- ------------------------------------------------------------------------
DROP TRIGGER IF EXISTS `trg_asig_usuarios_insert`$$
CREATE TRIGGER `trg_asig_usuarios_insert`
AFTER INSERT ON `asignaciones_usuarios`
FOR EACH ROW
BEGIN
  INSERT INTO `auditoria` (`tabla_afectada`, `operacion`, `registro_id`, `datos_anteriores`, `datos_nuevos`, `usuario_responsable`)
  VALUES (
    'asignaciones_usuarios',
    'INSERT',
    NEW.id,
    NULL,
    JSON_OBJECT('id', NEW.id, 'usuario_id', NEW.usuario_id, 'aplicacion_id', NEW.aplicacion_id, 'asignado_por', NEW.asignado_por),
    COALESCE(@app_current_user, CURRENT_USER())
  );
END$$

DROP TRIGGER IF EXISTS `trg_asig_usuarios_delete`$$
CREATE TRIGGER `trg_asig_usuarios_delete`
AFTER DELETE ON `asignaciones_usuarios`
FOR EACH ROW
BEGIN
  INSERT INTO `auditoria` (`tabla_afectada`, `operacion`, `registro_id`, `datos_anteriores`, `datos_nuevos`, `usuario_responsable`)
  VALUES (
    'asignaciones_usuarios',
    'DELETE',
    OLD.id,
    JSON_OBJECT('id', OLD.id, 'usuario_id', OLD.usuario_id, 'aplicacion_id', OLD.aplicacion_id, 'asignado_por', OLD.asignado_por),
    NULL,
    COALESCE(@app_current_user, CURRENT_USER())
  );
END$$

-- ------------------------------------------------------------------------
-- TRIGGERS PARA: asignaciones_grupos
-- ------------------------------------------------------------------------
DROP TRIGGER IF EXISTS `trg_asig_grupos_insert`$$
CREATE TRIGGER `trg_asig_grupos_insert`
AFTER INSERT ON `asignaciones_grupos`
FOR EACH ROW
BEGIN
  INSERT INTO `auditoria` (`tabla_afectada`, `operacion`, `registro_id`, `datos_anteriores`, `datos_nuevos`, `usuario_responsable`)
  VALUES (
    'asignaciones_grupos',
    'INSERT',
    NEW.id,
    NULL,
    JSON_OBJECT('id', NEW.id, 'grupo_id', NEW.grupo_id, 'aplicacion_id', NEW.aplicacion_id, 'asignado_por', NEW.asignado_por),
    COALESCE(@app_current_user, CURRENT_USER())
  );
END$$

DROP TRIGGER IF EXISTS `trg_asig_grupos_delete`$$
CREATE TRIGGER `trg_asig_grupos_delete`
AFTER DELETE ON `asignaciones_grupos`
FOR EACH ROW
BEGIN
  INSERT INTO `auditoria` (`tabla_afectada`, `operacion`, `registro_id`, `datos_anteriores`, `datos_nuevos`, `usuario_responsable`)
  VALUES (
    'asignaciones_grupos',
    'DELETE',
    OLD.id,
    JSON_OBJECT('id', OLD.id, 'grupo_id', OLD.grupo_id, 'aplicacion_id', OLD.aplicacion_id, 'asignado_por', OLD.asignado_por),
    NULL,
    COALESCE(@app_current_user, CURRENT_USER())
  );
END$$

DELIMITER ;

-- ========================================================================
-- DATOS SEMILLA (SEEDS) INICIALES
-- ========================================================================

-- Usuario Administrador Inicial
INSERT INTO `usuarios` (`email`, `nombre`, `rol`, `activo`)
VALUES ('admin@donyeyo.com.ar', 'Administrador General', 'admin', 1)
ON DUPLICATE KEY UPDATE `rol` = 'admin';

-- Grupos Corporativos Iniciales
INSERT INTO `grupos` (`nombre`, `descripcion`) VALUES
('Dirección General', 'Gerencia y directivos'),
('Planta & Producción', 'Supervisores y operarios de planta'),
('Mantenimiento', 'Técnicos electromecánicos y jefatura'),
('Logística & Expedición', 'Encargados de despacho y transporte'),
('Portería & Seguridad', 'Control de accesos y vigilancia')
ON DUPLICATE KEY UPDATE `nombre` = `nombre`;

-- Aplicaciones Semilla de Don Yeyo (admite dominios, IPs privadas, puertos y queries)
INSERT INTO `aplicaciones` (`nombre`, `descripcion`, `url`, `icono`, `categoria`, `color`, `orden`) VALUES
('CIE - Control de Ingresos y Egresos', 'Gestión integral de accesos vehiculares, choferes y proveedores a planta', 'https://cie.donyeyo.com.ar', 'ShieldCheck', 'Seguridad', '#0d2c5c', 1),
('COT - Operaciones de Traslado', 'Generación, consulta y seguimiento de códigos COT para despachos', 'https://cot.donyeyo.com.ar/app?origen=portal', 'Truck', 'Logística', '#e40521', 2),
('SHIGMA - Higiene y Seguridad', 'Inspecciones, auditorías preventivas e incidentes laborales', 'http://192.168.1.150:8080/shigma', 'HardHat', 'Seguridad', '#f59e0b', 3),
('Finnegans Addons', 'Integraciones contables, reportes de stock y facturación de planta', 'http://192.168.1.120:3000/finnegans', 'Layers', 'Administración', '#10b981', 4)
ON DUPLICATE KEY UPDATE `nombre` = `nombre`;

-- Asignación inicial: Apps a grupos
-- CIE a Portería y Dirección
INSERT IGNORE INTO `asignaciones_grupos` (`grupo_id`, `aplicacion_id`, `asignado_por`)
SELECT g.id, a.id, 'SISTEMA_INIT'
FROM `grupos` g, `aplicaciones` a
WHERE g.nombre IN ('Portería & Seguridad', 'Dirección General') AND a.nombre LIKE 'CIE%';

-- COT a Logística
INSERT IGNORE INTO `asignaciones_grupos` (`grupo_id`, `aplicacion_id`, `asignado_por`)
SELECT g.id, a.id, 'SISTEMA_INIT'
FROM `grupos` g, `aplicaciones` a
WHERE g.nombre IN ('Logística & Expedición') AND a.nombre LIKE 'COT%';
