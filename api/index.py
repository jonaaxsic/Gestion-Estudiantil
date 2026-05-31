"""
Vercel Serverless Entry Point - Gestión Estudiantil API
Conecta Django WSGI con Vercel Python Runtime
"""
import sys
from pathlib import Path

# Agregar Backend/ al path para que Django encuentre sus módulos
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "Backend"))

import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")

from django.core.wsgi import get_wsgi_application

app = get_wsgi_application()
