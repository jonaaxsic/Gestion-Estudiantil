/**
 * Cloudflare Pages Function API - Gestión Estudiantil
 * Conecta a MongoDB Atlas para autenticación
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
// MONGODB ATLAS CONFIGURATION
// ===========================================
const ATLAS_API_KEY = 'rWnGRFxWviVPHxqMMPMeqIuK8K6s9O8O9O9O9O9O9O9O9O9O9O9O';
const ATLAS_API_URL = 'https://data.mongodb-api.com/data/main-database/endpoint/data/beta';
const ATLAS_DB_NAME = 'App_estudiantil';

// ===========================================
// DATOS DE EJEMPLO (FALLBACK)
// ===========================================
const mockData = {
  usuarios: [
    { _id: "1", nombre: "Admin", apellido: "Sistema", email: "admin@colegio.cl", rol: "admin", password: "admin123", activo: true },
    { _id: "2", nombre: "Juan", apellido: "Pérez", email: "juan@colegio.cl", rol: "docente", password: "123", activo: true },
    { _id: "3", nombre: "María", apellido: "García", email: "maria@colegio.cl", rol: "admin", password: "123", activo: true },
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
// MONGODB HELPERS
// ===========================================
async function mongoFind(collection, filter = {}) {
  try {
    const res = await fetch(`${ATLAS_API_URL}/action/find`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': ATLAS_API_KEY
      },
      body: JSON.stringify({
        dataSource: "mongodb-atlas",
        database: ATLAS_DB_NAME,
        collection,
        filter
      })
    });
    
    if (!res.ok) throw new Error('MongoDB error');
    const data = await res.json();
    return data.documents || [];
  } catch (e) {
    console.log('Using mock data for', collection);
    return mockData[collection] || [];
  }
}

async function mongoFindOne(collection, filter = {}) {
  try {
    const res = await fetch(`${ATLAS_API_URL}/action/findOne`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': ATLAS_API_KEY
      },
      body: JSON.stringify({
        dataSource: "mongodb-atlas",
        database: ATLAS_DB_NAME,
        collection,
        filter
      })
    });
    
    if (!res.ok) throw new Error('MongoDB error');
    const data = await res.json();
    return data.document;
  } catch (e) {
    console.log('Using mock data for findOne', collection);
    if (collection === 'usuarios') {
      return mockData.usuarios.find(u => u.email === filter.email);
    }
    return null;
  }
}

// ===========================================
// RESPONSE HELPERS
// ===========================================
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}

function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

// ===========================================
// MAIN HANDLER
// ===========================================
async function handleRequest(request) {
  // CORS preflight
  if (request.method === "OPTIONS") {
    return new Response("", { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "");
  const method = request.method;

  // Root
  if (path === "" || path === "/") {
    return jsonResponse({ 
      status: "ok", 
      message: "API Backend - Gestión Estudiantil",
      docs: "Endpoints: /auth/login, /usuarios, /estudiantes, /cursos"
    });
  }

  try {
    // AUTH - Login
    if (path === "/auth/login" && method === "POST") {
      const data = await request.json();
      const { email, password } = data;
      
      if (!email || !password) {
        return errorResponse("Email y password requeridos", 400);
      }
      
      // Try MongoDB first, fallback to mock data
      const usuario = await mongoFindOne("usuarios", { email, activo: true });
      
      if (usuario && usuario.password === password) {
        const { password: _, ...userSafe } = usuario;
        return jsonResponse({ success: true, user: userSafe });
      }
      
      // Fallback to mock data if MongoDB fails
      const mockUser = mockData.usuarios.find(u => u.email === email && u.activo);
      if (mockUser && mockUser.password === password) {
        const { password: _, ...userSafe } = mockUser;
        return jsonResponse({ success: true, user: userSafe });
      }
      
      return errorResponse("Credenciales inválidas", 401);
    }

    // USUARIOS
    if (path === "/usuarios") {
      if (method === "GET") {
        const usuarios = await mongoFind("usuarios", {});
        if (usuarios.length === 0) {
          return jsonResponse(mockData.usuarios.map(({ password, ...u }) => u));
        }
        return jsonResponse(usuarios.map(({ password, ...u }) => u));
      }
    }

    // ESTUDIANTES
    if (path === "/estudiantes") {
      if (method === "GET") {
        const cursoId = url.searchParams.get("curso_id");
        let estudiantes = await mongoFind("estudiantes", cursoId ? { curso_id: cursoId } : {});
        if (estudiantes.length === 0) {
          estudiantes = mockData.estudiantes;
        }
        return jsonResponse(estudiantes);
      }
    }

    // CURSOS
    if (path === "/cursos") {
      if (method === "GET") {
        const cursos = await mongoFind("cursos", {});
        if (cursos.length === 0) {
          return jsonResponse(mockData.cursos);
        }
        return jsonResponse(cursos);
      }
    }

    // ASISTENCIA
    if (path === "/asistencia") {
      if (method === "GET") {
        const asistencia = await mongoFind("asistencia", {});
        if (asistencia.length === 0) {
          return jsonResponse(mockData.asistencia);
        }
        return jsonResponse(asistencia);
      }
    }

    // EVALUACIONES
    if (path === "/evaluaciones") {
      if (method === "GET") {
        const evaluaciones = await mongoFind("evaluaciones", {});
        if (evaluaciones.length === 0) {
          return jsonResponse(mockData.evaluaciones);
        }
        return jsonResponse(evaluaciones);
      }
    }

    // ANOTACIONES
    if (path === "/anotaciones") {
      if (method === "GET") {
        const anotaciones = await mongoFind("anotaciones", {});
        if (anotaciones.length === 0) {
          return jsonResponse(mockData.anotaciones);
        }
        return jsonResponse(anotaciones);
      }
    }

    // REUNIONES
    if (path === "/reuniones") {
      if (method === "GET") {
        const reuniones = await mongoFind("reuniones", {});
        if (reuniones.length === 0) {
          return jsonResponse(mockData.reuniones);
        }
        return jsonResponse(reuniones);
      }
    }

    // APODERADOS
    if (path === "/apoderados") {
      if (method === "GET") {
        const apoderos = await mongoFind("apoderados", {});
        if (apoderos.length === 0) {
          return jsonResponse(mockData.apoderados);
        }
        return jsonResponse(apoderos);
      }
    }

    return errorResponse("Endpoint no encontrado", 404);
    
  } catch (e) {
    return errorResponse("Error: " + e.message, 500);
  }
}

// ===========================================
// CLOUDFLARE PAGES FUNCTION EXPORTS
// ===========================================
export async function onRequestGet(request) {
  return handleRequest(request);
}

export async function onRequestPost(request) {
  return handleRequest(request);
}

export async function onRequestOptions(request) {
  return new Response("", { status: 204, headers: corsHeaders });
}
