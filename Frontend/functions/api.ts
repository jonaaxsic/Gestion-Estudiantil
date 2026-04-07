/**
 * Cloudflare Worker - MongoDB Atlas Data API Proxy
 * This worker handles all API requests by connecting directly to MongoDB Atlas
 */

const MONGO_ATLAS_API_URL = "https://data.mongodb-api.com/app/data-fqxhm/endpoint/data/v1";
const MONGO_ATLAS_API_KEY = "XKjM4M7U0OqC7Yb5p8n2v1w9z0A3d6f8e7h9g2i1j0";

const DB_NAME = "App_estudiantil";

// MongoDB Data API endpoints
const ENDPOINTS = {
  usuarios: "usuarios",
  estudiantes: "estudiantes", 
  cursos: "cursos",
  asistencia: "asistencia",
  evaluaciones: "evaluaciones",
  anotaciones: "anotaciones",
  reuniones: "reuniones",
  apoderados: "apoderados",
};

// Helper to make MongoDB Data API requests
async function mongoRequest(endpoint, method, body = null, query = "") {
  const url = `${MONGO_ATLAS_API_URL}/action/${endpoint}${query ? '?' + query : ''}`;
  
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": MONGO_ATLAS_API_KEY,
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  const data = await response.json();
  return { status: response.status, data };
}

// Handle CORS preflight
function handleOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

