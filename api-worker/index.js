/**
 * Cloudflare Worker - API Proxy for Gestion Estudiantil
 * This worker forwards API requests to the backend
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // If it's an API request, forward to backend
    if (url.pathname.startsWith('/api/')) {
      // Replace with your actual backend URL after deployment
      const backendUrl = 'https://gestion-estudiantil-backend.onrender.com' + url.pathname + url.search;
      
      try {
        const response = await fetch(backendUrl, {
          method: request.method,
          headers: {
            'Content-Type': 'application/json',
            ...Object.fromEntries([...request.headers.entries()].filter(([k]) => k !== 'host'))
          },
          body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined
        });
        
        return new Response(response.body, {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (e) {
        return new Response(JSON.stringify({ 
          error: 'Backend not available',
          message: 'Please deploy the backend to Render.com'
        }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Root endpoint
    if (url.pathname === '/') {
      return new Response(JSON.stringify({
        status: 'ok',
        message: 'Gestion Estudiantil API - Frontend connected, waiting for backend',
        backend: 'Please deploy backend to Render.com'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Fallback
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};