/**
 * Cloudflare Pages API Handler
 * PUT THIS IN THE ROOT OF YOUR PROJECT AS: _worker.js
 * Not in the functions folder!
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Only handle /api/* routes
    if (!path.startsWith("/api")) {
      return fetch(request); // Let other requests pass through
    }
    
    // Remove /api prefix
    let apiPath = path.replace(/^\/api/, "");
    if (apiPath === "") apiPath = "/";
    apiPath = apiPath.replace(/\/+$/, "");
    
    const method = request.method;
    
    console.log("API:", method, path, "->", apiPath);
    
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };
    
    if (method === "OPTIONS") {
      return new Response("", { status: 204, headers: corsHeaders });
    }
    
    const json = (data, status = 200) => 
      new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    
    const error = (msg, status = 400) => json({ error: msg }, status);
    
    // Root
    if (apiPath === "/" || apiPath === "") {
      return json({ 
        status: "ok", 
        message: "API Backend - Gestión Estudiantil",
        demo: true
      });
    }
    
    // Login
    if (apiPath === "/auth/login" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      const { email, password } = body;
      
      if (!email || !password) return error("Email y password requeridos", 400);
      
      const users = [
        { _id: "1", nombre: "Juan", apellido: "Pérez", email: "juan@colegio.cl", rol: "docente", password: "123", activo: true },
        { _id: "2", nombre: "María", apellido: "García", email: "maria@colegio.cl", rol: "admin", password: "123", activo: true },
        { _id: "3", nombre: "Admin", apellido: "User", email: "admin@colegio.cl", rol: "admin", password: "admin", activo: true },
      ];
      
      const user = users.find(u => u.email === email && u.activo);
      if (user && user.password === password) {
        const { password: _, ...u } = user;
        return json({ success: true, user: u });
      }
      return error("Credenciales inválidas", 401);
    }
    
    // Usuarios
    if (apiPath === "/usuarios" && method === "GET") {
      return json([
        { _id: "1", nombre: "Juan", apellido: "Pérez", email: "juan@colegio.cl", rol: "docente" },
        { _id: "2", nombre: "María", apellido: "García", email: "maria@colegio.cl", rol: "admin" },
      ]);
    }
    
    // Estudiantes
    if (apiPath === "/estudiantes" && method === "GET") {
      return json([
        { _id: "1", nombre: "Pedro", apellido: "González", rut: "12345678-9", curso_id: "1" },
        { _id: "2", nombre: "Ana", apellido: "López", rut: "98765432-1", curso_id: "1" },
      ]);
    }
    
    // Cursos
    if (apiPath === "/cursos" && method === "GET") {
      return json([
        { _id: "1", nombre: "1° Básico A", nivel: "1° Básico", ano: 2025 },
        { _id: "2", nombre: "2° Básico A", nivel: "2° Básico", ano: 2025 },
      ]);
    }
    
    return error(`No encontrado: ${apiPath}`, 404);
  }
};