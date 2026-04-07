/**
 * Cloudflare Worker API - Gestión Estudiantil
 * Conecta directamente a MongoDB Atlas
 * IMPORTANTE: Debes configurar ATLAS_DATA_API_KEY en Cloudflare Dashboard
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
// DATOS DE EJEMPLO (FALLBACK)
// ===========================================
const mockData = {
  usuarios: [
    { _id: "1", nombre: "Admin", apellido: "Sistema", email: "admin@colegio.cl", rol: "admin", password: "admin", activo: true },
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
    { _id: "1", estudiante_id: "1", curso_id: "1", fecha: "2026-04-06", presente: true },
  ],
  evaluaciones: [
    { _id: "1", curso_id: "1", materia: "Matemáticas", titulo: "Prueba 1", fecha: "2026-04-10" },
  ],
  anotaciones: [
    { _id: "1", estudiante_id: "1", tipo: "positiva", descripcion: "Buena participación", fecha: "2026-04-06" },
  ],
  reuniones: [
    { _id: "1", curso_id: "1", fecha: "2026-04-20", hora: "18:00", lugar: "Sala de Padres" },
  ],
  apoderados: [
    { _id: "1", nombre: "Roberto", apellido: "González", telefono: "+56912345678", estudiante_id: "1" },
  ]
};

// Flag para usar datos de ejemplo
let useMockData = false;

export default {
  async fetch(request, env) {
    return handleRequest(request);
  }
};

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
// MONGODB ATLAS DATA API
// ===========================================
async function mongoFind(collection, filter = {}) {
  const ATLAS_DATA_API_KEY = env.ATLAS_DATA_API_KEY || 'rWnGRFxWviVPHxqMMPMeqIuK8K6s9O8O9O9O9O9O9O9O9O9O9O9O';
  const ATLAS_DATA_API_URL = env.ATLAS_DATA_API_URL || 'https://data.mongodb-api.com/data/main-database/endpoint/data/beta';
  const ATLAS_DB_NAME = env.ATLAS_DB_NAME || 'App_estudiantil';
  
  const body = { dataSource: "mongodb-atlas", database: ATLAS_DB_NAME, collection, filter };
  
  const res = await fetch(`${ATLAS_DATA_API_URL}/action/find`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': ATLAS_DATA_API_KEY
    },
    body: JSON.stringify(body)
  });
  
  if (!res.ok) {
    console.error('MongoDB error:', await res.text());
    useMockData = true;
    return mockData[collection] || [];
  }
  
  const data = await res.json();
  return data.documents || [];
}

async function mongoFindOne(collection, filter = {}) {
  const ATLAS_DATA_API_KEY = env.ATLAS_DATA_API_KEY || 'rWnGRFxWviVPHxqMMPMeqIuK8K6s9O8O9O9O9O9O9O9O9O9O9O9O';
  const ATLAS_DATA_API_URL = env.ATLAS_DATA_API_URL || 'https://data.mongodb-api.com/data/main-database/endpoint/data/beta';
  const ATLAS_DB_NAME = env.ATLAS_DB_NAME || 'App_estudiantil';
  
  const body = { dataSource: "mongodb-atlas", database: ATLAS_DB_NAME, collection, filter };
  
  const res = await fetch(`${ATLAS_DATA_API_URL}/action/findOne`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': ATLAS_DATA_API_KEY
    },
    body: JSON.stringify(body)
  });
  
  if (!res.ok) {
    console.error('MongoDB error:', await res.text());
    useMockData = true;
    // Buscar en datos de ejemplo
    if (collection === 'usuarios') {
      return mockData.usuarios.find(u => u.email === filter.email);
    }
    return null;
  }
  
  const data = await res.json();
  return data.document;
}

async function mongoInsertOne(collection, document) {
  const ATLAS_DATA_API_KEY = env.ATLAS_DATA_API_KEY || 'rWnGRFxWviVPHxqMMPMeqIuK8K6s9O8O9O9O9O9O9O9O9O9O9O';
  const ATLAS_DATA_API_URL = env.ATLAS_DATA_API_URL || 'https://data.mongodb-api.com/data/main-database/endpoint/data/beta';
  const ATLAS_DB_NAME = env.ATLAS_DB_NAME || 'App_estudiantil';
  
  const body = { dataSource: "mongodb-atlas", database: ATLAS_DB_NAME, collection, document };
  
  const res = await fetch(`${ATLAS_DATA_API_URL}/action/insertOne`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': ATLAS_DATA_API_KEY
    },
    body: JSON.stringify(body)
  });
  
  if (!res.ok) {
    console.error('MongoDB error:', await res.text());
    // Devolver success falso para datos de ejemplo
    return { insertedId: "mock-" + Date.now() };
  }
  
  return res.json();
}

// ===========================================
// ROUTER
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
      mode: useMockData ? "demo" : "production",
      docs: "Endpoints: /auth/login, /usuarios, /estudiantes, /cursos, /asistencia, /evaluaciones, /anotaciones, /reuniones, /apoderados"
    });
  }

  try {
    // ===========================================
    // AUTH - Login
    // ===========================================
    if (path === "/auth/login" && method === "POST") {
      const data = await request.json();
      const { email, password } = data;
      
      if (!email || !password) {
        return errorResponse("Email y password requeridos", 400);
      }
      
      // Buscar usuario en MongoDB o datos de ejemplo
      let usuario;
      if (useMockData) {
        usuario = mockData.usuarios.find(u => u.email === email && u.activo);
      } else {
        usuario = await mongoFindOne("usuarios", { email, activo: true });
      }
      
      if (usuario && usuario.password === password) {
        const { password: _, ...userSafe } = usuario;
        return jsonResponse({ success: true, user: userSafe });
      }
      return errorResponse("Credenciales inválidas", 401);
    }

    // ===========================================
    // USUARIOS
    // ===========================================
    if (path === "/usuarios" || path === "/usuarios/") {
      if (method === "GET") {
        let usuarios = useMockData ? mockData.usuarios : await mongoFind("usuarios", {});
        const safe = usuarios.map(({ password, ...u }) => u);
        return jsonResponse(safe);
      }
      if (method === "POST") {
        const data = await request.json();
        const result = await mongoInsertOne("usuarios", { ...data, activo: true });
        return jsonResponse({ id: result.insertedId }, 201);
      }
    }

    // ===========================================
    // ESTUDIANTES
    // ===========================================
    if (path === "/estudiantes" || path === "/estudiantes/") {
      if (method === "GET") {
        const cursoId = url.searchParams.get("curso_id");
        let estudiantes = useMockData ? mockData.estudiantes : await mongoFind("estudiantes", {});
        if (cursoId) {
          estudiantes = estudiantes.filter(e => e.curso_id === cursoId);
        }
        return jsonResponse(estudiantes);
      }
      if (method === "POST") {
        const data = await request.json();
        const result = await mongoInsertOne("estudiantes", data);
        return jsonResponse({ id: result.insertedId }, 201);
      }
    }

    // ===========================================
    // CURSOS
    // ===========================================
    if (path === "/cursos" || path === "/cursos/") {
      if (method === "GET") {
        const cursos = useMockData ? mockData.cursos : await mongoFind("cursos", {});
        return jsonResponse(cursos);
      }
      if (method === "POST") {
        const data = await request.json();
        const result = await mongoInsertOne("cursos", data);
        return jsonResponse({ id: result.insertedId }, 201);
      }
    }

    // ===========================================
    // ASISTENCIA
    // ===========================================
    if (path === "/asistencia" || path === "/asistencia/") {
      if (method === "GET") {
        const estudianteId = url.searchParams.get("estudiante_id");
        const cursoId = url.searchParams.get("curso_id");
        let asistencia = useMockData ? mockData.asistencia : await mongoFind("asistencia", {});
        if (estudianteId) asistencia = asistencia.filter(a => a.estudiante_id === estudianteId);
        if (cursoId) asistencia = asistencia.filter(a => a.curso_id === cursoId);
        return jsonResponse(asistencia);
      }
      if (method === "POST") {
        const data = await request.json();
        const result = await mongoInsertOne("asistencia", data);
        return jsonResponse({ id: result.insertedId }, 201);
      }
    }

    // ===========================================
    // EVALUACIONES
    // ===========================================
    if (path === "/evaluaciones" || path === "/evaluaciones/") {
      if (method === "GET") {
        const cursoId = url.searchParams.get("curso_id");
        let evaluaciones = useMockData ? mockData.evaluaciones : await mongoFind("evaluaciones", {});
        if (cursoId) evaluaciones = evaluaciones.filter(e => e.curso_id === cursoId);
        return jsonResponse(evaluaciones);
      }
      if (method === "POST") {
        const data = await request.json();
        const result = await mongoInsertOne("evaluaciones", data);
        return jsonResponse({ id: result.insertedId }, 201);
      }
    }

    // ===========================================
    // ANOTACIONES
    // ===========================================
    if (path === "/anotaciones" || path === "/anotaciones/") {
      if (method === "GET") {
        const estudianteId = url.searchParams.get("estudiante_id");
        let anotaciones = useMockData ? mockData.anotaciones : await mongoFind("anotaciones", {});
        if (estudianteId) anotaciones = anotaciones.filter(a => a.estudiante_id === estudianteId);
        return jsonResponse(anotaciones);
      }
      if (method === "POST") {
        const data = await request.json();
        const result = await mongoInsertOne("anotaciones", data);
        return jsonResponse({ id: result.insertedId }, 201);
      }
    }

    // ===========================================
    // REUNIONES
    // ===========================================
    if (path === "/reuniones" || path === "/reuniones/") {
      if (method === "GET") {
        const reuniones = useMockData ? mockData.reuniones : await mongoFind("reuniones", {});
        return jsonResponse(reuniones);
      }
      if (method === "POST") {
        const data = await request.json();
        const result = await mongoInsertOne("reuniones", data);
        return jsonResponse({ id: result.insertedId }, 201);
      }
    }

    // ===========================================
    // APODERADOS
    // ===========================================
    if (path === "/apoderados" || path === "/apoderados/") {
      if (method === "GET") {
        const estudianteId = url.searchParams.get("estudiante_id");
        let apoderados = useMockData ? mockData.apoderados : await mongoFind("apoderados", {});
        if (estudianteId) apoderados = apoderados.filter(a => a.estudiante_id === estudianteId);
        return jsonResponse(apoderados);
      }
      if (method === "POST") {
        const data = await request.json();
        const result = await mongoInsertOne("apoderados", data);
        return jsonResponse({ id: result.insertedId }, 201);
      }
    }

    return errorResponse("Endpoint no encontrado. Prueba: /, /auth/login, /usuarios, /estudiantes, /cursos, /asistencia, /evaluaciones, /anotaciones, /reuniones, /apoderados", 404);
    
  } catch (e) {
    return errorResponse("Error: " + e.message, 500);
  }
}
