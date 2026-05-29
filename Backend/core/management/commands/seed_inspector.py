"""
Management command para sembrar datos iniciales del módulo Inspector General.

Uso:
    python manage.py seed_inspector

Requiere:
    - Conexión a MongoDB Atlas (configurada en .env)
    - ReportLab y Pillow instalados

Puebla:
    1. ConfiguracionEstablecimiento (datos del colegio)
    2. Inspector general de prueba (si no existe)
"""

from django.core.management.base import BaseCommand
from core.models import (
    ConfiguracionEstablecimiento,
    Usuario,
    Curso,
    Estudiante,
)


class Command(BaseCommand):
    help = "Puebla datos iniciales para el módulo de Inspector General"

    def handle(self, *args, **options):
        self.stdout.write("=== Seed: Módulo Inspector General ===")

        # ── 1. Configuración del Establecimiento ──
        self._seed_configuracion()

        # ── 2. Inspector General de prueba ──
        self._seed_inspector()

        # ── 3. Cursos de prueba ──
        self._seed_cursos()

        self.stdout.write(self.style.SUCCESS("✅ Seed completado exitosamente"))

    def _seed_configuracion(self):
        """Crea o actualiza la configuración del establecimiento"""
        configs = ConfiguracionEstablecimiento.find()
        if configs:
            self.stdout.write("  ℹ️  ConfiguracionEstablecimiento ya existe, omitiendo...")
            return

        config = ConfiguracionEstablecimiento({
            "nombre": "Colegio Amanecer",
            "rut": "12.345.678-9",
            "direccion": "Av. Principal 1234, Santiago",
            "telefono": "+56 2 2123 4567",
            "email": "contacto@colegioamanecer.cl",
            "director": "María González López",
            "inspector_general": "Jefatura de Inspectoría General",
            "logo_url": "https://res.cloudinary.com/dyslpppz8/image/upload/v1780066980/Gemini_Generated_Image_8lrou8lrou8lrou8_sebabv.png",
            "codigo_sostenedor": "12345",
            "dependencia": "Particular Subvencionado",
            "region": "Región Metropolitana",
            "comuna": "Santiago",
            "texto_certificado_regular": "El Director del establecimiento educacional {nombre_colegio}, RUT {rut_colegio}, debidamente facultado por la legislación educacional vigente, CERTIFICA que el/la alumno/a {nombre_alumno}, RUT {rut_alumno}, se encuentra matriculado/a y cursando regularmente {curso} en este establecimiento durante el año lectivo {anio_lectivo}. Se extiende el presente certificado para los fines legales que el/la apoderado/a estime conveniente.",
            "texto_certificado_notas": "El presente certificado de notas corresponde al rendimiento académico del/la alumno/a {nombre_alumno}, RUT {rut_alumno}, durante el año escolar {anio_escolar} en el curso {curso}. Las calificaciones aquí detalladas son las registradas oficialmente en el sistema de gestión del establecimiento.",
            "texto_autorizacion_retiro": "Por medio del presente documento, se autoriza el retiro del/la alumno/a {nombre_alumno}, RUT {rut_alumno}, del curso {curso}, del establecimiento educacional, por el motivo señalado anteriormente. El/La apoderado/a {apoderado} se hace responsable del alumno/a desde el momento de su retiro.",
            "texto_declaracion_accidente": "Declaración de Accidente Escolar según lo dispuesto en la Ley 16.744 sobre Seguro Escolar. Se deja constancia que el/la alumno/a {nombre_alumno}, RUT {rut_alumno}, del curso {curso}, sufrió un accidente en las dependencias del establecimiento o en actividades escolares, cuyos detalles se señalan a continuación.",
        })
        config.save()
        self.stdout.write(self.style.SUCCESS(f"  ✅ ConfiguracionEstablecimiento creada (ID: {config._id})"))

    def _seed_inspector(self):
        """Crea un inspector general de prueba si no existe"""
        existing = Usuario.find({"rol": "inspector_general"})
        if existing:
            self.stdout.write("  ℹ️  Inspector general ya existe, omitiendo...")
            return

        inspector = Usuario({
            "nombre": "Inspector",
            "apellido": "General",
            "rut": "11.111.111-1",
            "email": "inspector@colegio.cl",
            "password": "inspector123",  # En producción usar hash
            "rol": "inspector_general",
            "telefono": "+56 9 1111 1111",
        })
        inspector.save()
        self.stdout.write(self.style.SUCCESS(f"  ✅ Inspector creado (ID: {inspector._id}, email: inspector@colegio.cl, pass: inspector123)"))

    def _seed_cursos(self):
        """Crea cursos de prueba si no existen"""
        existing = Curso.find()
        if existing:
            self.stdout.write("  ℹ️  Cursos ya existen, omitiendo...")
            return

        cursos_data = [
            {"nivel": "1°", "nombre": "Básico A", "letra": "A"},
            {"nivel": "1°", "nombre": "Básico B", "letra": "B"},
            {"nivel": "2°", "nombre": "Básico A", "letra": "A"},
            {"nivel": "2°", "nombre": "Básico B", "letra": "B"},
            {"nivel": "3°", "nombre": "Medio A", "letra": "A"},
            {"nivel": "3°", "nombre": "Medio B", "letra": "B"},
            {"nivel": "4°", "nombre": "Medio A", "letra": "A"},
            {"nivel": "4°", "nombre": "Medio B", "letra": "B"},
        ]

        for c in cursos_data:
            curso = Curso(c)
            curso.save()
            self.stdout.write(f"    Curso {c['nivel']} {c['nombre']} creado (ID: {curso._id})")
