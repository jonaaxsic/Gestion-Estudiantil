/**
 * Cloudflare Pages Function API - Gestión Estudiantil
 * API simple con datos de ejemplo para funcionamiento inmediato
 */

// ===========================================
// CORS HEADERS
// ===========================================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

// ===========================================
// DATOS DE EJEMPLO (SIN CONTRASEÑAS REALES)
// Las contraseñas reales vienen de MongoDB
// ===========================================
const data = {
  usuarios: [
    { _id: "1", nombre: "Admin", apellido: "Sistema", email: "admin@colegio.cl", rol: "admin", password: "", activo: true },
    { _id: "2", nombre: "Juan", apellido: "Pérez", email: "juan@colegio.cl", rol: "docente", password: "", activo: true },
    { _id: "3", nombre: "María", apellido: "García", email: "maria@colegio.cl", rol: "admin", password: "", activo: true },
  ],
  estudiantes: [
    { _id: "1", nombre: "Pedro", apellido: "González", rut: "12345678-9", curso_id: "1" },
    { _id: "2", nombre: "Ana", apellido: "López", rut: "98765432-1", curso_id: "1" },
  ],
  cursos: [
    { _id: "1", nombre: "1° Básico A", nivel: "1° Básico", ano: 2025 },
    { _id: "2", nombre: "2° Básico A", nivel: "2° Básico", ano: 2025 },
  ],
  asistencia: [
    { _id: "1", estudiante_id: "1", curso_id: "1", fecha: "2026-04-07", presente: true },
  ],
  evaluaciones: [
    { _id: "1", curso_id: "1", materia: "Matemáticas", titulo: "Prueba 1", fecha: "2026-04-10" },
  ],
  anotaciones: [
    { _id: "1", estudiante_id: "1", tipo: "positiva", descripcion: "Buena participación", fecha: "2026-04-07" },
  ],
  reuniones: [
    { _id: "1", curso_id: "1", fecha: "2026-04-20", hora: "18:00", lugar: "Sala de Padres" },
  ],
  apoderos: [
    { _id: "1", nombre: "Roberto", apellido: "González", telefono: "+56912345678", estudiante_id: "1" },
  ]
};

// ===========================================
// RESPONSE HELPERS
// ===========================================
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}

function error(msg, status = 400) {
  return json({ error: msg }, status);
}

// ===========================================
// HANDLER
// ===========================================
async function handle(request) {
  if (request.method === "OPTIONS") {
    return new Response("", { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/api\//, "").replace(/\/api$/, "");
  const method = request.method;

  // Root
  if (path === "" || path === "/") {
    return json({ status: "ok", message: "API - Gestión Estudiantil" });
  }

  // Login
  if (path === "auth/login" && method === "POST") {
    const { email, password } = await request.json();
    const user = data.usuarios.find(u => u.email === email && u.activo);
    if (user && user.password === password) {
      const { password: _, ...u } = user;
      return json({ success: true, user: u });
    }
    return error("Credenciales inválidas", 401);
  }

  // Usuarios
  if (path === "usuarios" && method === "GET") {
    return json(data.usuarios.map(({ password, ...u }) => u));
  }

  // Estudiantes
  if (path === "estudiantes" && method === "GET") {
    return json(data.estudiantes);
  }

  // Cursos
  if (path === "cursos" && method === "GET") {
    return json(data.cursos);
  }

  // Asistencia
  if (path === "asistencia" && method === "GET") {
    return json(data.asistencia);
  }

  // Evaluaciones
  if (path === "evaluaciones" && method === "GET") {
    return json(data.evaluaciones);
  }

  // Anotaciones
  if (path === "anotaciones" && method === "GET") {
    return json(data.anotaciones);
  }

  // Reuniones
  if (path === "reuniones" && method === "GET") {
    return json(data.reuniones);
  }

  // Apoderados
  if (path === "apoderados" && method === "GET") {
    return json(data.apoderados);
  }

  return error("No encontrado", 404);
}

// ===========================================
// EXPORTS
// ===========================================
export async function onRequestGet(request) {
  return handle(request);
}

export async function onRequestPost(request) {
  return handle(request);
}

export async function onRequestOptions(request) {
  return new Response("", { status: 204, headers: corsHeaders });
}
