// ════════════════════════════════════════════════════════
//  KreditPlus — Sistema de Servicios Rápidos
//  servicios-modal.js
//  Modales: Pagar Cuota | Quiénes Somos | Estado Crédito | Verificar Asesor
// ════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

  // ── Inicializar Supabase ───────────────────────────────
  let sb = null;
  if (typeof supabase !== 'undefined' && typeof KREDITPLUS_CONFIG !== 'undefined') {
    sb = supabase.createClient(
      KREDITPLUS_CONFIG.supabaseUrl,
      KREDITPLUS_CONFIG.supabaseAnonKey
    );
  }

  // ── Helpers de UI ─────────────────────────────────────
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  function showLoading(btn, text = 'Consultando...') {
    btn._origText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="kpsm-spinner"></span> ${text}`;
  }

  function hideLoading(btn) {
    btn.disabled = false;
    btn.innerHTML = btn._origText || 'Consultar';
  }

  function setResult(el, html, type = 'info') {
    el.className = `kpsm-result kpsm-result--${type}`;
    el.innerHTML = html;
    el.style.display = 'block';
  }

  function clearResult(el) {
    el.style.display = 'none';
    el.innerHTML = '';
  }

  // ── Etiquetas de estado de crédito ───────────────────
  const ESTADO_CONFIG = {
    nuevo:          { label: 'Recibido',          color: '#0b4788', bg: '#e8f0fb' },
    asignado:       { label: 'Asignado a asesor', color: '#7c3aed', bg: '#f3eeff' },
    contactado:     { label: 'Contactado',         color: '#0284c7', bg: '#e0f2fe' },
    en_estudio:     { label: 'En estudio',         color: '#d97706', bg: '#fef9c3' },
    documentacion:  { label: 'Documentación',      color: '#c2410c', bg: '#fff0e6' },
    aprobado:       { label: '✅ Aprobado',        color: '#15803d', bg: '#dcfce7' },
    desembolsado:   { label: '💰 Desembolsado',   color: '#15803d', bg: '#bbf7d0' },
    rechazado:      { label: '❌ No aprobado',     color: '#b91c1c', bg: '#fee2e2' },
    en_espera:      { label: 'En espera',          color: '#92400e', bg: '#fef3c7' },
    cerrado:        { label: 'Cerrado',            color: '#475569', bg: '#f1f5f9' },
  };

  function estadoBadge(estado) {
    const cfg = ESTADO_CONFIG[estado] || { label: estado, color: '#475569', bg: '#f1f5f9' };
    return `<span style="
      display:inline-flex;align-items:center;padding:5px 14px;border-radius:999px;
      font-size:0.85rem;font-weight:700;color:${cfg.color};background:${cfg.bg};
    ">${cfg.label}</span>`;
  }

  // ══════════════════════════════════════════════════════
  //  MODAL: ESTADO DE MI CRÉDITO
  // ══════════════════════════════════════════════════════
  const estadoModal   = document.getElementById('modal-estado');
  if (estadoModal) {
    const form    = $('#kpsm-estado-form', estadoModal);
    const result  = $('#kpsm-estado-result', estadoModal);
    const btn     = $('#kpsm-estado-btn', estadoModal);

    form && form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearResult(result);

      const query = ($('#kpsm-estado-query', estadoModal)?.value || '').trim();
      if (!query) return;

      if (!sb) {
        setResult(result, `
          <div class="kpsm-card kpsm-card--warn">
            <span class="kpsm-icon">⚠️</span>
            <p>Servicio temporalmente no disponible. Escríbenos al <strong>WhatsApp</strong> para consultar tu estado.</p>
            <a class="kpsm-wa-btn" href="https://wa.me/573245654320?text=Quiero%20consultar%20el%20estado%20de%20mi%20crédito" target="_blank">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.86L.057 23.5l5.773-1.512A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.924 0-3.72-.51-5.27-1.395l-.378-.224-3.428.898.917-3.347-.247-.386A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              Ir a WhatsApp
            </a>
          </div>
        `, 'warn');
        return;
      }

      showLoading(btn, 'Consultando...');
      try {
        // Determinar tipo de búsqueda
        const isCedula  = /^\d{5,12}$/.test(query);
        const isEmail   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query);
        const isCelular = /^3\d{9}$/.test(query.replace(/\s/g, ''));

        let sbQuery = sb.from('kreditplus_solicitudes')
          .select('nombre,cedula,celular,email,estado,ciudad,monto,created_at,asesor_id,kreditplus_asesores(nombre,celular)')
          .order('created_at', { ascending: false })
          .limit(5);

        if (isCedula)       sbQuery = sbQuery.eq('cedula', query);
        else if (isEmail)   sbQuery = sbQuery.ilike('email', query);
        else if (isCelular) sbQuery = sbQuery.eq('celular', query.replace(/\s/g, ''));
        else                sbQuery = sbQuery.or(`cedula.eq.${query},celular.eq.${query}`);

        const { data, error } = await sbQuery;

        if (error) {
          setResult(result, `
            <div class="kpsm-card kpsm-card--error">
              <span class="kpsm-icon">⚠️</span>
              <p>No fue posible consultar la información. Inténtalo de nuevo o contáctanos.</p>
            </div>
          `, 'error');
          return;
        }

        if (!data || data.length === 0) {
          setResult(result, `
            <div class="kpsm-card kpsm-card--empty">
              <span class="kpsm-icon">🔍</span>
              <strong>Sin registros encontrados</strong>
              <p>No encontramos ninguna solicitud con ese dato. Verifica que sea correcto o <a href="https://wa.me/573245654320" target="_blank">escríbenos aquí</a>.</p>
            </div>
          `, 'empty');
          return;
        }

        const items = data.map(s => {
          const fecha = new Date(s.created_at).toLocaleDateString('es-CO', { day:'numeric', month:'short', year:'numeric' });
          const asesor = s.kreditplus_asesores?.nombre || null;
          const asesorCel = s.kreditplus_asesores?.celular || '3245654320';
          return `
            <div class="kpsm-estado-card">
              <div class="kpsm-estado-card__header">
                <div>
                  <strong>${s.nombre || 'Cliente KreditPlus'}</strong>
                  <span class="kpsm-fecha">${fecha}</span>
                </div>
                ${estadoBadge(s.estado)}
              </div>
              <div class="kpsm-estado-card__body">
                ${s.ciudad ? `<span>📍 ${s.ciudad}</span>` : ''}
                ${s.monto  ? `<span>💵 ${s.monto}</span>` : ''}
              </div>
              ${asesor ? `
              <div class="kpsm-estado-card__asesor">
                <span>👤 Asesor asignado: <strong>${asesor}</strong></span>
                <a href="https://wa.me/57${asesorCel.replace(/\D/g,'')}?text=Hola%20${encodeURIComponent(asesor)}%2C%20quiero%20consultar%20el%20estado%20de%20mi%20crédito." target="_blank" class="kpsm-wa-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.86L.057 23.5l5.773-1.512A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.924 0-3.72-.51-5.27-1.395l-.378-.224-3.428.898.917-3.347-.247-.386A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                  Contactar asesor
                </a>
              </div>
              ` : `
              <div class="kpsm-estado-card__asesor">
                <span>📋 Tu solicitud está siendo revisada por nuestro equipo.</span>
              </div>
              `}
            </div>
          `;
        }).join('');

        setResult(result, `
          <p class="kpsm-count">${data.length} solicitud${data.length > 1 ? 'es' : ''} encontrada${data.length > 1 ? 's' : ''}:</p>
          ${items}
        `, 'success');

      } catch (err) {
        console.error(err);
        setResult(result, `<div class="kpsm-card kpsm-card--error"><p>Error de conexión. Inténtalo más tarde.</p></div>`, 'error');
      } finally {
        hideLoading(btn);
      }
    });
  }

  // ══════════════════════════════════════════════════════
  //  MODAL: VERIFICAR ASESOR
  // ══════════════════════════════════════════════════════
  const asesorModal = document.getElementById('modal-asesor');
  if (asesorModal) {
    const form   = $('#kpsm-asesor-form', asesorModal);
    const result = $('#kpsm-asesor-result', asesorModal);
    const btn    = $('#kpsm-asesor-btn', asesorModal);

    form && form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearResult(result);
      const query = ($('#kpsm-asesor-query', asesorModal)?.value || '').trim();
      if (!query) return;

      if (!sb) {
        setResult(result, `<div class="kpsm-card kpsm-card--warn"><p>Servicio no disponible. Llámanos al <strong>7403758</strong>.</p></div>`, 'warn');
        return;
      }

      showLoading(btn, 'Verificando...');
      try {
        const isEmail   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query);
        const isCelular = /^3\d{9}$/.test(query.replace(/\s/g, ''));

        let sbQuery = sb.from('kreditplus_asesores')
          .select('nombre,email,celular,zona,activo')
          .limit(3);

        if (isEmail)        sbQuery = sbQuery.ilike('email', query);
        else if (isCelular) sbQuery = sbQuery.eq('celular', query.replace(/\s/g, ''));
        else                sbQuery = sbQuery.ilike('nombre', `%${query}%`);

        const { data, error } = await sbQuery;

        if (error) {
          setResult(result, `<div class="kpsm-card kpsm-card--error"><p>No fue posible consultar. Llámanos al 7403758.</p></div>`, 'error');
          return;
        }

        if (!data || data.length === 0) {
          setResult(result, `
            <div class="kpsm-card kpsm-card--warn">
              <span class="kpsm-icon">❌</span>
              <strong>Asesor no encontrado</strong>
              <p>Esta persona <strong>no aparece</strong> en nuestro directorio oficial. Si alguien se presentó como asesor de KreditPlus, <strong>no realices ningún pago</strong> y repórtalo.</p>
              <a class="kpsm-wa-btn" href="https://wa.me/573245654320?text=Quiero%20reportar%20un%20posible%20fraude" target="_blank">
                🚨 Reportar suplantación
              </a>
            </div>
          `, 'warn');
          return;
        }

        const items = data.map(a => `
          <div class="kpsm-asesor-card ${a.activo ? 'kpsm-asesor-card--activo' : 'kpsm-asesor-card--inactivo'}">
            <div class="kpsm-asesor-avatar">${(a.nombre || 'A').charAt(0).toUpperCase()}</div>
            <div class="kpsm-asesor-info">
              <strong>${a.nombre}</strong>
              ${a.zona ? `<span>📍 ${a.zona}</span>` : ''}
              <span class="kpsm-asesor-status">
                ${a.activo
                  ? '<span class="kpsm-badge kpsm-badge--green">✅ Asesor Activo y Verificado</span>'
                  : '<span class="kpsm-badge kpsm-badge--red">⚠️ Asesor Inactivo</span>'}
              </span>
            </div>
            ${a.activo && a.celular ? `
            <a href="https://wa.me/57${a.celular.replace(/\D/g,'')}?text=Hola%20${encodeURIComponent(a.nombre)}%2C%20te%20contacto%20de%20KreditPlus" target="_blank" class="kpsm-wa-sm kpsm-wa-sm--full">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.86L.057 23.5l5.773-1.512A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.924 0-3.72-.51-5.27-1.395l-.378-.224-3.428.898.917-3.347-.247-.386A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              Contactar directamente
            </a>
            ` : ''}
          </div>
        `).join('');

        setResult(result, items, 'success');

      } catch (err) {
        console.error(err);
        setResult(result, `<div class="kpsm-card kpsm-card--error"><p>Error de conexión.</p></div>`, 'error');
      } finally {
        hideLoading(btn);
      }
    });
  }

  // ══════════════════════════════════════════════════════
  //  APERTURA / CIERRE DE MODALES DE SERVICIO
  // ══════════════════════════════════════════════════════
  let openServiceModal = function(modalId) {
    const m = document.getElementById(modalId);
    if (!m) return;
    m.setAttribute('aria-hidden', 'false');
    m.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeServiceModal(modal) {
    modal.setAttribute('aria-hidden', 'true');
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  // Botones que abren modales de servicio
  document.querySelectorAll('[data-service-modal]').forEach(btn => {
    btn.addEventListener('click', () => openServiceModal(btn.dataset.serviceModal));
  });

  // Botones de cierre
  document.querySelectorAll('[data-service-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('[data-service-modal-root]');
      if (modal) closeServiceModal(modal);
    });
  });

  // Clic en overlay para cerrar
  document.querySelectorAll('[data-service-modal-root]').forEach(m => {
    m.addEventListener('click', (e) => {
      if (e.target === m) closeServiceModal(m);
    });
  });

  // Tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('[data-service-modal-root][aria-hidden="false"]').forEach(m => closeServiceModal(m));
  });


  // ─── MODAL: PAGAR CUOTA (Cuentas dinámicas) ───
  async function loadCuentasPago() {
    const container = document.getElementById('kpsm-pagos-container');
    if (!container) return;

    if (!sb) {
      container.innerHTML = `<div class="kpsm-card kpsm-card--warn"><p>Servicio no disponible temporalmente. Contacte a su asesor.</p></div>`;
      return;
    }

    try {
      const { data, error } = await sb.from('kreditplus_cuentas_pago').select('*').eq('activo', true).order('banco');
      
      if (error) throw error;

      if (!data || data.length === 0) {
        container.innerHTML = `<div class="kpsm-card kpsm-card--empty" style="text-align:center;"><p>No hay cuentas de pago configuradas en este momento. Por favor contacte a su asesor.</p></div>`;
        return;
      }

      const getBgColor = (banco) => {
        banco = banco.toLowerCase();
        if (banco.includes('nequi')) return '#7B2D8B';
        if (banco.includes('bancolombia')) return '#FFDD00';
        if (banco.includes('daviplata') || banco.includes('davivienda')) return '#E30613';
        if (banco.includes('bogota') || banco.includes('bogotá')) return '#009A44';
        if (banco.includes('caja social')) return '#FF6B00';
        return '#0b4788'; // Default
      };

      const getTextColor = (banco) => {
        banco = banco.toLowerCase();
        if (banco.includes('bancolombia')) return '#002B5B';
        return '#ffffff';
      };

      const items = data.map(cta => {
        const bg = getBgColor(cta.banco);
        const txt = getTextColor(cta.banco);
        const shortName = cta.banco.substring(0, 10).toUpperCase();

        // Generar texto para WhatsApp
        let textMsg = `Hola, quiero pagar mi cuota y solicito confirmación de la cuenta: ${cta.banco} (${cta.tipo_cuenta}) - ${cta.numero_cuenta} a nombre de ${cta.titular}`;
        
        return `
          <a href="https://wa.me/573245654320?text=${encodeURIComponent(textMsg)}" target="_blank" style="display:flex;align-items:center;gap:14px;padding:14px;border-radius:14px;border:2px solid #e2f0fa;background:#fff;text-decoration:none;transition:all 0.2s;">
            <div style="width:40px;height:40px;background:${bg};border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:0.55rem;color:${txt};text-align:center;line-height:1.2;flex-shrink:0;">
              ${shortName}
            </div>
            <div style="overflow:hidden;flex-grow:1;">
              <strong style="display:block;color:#0b4788;font-size:0.9rem;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;">${cta.banco}</strong>
              <span style="color:#4d6788;font-size:0.75rem;display:block;">${cta.numero_cuenta}</span>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#31cde4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
          </a>
        `;
      }).join('');

      container.innerHTML = items;

      // Setup form submit global
      const formReportar = document.getElementById('kpsm-form-reportar');
      if(formReportar) {
        // Prevent multiple listeners
        const newForm = formReportar.cloneNode(true);
        formReportar.parentNode.replaceChild(newForm, formReportar);
        
        newForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const btn = document.getElementById('kpsm-rp-btn');
          const msg = document.getElementById('kpsm-rp-msg');
          btn.innerText = 'Subiendo...';
          btn.disabled = true;
          msg.innerHTML = '';
          
          try {
            const cedula = document.getElementById('kpsm-rp-cedula').value;
            const monto = document.getElementById('kpsm-rp-monto').value;
            const fileInput = document.getElementById('kpsm-rp-file');
            const file = fileInput.files[0];
            
            if (!file) throw new Error("Seleccione un comprobante");

            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${cedula}/${fileName}`;
            
            const { error: uploadError } = await sb.storage.from('comprobantes').upload(filePath, file);
            if (uploadError) throw new Error("Error subiendo archivo. Valida el bucket en Supabase.");
            
            const { data: publicUrlData } = sb.storage.from('comprobantes').getPublicUrl(filePath);
            const comprobanteUrl = publicUrlData.publicUrl;

            const { error: insertError } = await sb.from('kreditplus_pagos').insert([{
              cedula, monto, comprobante_url: comprobanteUrl
            }]);
            
            if (insertError) throw insertError;
            
            msg.innerHTML = '<span style="color:#15803d;font-weight:bold;">¡Comprobante enviado exitosamente!</span>';
            newForm.reset();
            setTimeout(() => {
              document.getElementById('kpsm-reportar-container-global').style.display = 'none';
              document.getElementById('kpsm-reportar-container-global').previousElementSibling.style.display = 'flex';
            }, 3000);

          } catch (err) {
            console.error(err);
            msg.innerHTML = `<span style="color:#b91c1c;">${err.message}</span>`;
          } finally {
            btn.innerText = 'Enviar Comprobante';
            btn.disabled = false;
          }
        });
      }


    } catch (err) {
      console.error(err);
      container.innerHTML = `<div class="kpsm-card kpsm-card--error"><p>Error al cargar las cuentas. Inténtalo más tarde.</p></div>`;
    }
  }

  

  // Interceptar la apertura de modal-pagar para cargar las cuentas dinámicas
  const originalOpenServiceModal = openServiceModal;
  openServiceModal = function(modalId) {
    originalOpenServiceModal(modalId);
    if (modalId === 'modal-pagar') {
      loadCuentasPago();
    }
  };
}); // end DOMContentLoaded
