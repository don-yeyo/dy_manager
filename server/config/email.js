const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

/**
 * Servicio de envío de correos SMTP para Don Yeyo Manager
 * Basado en la implementación de dy_firma_remitos
 */
const transporter = nodemailer.createTransport({
  host: process.env.ALERTA_SMTP_HOST || 'smtp-mail.outlook.com',
  port: parseInt(process.env.ALERTA_SMTP_PORT || '587', 10),
  secure: false, // true para 465, false para 587 con STARTTLS
  auth: {
    user: process.env.ALERTA_SMTP_USER || '',
    pass: process.env.ALERTA_SMTP_PASSWORD || ''
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  },
  connectionTimeout: 10000
});

/**
 * Envía una notificación de solicitud de acceso a una aplicación por correo electrónico
 * @param {Object} params
 * @param {Object} params.user - Usuario solicitante { id, email, nombre }
 * @param {Object} params.app - Aplicación solicitada { id, nombre, url, categoria }
 * @param {string} [params.mensaje] - Justificación o mensaje opcional del usuario
 */
async function sendAccessRequestEmail({ user, app, mensaje }) {
  const adminEmailsStr = process.env.EMAIL_DESTINATARIOS_SOLICITUDES || process.env.DEFAULT_ADMIN_EMAIL || '';
  const recipients = adminEmailsStr
    .split(',')
    .map(e => e.trim())
    .filter(e => e.length > 0);

  if (recipients.length === 0) {
    console.warn('[SMTP] No se configuraron destinatarios en EMAIL_DESTINATARIOS_SOLICITUDES ni DEFAULT_ADMIN_EMAIL.');
    return { sent: false, reason: 'Sin destinatarios configurados' };
  }

  const senderName = process.env.ALERTA_SMTP_NAME || 'Don Yeyo Manager';
  const senderEmail = process.env.ALERTA_SMTP_USER || 'soporte@donyeyo.com.ar';

  const subject = `🔔 Solicitud de Acceso: ${user.nombre} solicita permiso para "${app.nombre}"`;

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
      .header { background: #0d2c5c; color: #ffffff; padding: 24px; text-align: center; }
      .header h2 { margin: 0 0 6px 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
      .header p { margin: 0; font-size: 13px; color: #cbd5e1; }
      .content { padding: 28px 24px; }
      .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; background: #e0e7ff; color: #3730a3; }
      .card-info { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0; }
      .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
      .info-label { color: #64748b; font-weight: 600; }
      .info-value { color: #0f172a; font-weight: 700; text-align: right; }
      .message-box { background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; padding: 14px; border-radius: 8px; margin-top: 16px; font-size: 14px; color: #92400e; }
      .footer { font-size: 12px; color: #94a3b8; text-align: center; padding: 18px; border-top: 1px solid #f1f5f9; background: #f8fafc; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h2>Don Yeyo S.A.</h2>
        <p>Portal Corporativo de Sistemas - Don Yeyo Manager</p>
      </div>
      <div class="content">
        <p style="font-size: 15px; margin-top: 0;">Hola Administrador,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">
          El colaborador <strong>${user.nombre}</strong> (<code>${user.email}</code>) tiene asignada la aplicación en modo <em>"Sólo Ver"</em> y ha solicitado la habilitación de acceso directo al siguiente sistema:
        </p>

        <div class="card-info">
          <div class="info-row">
            <span class="info-label">Aplicación:</span>
            <span class="info-value">${app.nombre}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Categoría:</span>
            <span class="info-value">${app.categoria || 'General'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">URL Destino:</span>
            <span class="info-value" style="word-break: break-all;"><a href="${app.url}" style="color: #0d2c5c;">${app.url}</a></span>
          </div>
          <div class="info-row" style="margin-bottom: 0;">
            <span class="info-label">Fecha y Hora:</span>
            <span class="info-value">${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</span>
          </div>
        </div>

        ${mensaje ? `
        <div class="message-box">
          <strong>Mensaje del solicitante:</strong><br>
          "${mensaje}"
        </div>
        ` : ''}

        <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
          Para autorizar o modificar los permisos de este colaborador, ingresá al panel de <strong>Gestor de Aplicaciones &gt; Asignar Accesos</strong> en Don Yeyo Manager.
        </p>
      </div>
      <div class="footer">
        Este es un mensaje automático generado por <strong>Don Yeyo Manager</strong>.
      </div>
    </div>
  </body>
  </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: recipients.join(', '),
      subject,
      html
    });

    console.log(`[SMTP] Solicitud de acceso enviada exitosamente a: ${recipients.join(', ')} (MessageId: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('[SMTP ERROR] Error enviando correo de solicitud de acceso:', error);
    throw error;
  }
}

module.exports = {
  transporter,
  sendAccessRequestEmail
};
