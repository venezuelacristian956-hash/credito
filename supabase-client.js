// ═══════════════════════════════════════════════════════════
// KreditPlus — Configuración de Supabase
// ═══════════════════════════════════════════════════════════
// PASO 1: Ve a https://supabase.com y crea un proyecto gratuito
// PASO 2: En Settings → API, copia tu Project URL y tu anon public key
// PASO 3: Reemplaza los valores de abajo
// PASO 4: En el SQL Editor de Supabase, ejecuta el archivo SUPABASE_SETUP.sql
// ═══════════════════════════════════════════════════════════

const KREDITPLUS_CONFIG = {
  supabaseUrl: 'https://vvxiddhwdgqdkyfoqttn.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2eGlkZGh3ZGdxZGt5Zm9xdHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NzA4NzcsImV4cCI6MjA5MjQ0Njg3N30._ef5ymGsisYTVaoG6PmDs77Xedb8VccQS0W3ffARbZI',
  adminPassword: 'kreditplus2024'
};

// Inicializar cliente Supabase (se usa si la librería ya está cargada en la página)
let supabaseClient = null;

function initSupabase() {
  if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(
      KREDITPLUS_CONFIG.supabaseUrl,
      KREDITPLUS_CONFIG.supabaseAnonKey
    );
    console.log('%cKreditPlus + Supabase conectado OK', 'color:#31cde4;font-weight:bold');
    return true;
  }
  console.warn('Supabase SDK no cargado aun.');
  return false;
}

// Guardar solicitud de crédito (formulario hero del home)
async function guardarSolicitud(datos) {
  if (!supabaseClient) {
    console.warn('Supabase no inicializado. Solicitud guardada solo localmente.');
    return { error: 'no_config' };
  }
  const { data, error } = await supabaseClient
    .from('kreditplus_solicitudes')
    .insert([datos]);
  if (error) {
    console.error('Error guardando solicitud:', error);
  } else if (typeof notificarNuevoLeadAdmin === 'function') {
    // Disparar correo al Admin de forma asíncrona (no bloquea al usuario)
    notificarNuevoLeadAdmin(datos);
  }
  return { data, error };
}

// Guardar mensaje de contacto (formulario de contacto.html)
async function guardarContacto(datos) {
  if (!supabaseClient) {
    console.warn('Supabase no inicializado. Contacto guardado solo localmente.');
    return { error: 'no_config' };
  }
  const { data, error } = await supabaseClient
    .from('kreditplus_contactos')
    .insert([datos]);
  if (error) console.error('Error guardando contacto:', error);
  return { data, error };
}