// Create response with CORS headers
function createResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return handleOptions();
    }

    const url = new URL(request.url);
    const path = url.pathname;
    
    // Route: /api/auth/login
    if (path === "/api/auth/login" && request.method === "POST") {
      try {
        const body = await request.json();
        const { email, password } = body;
        
        if (!email || !password) {
          return createResponse({ error: "Email y password requeridos" }, 400);
        }
        
        // Find user in MongoDB
        const result = await mongoRequest("findOne", "POST", {
          database: DB_NAME,
          collection: "usuarios",
          filter: { email, password, activo: true },
        });
        
        if (result.data.document) {
          const user = result.data.document;
          // Remove password from response for security
          delete user.password;
          return createResponse({ success: true, user });
        }
        
        return createResponse({ error: "Credenciales inválidas" }, 401);
      } catch (error) {
        return createResponse({ error: error.message }, 500);
      }
    }
    
    // Route: /api/usuarios
    if (path === "/api/usuarios" || path === "/api/usuarios/") {
      if (request.method === "GET") {
        try {
          const result = await mongoRequest("find", "POST", {
            database: DB_NAME,
            collection: "usuarios",
            sort: { created_at: -1 },
          });
          const users = (result.data.documents || []).map(u => {
            delete u.password;
            return u;
          });
          return createResponse(users);
        } catch (error) {
          return createResponse({ error: error.message }, 500);
        }
      }
      
      if (request.method === "POST") {
        try {
          const body = await request.json();
          const result = await mongoRequest("insertOne", "POST", {
            database: DB_NAME,
            collection: "usuarios",
            document: { ...body, created_at: new Date().toISOString(), activo: true },
          });
          return createResponse({ id: result.data.insertedId, ...body }, 201);
        } catch (error) {
          return createResponse({ error: error.message }, 500);
        }
      }
    }
    
    // Route: /api/estudiantes
    if (path === "/api/estudiantes" || path === "/api/estudiantes/") {
      if (request.method === "GET") {
        const cursoId = url.searchParams.get("curso_id");
        const filter = cursoId ? { curso_id: cursoId } : {};
        
        try {
          const result = await mongoRequest("find", "POST", {
            database: DB_NAME,
            collection: "estudiantes",
            filter,
            sort: { apellido: 1 },
          });
          return createResponse(result.data.documents || []);
        } catch (error) {
          return createResponse({ error: error.message }, 500);
        }
      }
      
      if (request.method === "POST") {
        try {
          const body = await request.json();
          const result = await mongoRequest("insertOne", "POST", {
            database: DB_NAME,
            collection: "estudiantes",
            document: { ...body, created_at: new Date().toISOString() },
          });
          return createResponse({ id: result.data.insertedId, ...body }, 201);
        } catch (error) {
          return createResponse({ error: error.message }, 500);
        }
      }
    }
    
    // Route: /api/cursos
    if (path === "/api/cursos" || path === "/api/cursos/") {
      if (request.method === "GET") {
        try {
          const result = await mongoRequest("find", "POST", {
            database: DB_NAME,
            collection: "cursos",
            sort: { nombre: 1 },
          });
          return createResponse(result.data.documents || []);
        } catch (error) {
          return createResponse({ error: error.message }, 500);
        }
      }
      
      if (request.method === "POST") {
        try {
          const body = await request.json();
          const result = await mongoRequest("insertOne", "POST", {
            database: DB_NAME,
            collection: "cursos",
            document: { ...body, created_at: new Date().toISOString() },
          });
          return createResponse({ id: result.data.insertedId, ...body }, 201);
        } catch (error) {
          return createResponse({ error: error.message }, 500);
        }
      }
    }
    
    // Route: /api/asistencia
    if (path === "/api/asistencia" || path === "/api/asistencia/") {
      if (request.method === "GET") {
        const params = new URLSearchParams();
        if (url.searchParams.get("estudiante_id")) params.append("estudiante_id", url.searchParams.get("estudiante_id"));
        if (url.searchParams.get("curso_id")) params.append("curso_id", url.searchParams.get("curso_id"));
        if (url.searchParams.get("fecha")) params.append("fecha", url.searchParams.get("fecha"));
        
        const filter = {};
        if (url.searchParams.get("estudiante_id")) filter.estudiante_id = url.searchParams.get("estudiante_id");
        if (url.searchParams.get("curso_id")) filter.curso_id = url.searchParams.get("curso_id");
        if (url.searchParams.get("fecha")) filter.fecha = url.searchParams.get("fecha");
        
        try {
          const result = await mongoRequest("find", "POST", {
            database: DB_NAME,
            collection: "asistencia",
            filter,
            sort: { fecha: -1 },
          });
          return createResponse(result.data.documents || []);
        } catch (error) {
          return createResponse({ error: error.message }, 500);
        }
      }
      
      if (request.method === "POST") {
        try {
          const body = await request.json();
          const result = await mongoRequest("insertOne", "POST", {
            database: DB_NAME,
            collection: "asistencia",
            document: { ...body, created_at: new Date().toISOString() },
          });
          return createResponse({ id: result.data.insertedId }, 201);
        } catch (error) {
          return createResponse({ error: error.message }, 500);
        }
      }
    }
    
    // Route: /api/evaluaciones
    if (path === "/api/evaluaciones" || path === "/api/evaluaciones/") {
      if (request.method === "GET") {
        const cursoId = url.searchParams.get("curso_id");
        const filter = cursoId ? { curso_id: cursoId } : {};
        
        try {
          const result = await mongoRequest("find", "POST", {
            database: DB_NAME,
            collection: "evaluaciones",
            filter,
            sort: { fecha: -1 },
          });
          return createResponse(result.data.documents || []);
        } catch (error) {
          return createResponse({ error: error.message }, 500);
        }
      }
      
      if (request.method === "POST") {
        try {
          const body = await request.json();
          const result = await mongoRequest("insertOne", "POST", {
            database: DB_NAME,
            collection: "evaluaciones",
            document: { ...body, created_at: new Date().toISOString() },
          });
          return createResponse({ id: result.data.insertedId }, 201);
        } catch (error) {
          return createResponse({ error: error.message }, 500);
        }
      }
    }
    
    // Route: /api/anotaciones
    if (path === "/api/anotaciones" || path === "/api/anotaciones/") {
      if (request.method === "GET") {
        const estudianteId = url.searchParams.get("estudiante_id");
        const filter = estudianteId ? { estudiante_id: estudianteId } : {};
        
        try {
          const result = await mongoRequest("find", "POST", {
            database: DB_NAME,
            collection: "anotaciones",
            filter,
            sort: { fecha: -1 },
          });
          return createResponse(result.data.documents || []);
        } catch (error) {
          return createResponse({ error: error.message }, 500);
        }
      }
      
      if (request.method === "POST") {
        try {
          const body = await request.json();
          const result = await mongoRequest("insertOne", "POST", {
            database: DB_NAME,
            collection: "anotaciones",
            document: { ...body, created_at: new Date().toISOString() },
          });
          return createResponse({ id: result.data.insertedId }, 201);
        } catch (error) {
          return createResponse({ error: error.message }, 500);
        }
      }
    }
    
    // Route: /api/reuniones
    if (path === "/api/reuniones" || path === "/api/reuniones/") {
      if (request.method === "GET") {
        try {
          const result = await mongoRequest("find", "POST", {
            database: DB_NAME,
            collection: "reuniones",
            sort: { fecha: 1 },
          });
          return createResponse(result.data.documents || []);
        } catch (error) {
          return createResponse({ error: error.message }, 500);
        }
      }
      
      if (request.method === "POST") {
        try {
          const body = await request.json();
          const result = await mongoRequest("insertOne", "POST", {
            database: DB_NAME,
            collection: "reuniones",
            document: { ...body, created_at: new Date().toISOString() },
          });
          return createResponse({ id: result.data.insertedId }, 201);
        } catch (error) {
          return createResponse({ error: error.message }, 500);
        }
      }
    }
    
    // Route: /api/apoderados
    if (path === "/api/apoderados" || path === "/api/apoderados/") {
      if (request.method === "GET") {
        try {
          const result = await mongoRequest("find", "POST", {
            database: DB_NAME,
            collection: "apoderados",
            sort: { apellido: 1 },
          });
          return createResponse(result.data.documents || []);
        } catch (error) {
          return createResponse({ error: error.message }, 500);
        }
      }
      
      if (request.method === "POST") {
        try {
          const body = await request.json();
          const result = await mongoRequest("insertOne", "POST", {
            database: DB_NAME,
            collection: "apoderados",
            document: { ...body, created_at: new Date().toISOString() },
          });
          return createResponse({ id: result.data.insertedId }, 201);
        } catch (error) {
          return createResponse({ error: error.message }, 500);
        }
      }
    }
    
    // Root endpoint
    if (path === "/" || path === "") {
      return createResponse({
        status: "ok",
        message: "Gestion Estudiantil API - Cloudflare Worker",
        database: "MongoDB Atlas"
      });
    }
    
    // 404 for unknown routes
    return createResponse({ error: "Endpoint no encontrado" }, 404);
  },
};
