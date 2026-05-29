"""
Tests unitarios para la generacion de PDFs con ReportLab.
Verifica que los 4 tipos de documento se generen sin errores.
"""

from io import BytesIO
from datetime import datetime

# Datos de prueba
ESTUDIANTE = {
    "nombre": "Diego",
    "apellido": "Rodriguez Toledo",
    "rut": "24.623.073-0",
    "curso_nombre": "1° Básico A",
    "fecha_nacimiento": "2015-03-15",
}

ESTABLECIMIENTO = {
    "nombre": "Colegio Amanecer",
    "rut": "12.345.678-9",
    "direccion": "Av. Principal 1234, Santiago",
    "telefono": "+56 2 2123 4567",
    "email": "contacto@colegio.cl",
    "director": "María González",
    "inspector_general": "Inspector General",
    "comuna": "Santiago",
}

INSPECTOR = {
    "nombre": "Eduardo",
    "apellido": "Salazar",
    "rut": "24.555.888-6",
}

RETIRO_DATA = {
    "apoderado_autorizante": "Carlos Rodriguez",
    "motivo": "Cita médica",
    "fecha": "2026-05-29",
    "hora_salida": "11:30",
}

ACCIDENTE_DATA = {
    "fecha_accidente": "2026-05-29",
    "hora_accidente": "10:15",
    "lugar": "Patio",
    "descripcion": "El estudiante cayó mientras jugaba",
    "tipo_lesion": "Rodilla raspada",
    "testigos": "Profesor Juan Pérez",
    "derivacion": "Hospital San Juan",
}

NOTAS = [
    {"asignatura": "Lenguaje", "notas": {"nota1": 6.5, "nota2": 5.0, "nota3": 6.0}, "nota_final": 5.8},
    {"asignatura": "Matemática", "notas": {"nota1": 7.0, "nota2": 6.5, "nota3": 6.8}, "nota_final": 6.8},
    {"asignatura": "Ciencias", "notas": {"nota1": 5.0, "nota2": None, "nota3": None}, "nota_final": 5.0},
]


class TestPDFGeneracion:
    """Prueba que los 4 tipos de PDF se generen sin errores"""

    def setup_method(self):
        """Importar modulo (tiene dependencias pesadas como ReportLab)"""
        from core.pdf_generator import (
            generar_certificado_alumno_regular,
            generar_certificado_notas,
            generar_autorizacion_retiro,
            generar_declaracion_accidente,
        )
        self.gen_cert_regular = generar_certificado_alumno_regular
        self.gen_cert_notas = generar_certificado_notas
        self.gen_retiro = generar_autorizacion_retiro
        self.gen_accidente = generar_declaracion_accidente

    def test_certificado_alumno_regular_es_pdf_valido(self):
        """El certificado de alumno regular debe generar un PDF valido"""
        buffer = self.gen_cert_regular(ESTUDIANTE, ESTABLECIMIENTO, INSPECTOR)
        assert isinstance(buffer, BytesIO)
        contenido = buffer.getvalue()
        assert contenido.startswith(b"%PDF"), "No comienza con firma PDF"
        assert len(contenido) > 1000, "PDF muy pequeno"

    def test_certificado_notas_es_pdf_valido(self):
        """El certificado de notas debe generar un PDF valido"""
        buffer = self.gen_cert_notas(
            ESTUDIANTE, NOTAS, ESTABLECIMIENTO, INSPECTOR, 2026
        )
        assert isinstance(buffer, BytesIO)
        contenido = buffer.getvalue()
        assert contenido.startswith(b"%PDF"), "No comienza con firma PDF"
        assert len(contenido) > 1000, "PDF muy pequeno"

    def test_certificado_notas_sin_notas_genera_pdf(self):
        """Si no hay notas, debe generar PDF igual sin errores"""
        buffer = self.gen_cert_notas(
            ESTUDIANTE, [], ESTABLECIMIENTO, INSPECTOR, 2026
        )
        assert isinstance(buffer, BytesIO)
        contenido = buffer.getvalue()
        assert contenido.startswith(b"%PDF"), "No comienza con firma PDF"

    def test_autorizacion_retiro_es_pdf_valido(self):
        """La autorizacion de retiro debe generar un PDF valido"""
        buffer = self.gen_retiro(ESTUDIANTE, RETIRO_DATA, ESTABLECIMIENTO, INSPECTOR)
        assert isinstance(buffer, BytesIO)
        contenido = buffer.getvalue()
        assert contenido.startswith(b"%PDF"), "No comienza con firma PDF"
        assert len(contenido) > 1000, "PDF muy pequeno"

    def test_declaracion_accidente_es_pdf_valido(self):
        """La declaracion de accidente debe generar un PDF valido"""
        buffer = self.gen_accidente(
            ESTUDIANTE, ACCIDENTE_DATA, ESTABLECIMIENTO, INSPECTOR
        )
        assert isinstance(buffer, BytesIO)
        contenido = buffer.getvalue()
        assert contenido.startswith(b"%PDF"), "No comienza con firma PDF"
        assert len(contenido) > 1000, "PDF muy pequeno"

    def test_declaracion_accidente_sin_derivacion_funciona(self):
        """La declaracion debe funcionar aunque derivacion sea opcional"""
        data_sin_derivacion = dict(ACCIDENTE_DATA)
        data_sin_derivacion["derivacion"] = ""
        buffer = self.gen_accidente(
            ESTUDIANTE, data_sin_derivacion, ESTABLECIMIENTO, INSPECTOR
        )
        assert isinstance(buffer, BytesIO)
        assert buffer.getvalue().startswith(b"%PDF")
