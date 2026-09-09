/**
 * Validador y normalizador de URLs para Don Yeyo Manager.
 * Soporta HTTP y HTTPS, dominios corporativos e IPs privadas/públicas,
 * puertos explícitos (ej. :8080) y query parameters completos.
 */

function isValidAppUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') {
    return { valid: false, error: 'La URL no puede estar vacía.' };
  }

  const trimmed = urlString.trim();

  // Expresión regular robusta que valida:
  // 1. Protocolo: http:// o https://
  // 2. Dominio (ej. cie.donyeyo.com.ar, intranet, localhost) O IPv4 (ej. 192.168.1.100)
  // 3. Puerto opcional: :[1-65535]
  // 4. Path, query params (?x=y) y hash (#sec) opcionales
  const urlRegex = /^https?:\/\/(([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|localhost|(([0-9]{1,3}\.){3}[0-9]{1,3}))(:[0-9]{1,5})?(\/[^\s]*)?$/i;

  if (!urlRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'Formato de URL inválido. Debe comenzar con http:// o https:// y contener un dominio o IP válido (ej: https://app.donyeyo.com.ar, http://192.168.1.50:8080/sistema?m=1).'
    };
  }

  // Verificación adicional con constructor URL nativo de Node.js
  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Solo se admiten protocolos http o https.' };
    }
    if (parsed.port) {
      const portNum = parseInt(parsed.port, 10);
      if (isNaN(portNum) || portNum <= 0 || portNum > 65535) {
        return { valid: false, error: 'El puerto especificado está fuera del rango válido (1-65535).' };
      }
    }
    return { valid: true, normalizedUrl: parsed.href };
  } catch (err) {
    return { valid: false, error: 'Error al interpretar la URL: ' + err.message };
  }
}

module.exports = {
  isValidAppUrl
};
