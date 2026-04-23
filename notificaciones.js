// ═══════════════════════════════════════════════════════════
// KreditPlus — Sistema de Notificaciones por Correo (Resend)
// ═══════════════════════════════════════════════════════════

const RESEND_API_KEY = 're_aquí_tu_api_key_de_resend'; // ⚠️ Reemplazar
const ADMIN_EMAIL = 'admin@tudominio.com'; // ⚠️ Reemplazar cuando lo tengas

// Función base para enviar el correo
async function sendEmail(to, subject, htmlContent) {
  if (RESEND_API_KEY.includes('aquí_tu_api')) {
    console.warn("Resend API Key no configurada. Simulado el envío a:", to);
    return;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'KreditPlus Notificaciones <onboarding@resend.dev>', // ⚠️ Cambiar cuando verifiques tu dominio en Resend
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        html: htmlContent
      })
    });
    const data = await response.json();
    console.log("Correo enviado:", data);
  } catch (err) {
    console.error("Error enviando correo:", err);
  }
}

// ─── PLANTILLAS PROFESIONALES HTML ─────────────────────────────────

// 1. Nueva Solicitud (Llega al Admin)
async function notificarNuevoLeadAdmin(lead) {
  const subject = `🔥 Nuevo Lead: ${lead.nombre} - ${lead.monto}`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: #0b4788; padding: 24px; text-align: center;">
        <h2 style="color: #fff; margin: 0;">KreditPlus</h2>
        <p style="color: #31cde4; margin: 4px 0 0;">Nueva solicitud de crédito</p>
      </div>
      <div style="padding: 32px 24px;">
        <p>Hola Administrador,</p>
        <p>Un nuevo cliente acaba de dejar sus datos en la página web. Ingresa al panel para asignarlo a un asesor.</p>
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 8px;"><strong>Nombre:</strong> ${lead.nombre}</p>
          <p style="margin: 0 0 8px;"><strong>Celular:</strong> ${lead.celular}</p>
          <p style="margin: 0 0 8px;"><strong>Ciudad:</strong> ${lead.ciudad}</p>
          <p style="margin: 0 0 8px;"><strong>Producto:</strong> ${lead.tipo_credito}</p>
          <p style="margin: 0;"><strong>Monto:</strong> ${lead.monto}</p>
        </div>
        <a href="http://localhost:8080/admin.html" style="display: inline-block; background: #0b4788; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">Ir al Panel Master</a>
      </div>
    </div>
  `;
  await sendEmail(ADMIN_EMAIL, subject, html);
}

// 2. Lead Asignado a Asesor (Llega al Asesor y copia al Admin)
async function notificarAsignacionLead(lead, asesor) {
  const subject = `🎯 Nuevo cliente asignado: ${lead.nombre}`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: #22c55e; padding: 24px; text-align: center;">
        <h2 style="color: #fff; margin: 0;">Nuevo Cliente Asignado</h2>
      </div>
      <div style="padding: 32px 24px;">
        <p>Hola <strong>${asesor.nombre}</strong>,</p>
        <p>Se te ha asignado un nuevo cliente para gestión comercial. Por favor contáctalo lo antes posible.</p>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 8px;"><strong>Cliente:</strong> ${lead.nombre}</p>
          <p style="margin: 0 0 8px;"><strong>Celular:</strong> ${lead.celular}</p>
          <p style="margin: 0 0 8px;"><strong>Interés:</strong> ${lead.tipo_credito} (${lead.monto})</p>
        </div>
        <a href="http://localhost:8080/asesor.html" style="display: inline-block; background: #22c55e; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">Ver mi panel</a>
      </div>
    </div>
  `;
  // Enviar al asesor, con copia al admin
  await sendEmail([asesor.email, ADMIN_EMAIL], subject, html);
}

// 3. Cambio de Estado (Llega al Admin)
async function notificarCambioEstado(lead, asesor, nuevoEstado) {
  const colors = {
    'contactado': '#f59e0b', // Amarillo
    'en_estudio': '#3b82f6', // Azul
    'aprobado': '#22c55e',   // Verde
    'rechazado': '#ef4444'   // Rojo
  };
  const color = colors[nuevoEstado] || '#64748b';

  const subject = `🔄 Actualización de Lead: ${lead.nombre} está en ${nuevoEstado}`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: ${color}; padding: 24px; text-align: center;">
        <h2 style="color: #fff; margin: 0;">Avance de Negocio</h2>
      </div>
      <div style="padding: 32px 24px;">
        <p>Hola Administrador,</p>
        <p>El asesor <strong>${asesor.nombre}</strong> ha actualizado el estado de un lead.</p>
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 8px;"><strong>Cliente:</strong> ${lead.nombre}</p>
          <p style="margin: 0 0 8px;"><strong>Celular:</strong> ${lead.celular}</p>
          <p style="margin: 0; font-size: 1.1em;"><strong>Nuevo Estado:</strong> <span style="color: ${color}; text-transform: uppercase; font-weight: bold;">${nuevoEstado}</span></p>
        </div>
      </div>
    </div>
  `;
  await sendEmail(ADMIN_EMAIL, subject, html);
}
