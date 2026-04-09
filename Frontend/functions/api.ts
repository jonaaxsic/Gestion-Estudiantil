/**
 * Cloudflare Worker - Gestion Estudiantil API
 * Proxy que reenvía peticiones al backend de Render (MongoDB Atlas)
 */

const RENDER_API = "https://gestion-estuduantil.onrender.com";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Si NO es ruta de API, servir archivos estáticos (frontend Angular)
    if (!path.startsWith("/auth/") && !path.startsWith("/api/")) {
      return new Response(null, { status: 200 });
    }

    // Configurar CORS
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://gestionestudiantil.pages.dev",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
      "Access-Control-Allow-Credentials": "true",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Reenviar la petición tal cual al backend de Render
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "host" && key.toLowerCase() !== "upgrade-insecure-requests") {
        headers.set(key, value);
      }
    });

    try {
      const response = await fetch(`${RENDER_API}${path}${url.search}`, {
        method: request.method,
        headers: headers,
        body: request.body,
        redirect: "manual",
      });

      // Devolver la respuesta del backend
      const responseHeaders = new Headers(corsHeaders);
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() !== "transfer-encoding") {
          responseHeaders.set(key, value);
        }
      });

      return new Response(response.body, {
        status: response.status,
        headers: responseHeaders,
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: "Error de conexión", 
        message: error.message 
      }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  },
};
