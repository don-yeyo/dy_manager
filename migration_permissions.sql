-- ========================================================================
-- DON YEYO MANAGER - MIGRACIÓN DE PERMISOS Y SEGURIDAD
-- 1. Agrega columna requiere_seguridad a aplicaciones
-- 2. Agrega columna tipo_permiso a asignaciones_usuarios y asignaciones_grupos
-- ========================================================================

USE `dy_manager`;

-- 1. Columna requiere_seguridad en aplicaciones (por defecto 1 = requiere asignación)
SET @exist_col = (
  SELECT COUNT(*) FROM information_schema.columns 
  WHERE table_schema = DATABASE() AND table_name = 'aplicaciones' AND column_name = 'requiere_seguridad'
);
SET @sql_stmt = IF(@exist_col = 0, 'ALTER TABLE `aplicaciones` ADD COLUMN `requiere_seguridad` TINYINT(1) NOT NULL DEFAULT 1 AFTER `activo`', 'SELECT 1');
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Columna tipo_permiso en asignaciones_usuarios ('acceso' | 'solo_ver')
SET @exist_col = (
  SELECT COUNT(*) FROM information_schema.columns 
  WHERE table_schema = DATABASE() AND table_name = 'asignaciones_usuarios' AND column_name = 'tipo_permiso'
);
SET @sql_stmt = IF(@exist_col = 0, 'ALTER TABLE `asignaciones_usuarios` ADD COLUMN `tipo_permiso` ENUM(\'acceso\', \'solo_ver\') NOT NULL DEFAULT \'acceso\' AFTER `asignado_por`', 'SELECT 1');
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Columna tipo_permiso en asignaciones_grupos ('acceso' | 'solo_ver')
SET @exist_col = (
  SELECT COUNT(*) FROM information_schema.columns 
  WHERE table_schema = DATABASE() AND table_name = 'asignaciones_grupos' AND column_name = 'tipo_permiso'
);
SET @sql_stmt = IF(@exist_col = 0, 'ALTER TABLE `asignaciones_grupos` ADD COLUMN `tipo_permiso` ENUM(\'acceso\', \'solo_ver\') NOT NULL DEFAULT \'acceso\' AFTER `asignado_por`', 'SELECT 1');
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Actualizar triggers de auditoría para contemplar los nuevos campos
DELIMITER $$

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
    JSON_OBJECT('id', NEW.id, 'nombre', NEW.nombre, 'url', NEW.url, 'icono', NEW.icono, 'categoria', NEW.categoria, 'activo', NEW.activo, 'requiere_seguridad', NEW.requiere_seguridad),
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
    JSON_OBJECT('id', OLD.id, 'nombre', OLD.nombre, 'url', OLD.url, 'icono', OLD.icono, 'categoria', OLD.categoria, 'activo', OLD.activo, 'requiere_seguridad', OLD.requiere_seguridad),
    JSON_OBJECT('id', NEW.id, 'nombre', NEW.nombre, 'url', NEW.url, 'icono', NEW.icono, 'categoria', NEW.categoria, 'activo', NEW.activo, 'requiere_seguridad', NEW.requiere_seguridad),
    COALESCE(@app_current_user, CURRENT_USER())
  );
END$$

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
    JSON_OBJECT('id', NEW.id, 'usuario_id', NEW.usuario_id, 'aplicacion_id', NEW.aplicacion_id, 'asignado_por', NEW.asignado_por, 'tipo_permiso', NEW.tipo_permiso),
    COALESCE(@app_current_user, CURRENT_USER())
  );
END$$

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
    JSON_OBJECT('id', NEW.id, 'grupo_id', NEW.grupo_id, 'aplicacion_id', NEW.aplicacion_id, 'asignado_por', NEW.asignado_por, 'tipo_permiso', NEW.tipo_permiso),
    COALESCE(@app_current_user, CURRENT_USER())
  );
END$$

DELIMITER ;
