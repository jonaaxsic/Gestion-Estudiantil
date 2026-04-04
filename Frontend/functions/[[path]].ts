/**
 * Cloudflare Pages Function - API
 * Handles /api/* routes
 */

export const onRequest = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // Solo manejar /api/*
  if (!path.startsWith("/api")) {
    return new Response("Not Found", { status: 404 });
  }

  // Obtener el path después de /api
  let apiPath = path.slice(4); // Remove "/api"
  if (!apiPath) apiPath = "/";
  apiPath = apiPath.replace(/\/+$/, "") || "/";

  const method = request.method;

  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };

  if (method === "OPTIONS") {
    return new Response("", { status: 204, headers: cors });
  }

  const res = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json", ...cors }
    });

  // /
  if (apiPath === "/" || apiPath === "") {
    return res({
      status: "ok",
      message: "API Backend - Gestion Estudiantil",
      demo: true,
      login: "POST /api/auth/login"
    });
  }

  // /auth/login
  if (apiPath === "auth/login" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body || {};

    if (!email || !password) {
      return res({ error: "Email y password requeridos" }, 400);
    }

    const users = [
      { _id: "1", nombre: "Admin", apellido: "Sistema", email: "admin@colegio.cl", rol: "admin", password: "admin", activo: true },
      { _id: "2", nombre: "Juan", apellido: "Perez", email: "juan@colegio.cl", rol: "docente", password: "123", activo: true },
      { _id: "3", nombre: "Maria", apellido: "Garcia", email: "maria@colegio.cl", rol: "admin", password: "123", activo: true },
    ];

    const user = users.find(u => u.email === email && u.activo);
    if (user && user.password === password) {
      const { password: _, ...u } = user;
      return res({ success: true, user: u });
    }
    return res({ error: "Credenciales invalidas" }, 401);
  }

  // /usuarios
  if (apiPath === "usuarios" && method === "GET") {
    return res([
      { _id: "1", nombre: "Admin", apellido: "Sistema", email: "admin@colegio.cl", rol: "admin" },
      { _id: "2", nombre: "Juan", apellido: "Perez", email: "juan@colegio.cl", rol: "docente" },
    ]);
  }

  // /estudiantes
  if (apiPath === "estudiantes" && method === "GET") {
    return res([
      { _id: "1", nombre: "Pedro", apellido: "Gonzalez", rut: "12345678-9", curso_id: "1" },
      { _id: "2", nombre: "Ana", apellido: "Lopez", rut: "98765432-1", curso_id: "1" },
    ]);
  }

  // /cursos
  if (apiPath === "cursos" && method === "GET") {
    return res([
      { _id: "1", nombre: "1° Basico A", nivel: "1° Basico", ano: 2025 },
      { _id: "2", nombre: "2° Basico A", nivel: "2° Basico", ano: 2025 },
    ]);
  }

  // /asistencia
  if (apiPath === "asistencia" && method === "GET") {
    return res([
      { _id: "1", estudiante_id: "1", curso_id: "1", fecha: "2026-04-04", presente: true },
    ]);
  }

  // /evaluaciones
  if (apiPath === "evaluaciones" && method === "GET") {
    return res([
      { _id: "1", curso_id: "1", materia: "Matematicas", titulo: "Prueba 1", fecha: "2026-04-10" },
    ]);
  }

  // No encontrado
  return res({ error: `Endpoint no encontrado: ${apiPath}` }, 404);
};