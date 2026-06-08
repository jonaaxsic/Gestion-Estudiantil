"""
Vistas de autenticación: Recuperación de contraseña
Flujo de 2 pasos: enviar código por email → verificar código → nueva contraseña
"""

import random
import string
from datetime import datetime, timedelta

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.core.mail import send_mail
from django.template.loader import render_to_string
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Usuario
from .database import get_collection


# ── Constantes ──────────────────────────────────────────────
CODE_LENGTH = 6
CODE_EXPIRY_MINUTES = 10
MAX_ATTEMPTS = 5
COLLECTION_NAME = "password_resets"


def _generate_code():
    """Generar código numérico de 6 dígitos"""
    return ''.join(random.choices(string.digits, k=CODE_LENGTH))


def _get_resets_collection():
    """Obtener colección de reset codes"""
    return get_collection(COLLECTION_NAME)


def _cleanup_expired_codes(email):
    """Eliminar códigos expirados o usados del mismo email"""
    collection = _get_resets_collection()
    collection.delete_many({
        "email": email,
        "$or": [
            {"expires_at": {"$lt": datetime.now()}},
            {"used": True}
        ]
    })


def _send_reset_email(email, code, user_name):
    """Enviar email con código de verificación"""
    subject = "Recuperación de Contraseña - Sistema de Gestión Estudiantil"
    
    # Email en texto plano (fallback)
    plain_message = f"""
Hola {user_name},

Tu código de verificación es: {code}

Este código expira en {CODE_EXPIRY_MINUTES} minutos.

Si no solicitaste este cambio, puedes ignorar este mensaje.

Saludos,
Sistema de Gestión Estudiantil
"""
    
    # Email HTML
    html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f4fc; margin: 0; padding: 20px; }}
        .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #3d6fe8, #2b58cc); padding: 30px; text-align: center; }}
        .header h1 {{ color: white; margin: 0; font-size: 1.4rem; }}
        .header p {{ color: rgba(255,255,255,0.8); margin: 5px 0 0; font-size: 0.9rem; }}
        .body {{ padding: 30px; text-align: center; }}
        .greeting {{ color: #1a1f36; font-size: 1rem; margin-bottom: 20px; }}
        .code-box {{ background: #f7f9ff; border: 2px dashed #3d6fe8; border-radius: 12px; padding: 20px; margin: 20px 0; }}
        .code {{ font-size: 2.5rem; font-weight: 700; color: #3d6fe8; letter-spacing: 8px; }}
        .expiry {{ color: #5a6380; font-size: 0.85rem; margin-top: 10px; }}
        .footer {{ background: #f7f9ff; padding: 20px 30px; text-align: center; color: #9099b8; font-size: 0.8rem; border-top: 1px solid #dde3f0; }}
        .warning {{ color: #e8344a; font-size: 0.85rem; margin-top: 15px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Sistema de Gestión Estudiantil</h1>
            <p>Recuperación de Contraseña</p>
        </div>
        <div class="body">
            <p class="greeting">Hola <strong>{user_name}</strong>,</p>
            <p>Tu código de verificación es:</p>
            <div class="code-box">
                <div class="code">{code}</div>
                <p class="expiry">Expira en {CODE_EXPIRY_MINUTES} minutos</p>
            </div>
            <p class="warning">Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
        </div>
        <div class="footer">
            Sistema de Gestión Estudiantil &copy; 2026
        </div>
    </div>
</body>
</html>
"""
    
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"ERROR sending reset email: {e}")
        return False


# ── Vistas ──────────────────────────────────────────────────

@api_view(["POST"])
def forgot_password(request):
    """
    Paso 1: Solicitar recuperación de contraseña
    Envía un código de 6 dígitos al email registrado.
    
    Body: { "email": "usuario@correo.cl" }
    Response: { "success": true, "message": "Código enviado al correo electrónico" }
    """
    email = request.data.get("email", "").strip().lower()
    
    if not email:
        return Response(
            {"error": "El correo electrónico es requerido"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Buscar usuario por email
    usuario = Usuario.find_one({"email": email, "activo": True})
    
    # Por seguridad, siempre devolver el mismo mensaje
    # (no revelar si el email existe o no)
    success_message = "Si el correo está registrado, recibirás un código de verificación"
    
    if not usuario:
        # Simular éxito para no revelar si el email existe
        return Response({"success": True, "message": success_message})
    
    # Limpiar códigos anteriores del mismo email
    _cleanup_expired_codes(email)
    
    # Verificar límite de intentos recientes
    collection = _get_resets_collection()
    recent_codes = collection.count_documents({
        "email": email,
        "created_at": {"$gte": datetime.now() - timedelta(minutes=5)}
    })
    
    if recent_codes >= MAX_ATTEMPTS:
        return Response(
            {"error": "Demasiadas solicitudes. Espera 5 minutos e intenta nuevamente"},
            status=status.HTTP_429_TOO_MANY_REQUESTS
        )
    
    # Generar código
    code = _generate_code()
    
    # Guardar en MongoDB
    reset_doc = {
        "email": email,
        "user_id": usuario._id,
        "code": code,
        "created_at": datetime.now(),
        "expires_at": datetime.now() + timedelta(minutes=CODE_EXPIRY_MINUTES),
        "used": False,
        "attempts": 0
    }
    collection.insert_one(reset_doc)
    
    # Enviar email
    user_name = usuario.nombre or usuario.username or "Usuario"
    email_sent = _send_reset_email(email, code, user_name)
    
    if not email_sent:
        return Response(
            {"error": "Error al enviar el correo. Intenta nuevamente"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return Response({"success": True, "message": success_message})


@api_view(["POST"])
def verify_reset_code(request):
    """
    Paso 2a: Verificar código de verificación
    Valida que el código sea correcto y no haya expirado.
    
    Body: { "email": "usuario@correo.cl", "code": "123456" }
    Response: { "success": true, "reset_token": "<token>" }
    """
    email = request.data.get("email", "").strip().lower()
    code = request.data.get("code", "").strip()
    
    if not email or not code:
        return Response(
            {"error": "El correo y el código son requeridos"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    collection = _get_resets_collection()
    
    # Buscar el código más reciente no usado
    reset_doc = collection.find_one({
        "email": email,
        "used": False,
        "expires_at": {"$gt": datetime.now()}
    }, sort=[("created_at", -1)])
    
    if not reset_doc:
        return Response(
            {"error": "Código inválido o expirado. Solicita uno nuevo"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verificar intentos
    if reset_doc.get("attempts", 0) >= MAX_ATTEMPTS:
        # Marcar como usado para evitar abuso
        collection.update_one(
            {"_id": reset_doc["_id"]},
            {"$set": {"used": True}}
        )
        return Response(
            {"error": "Demasiados intentos fallidos. Solicita un nuevo código"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verificar código
    if reset_doc["code"] != code:
        # Incrementar intentos
        collection.update_one(
            {"_id": reset_doc["_id"]},
            {"$inc": {"attempts": 1}}
        )
        remaining = MAX_ATTEMPTS - reset_doc.get("attempts", 0) - 1
        return Response(
            {"error": f"Código incorrecto. Te quedan {remaining} intentos"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Código correcto — marcar como usado
    collection.update_one(
        {"_id": reset_doc["_id"]},
        {"$set": {"used": True}}
    )
    
    # Generar un token simple para el paso siguiente (el user_id)
    # En producción esto debería ser un JWT o token seguro
    reset_token = str(reset_doc["user_id"])
    
    return Response({
        "success": True,
        "message": "Código verificado correctamente",
        "reset_token": reset_token
    })


@api_view(["POST"])
def reset_password(request):
    """
    Paso 3: Establecer nueva contraseña
    Requiere el reset_token del paso anterior.
    
    Body: { "reset_token": "<user_id>", "new_password": "nueva123" }
    Response: { "success": true, "message": "Contraseña actualizada correctamente" }
    """
    reset_token = request.data.get("reset_token", "").strip()
    new_password = request.data.get("new_password", "")
    
    if not reset_token or not new_password:
        return Response(
            {"error": "El token y la nueva contraseña son requeridos"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if len(new_password) < 8:
        return Response(
            {"error": "La contraseña debe tener al menos 8 caracteres"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Buscar usuario por el reset_token (user_id)
    try:
        usuario = Usuario.find_one({"_id": reset_token})
    except Exception:
        usuario = None
    
    if not usuario:
        return Response(
            {"error": "Sesión de recuperación inválida"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Actualizar contraseña (hasheada)
    usuario.password = make_password(new_password)
    usuario.save()
    
    # Limpiar todos los códigos de reset de este usuario
    collection = _get_resets_collection()
    collection.delete_many({"user_id": reset_token})
    
    return Response({
        "success": True,
        "message": "Contraseña actualizada correctamente. Ya puedes iniciar sesión"
    })
