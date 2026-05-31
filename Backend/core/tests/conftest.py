"""
Configuración global de pytest para los tests del backend Django.
Configura DJANGO_SETTINGS_MODULE e inicializa Django antes de los tests.
"""

import os
import sys

# Asegurar que el directorio Backend/ está en sys.path
_backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")

# Inicializar Django antes de que cualquier test importe módulos de DRF/Django
import django
django.setup()
