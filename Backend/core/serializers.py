"""
Serializers para la API REST
Convierten los modelos MongoDB a JSON y viceversa
"""

from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import (
    Usuario,
    Estudiante,
    Curso,
    Asistencia,
    Evaluacion,
    Anotacion,
    Reunione,
    Apoderado,
    Recordatorio,
    AsignacionDocente,
    DocumentoGenerado,
    AccidenteEscolar,
    RetiroAlumno,
    LibroInspectoria,
    ConfiguracionEstablecimiento,
)


class UsuarioSerializer(serializers.Serializer):
    """Serializer para Usuario"""

    id = serializers.CharField(source="_id", read_only=True)
    rut = serializers.CharField(required=False, allow_null=True)
    email = serializers.CharField(required=True)
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    rol = serializers.CharField(required=True)
    nombre = serializers.CharField(required=True)
    apellido = serializers.CharField(required=True)
    telefono = serializers.CharField(required=False, allow_null=True)
    activo = serializers.BooleanField(default=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        # Hashear password antes de guardar
        if validated_data.get("password"):
            validated_data["password"] = make_password(validated_data["password"])
        usuario = Usuario(validated_data)
        usuario.save()
        return usuario

    def update(self, instance, validated_data):
        # Hashear password si viene en la actualización
        if validated_data.get("password"):
            validated_data["password"] = make_password(validated_data["password"])
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance


def _empty_str_to_none(value):
    """Convierte strings vacíos a None para campos opcionales"""
    return None if isinstance(value, str) and value.strip() == "" else value


class EstudianteSerializer(serializers.Serializer):
    """Serializer para Estudiante"""

    id = serializers.CharField(source="_id", read_only=True)
    rut = serializers.CharField(required=True)
    nombre = serializers.CharField(required=True)
    apellido = serializers.CharField(required=True)
    fecha_nacimiento = serializers.DateField(required=False, allow_null=True)
    direccion = serializers.CharField(required=False, allow_null=True)
    telefono = serializers.CharField(required=False, allow_null=True)
    curso_id = serializers.CharField(required=False, allow_null=True)
    apoderado_id = serializers.CharField(required=False, allow_null=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def to_internal_value(self, data):
        # Convertir strings vacíos a None ANTES de que los fields validen
        data = data.copy()
        for field in ("fecha_nacimiento", "direccion", "telefono", "curso_id", "apoderado_id"):
            if field in data:
                data[field] = _empty_str_to_none(data[field])
        return super().to_internal_value(data)

    def create(self, validated_data):
        estudiante = Estudiante(validated_data)
        estudiante.save()
        return estudiante

    def update(self, instance, validated_data):
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance


class CursoSerializer(serializers.Serializer):
    """Serializer para Curso"""

    id = serializers.CharField(source="_id", read_only=True)
    nombre = serializers.CharField(required=True)
    nivel = serializers.CharField(required=True)
    ano = serializers.IntegerField(required=False, allow_null=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        curso = Curso(validated_data)
        curso.save()
        return curso

    def update(self, instance, validated_data):
        # Excluir _id de los datos validados para evitar error de MongoDB
        validated_data = {k: v for k, v in validated_data.items() if k != "_id"}
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance


class AsistenciaSerializer(serializers.Serializer):
    """Serializer para Asistencia"""

    id = serializers.CharField(source="_id", read_only=True)
    estudiante_id = serializers.CharField(required=False, allow_null=True)
    curso_id = serializers.CharField(required=False, allow_null=True)
    fecha = serializers.DateField(required=False, allow_null=True)
    presente = serializers.BooleanField(required=False)
    observacion = serializers.CharField(required=False, allow_null=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        asistencia = Asistencia(validated_data)
        asistencia.save()
        return asistencia

    def update(self, instance, validated_data):
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance


class EvaluacionSerializer(serializers.Serializer):
    """Serializer para Evaluacion"""

    id = serializers.CharField(source="_id", read_only=True)
    curso_id = serializers.CharField(required=False, allow_null=True)
    materia = serializers.CharField(required=False, allow_null=True)
    titulo = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    descripcion = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )
    fecha = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    ponderacion = serializers.FloatField(required=False, allow_null=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        # Normalizar fecha si viene en formato DD-MM-YYYY
        fecha = validated_data.get("fecha")
        if fecha and isinstance(fecha, str) and "-" in fecha:
            parts = fecha.split("-")
            if len(parts[0]) == 2 and len(parts[2]) == 4:  # DD-MM-YYYY
                validated_data["fecha"] = f"{parts[2]}-{parts[1]}-{parts[0]}"
        # Asegurar que los campos opcionales tengan valores por defecto
        if not validated_data.get("titulo"):
            validated_data["titulo"] = "Sin título"
        if not validated_data.get("ponderacion"):
            validated_data["ponderacion"] = 20
        evaluacion = Evaluacion(validated_data)
        evaluacion.save()
        return evaluacion

    def update(self, instance, validated_data):
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance


class AnotacionSerializer(serializers.Serializer):
    """Serializer para Anotacion"""

    id = serializers.CharField(source="_id", read_only=True)
    estudiante_id = serializers.CharField(required=False, allow_null=True)
    tipo = serializers.CharField(
        required=False, allow_null=True, allow_blank=True
    )  # 'positiva' o 'negativa'
    descripcion = serializers.CharField(
        required=False, allow_null=True, allow_blank=True
    )
    fecha = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        # Normalizar fecha si viene en formato DD-MM-YYYY
        fecha = validated_data.get("fecha")
        if fecha and isinstance(fecha, str) and "-" in fecha:
            parts = fecha.split("-")
            if len(parts[0]) == 2 and len(parts[2]) == 4:  # DD-MM-YYYY
                validated_data["fecha"] = f"{parts[2]}-{parts[1]}-{parts[0]}"
        elif not fecha:
            from datetime import date

            validated_data["fecha"] = date.today().isoformat()
        # Si no hay tipo, usar 'negativa' por defecto
        if not validated_data.get("tipo"):
            validated_data["tipo"] = "negativa"
        anotacion = Anotacion(validated_data)
        anotacion.save()
        return anotacion

    def update(self, instance, validated_data):
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance


class ReunioneSerializer(serializers.Serializer):
    """Serializer para Reuniones"""

    id = serializers.CharField(source="_id", read_only=True)
    curso_id = serializers.CharField(required=False, allow_null=True)
    fecha = serializers.DateField(required=False, allow_null=True)
    hora = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )  # Changed to Char for string format
    lugar = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    descripcion = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )
    notificacion_enviada = serializers.BooleanField(required=False, default=False)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        from core.database import is_connected
        from core.database import get_collection

        # Verificar conexión a MongoDB
        if not is_connected():
            raise serializers.ValidationError(
                "No hay conexión a la base de datos. Verifica la configuración de MongoDB."
            )

        try:
            # Verificar que la colección existe y está accesible
            test_collection = get_collection("reuniones")
            # Verificar que podemos hacer una operación simple
            test_collection.find_one({})

            # Valores por defecto
            if not validated_data.get("lugar"):
                validated_data["lugar"] = "Por definir"
            if not validated_data.get("notificacion_enviada"):
                validated_data["notificacion_enviada"] = False

            # Convertir fecha a string si es datetime.date (MongoDB no acepta date)
            if validated_data.get("fecha"):
                from datetime import date

                if isinstance(validated_data["fecha"], date):
                    validated_data["fecha"] = validated_data["fecha"].strftime(
                        "%Y-%m-%d"
                    )

            # Convertir hora a string si es necesario
            if validated_data.get("hora") and not isinstance(
                validated_data["hora"], str
            ):
                validated_data["hora"] = str(validated_data["hora"])
            reunion = Reunione(validated_data)
            reunion.save()
            return reunion
        except Exception as e:
            print(f"ERROR creating Reunione: {str(e)}")
            import traceback

            traceback.print_exc()
            raise serializers.ValidationError(f"Error al guardar reunión: {str(e)}")

    def update(self, instance, validated_data):
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance


class ApoderadoSerializer(serializers.Serializer):
    """Serializer para Apoderado"""

    id = serializers.CharField(source="_id", read_only=True)
    rut = serializers.CharField(required=True)
    nombre = serializers.CharField(required=True)
    apellido = serializers.CharField(required=True)
    telefono = serializers.CharField(required=False, allow_null=True)
    email = serializers.CharField(required=False, allow_null=True)
    direccion = serializers.CharField(required=False, allow_null=True)
    estudiante_id = serializers.CharField(required=False, allow_null=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        apoderaDo = Apoderado(validated_data)
        apoderaDo.save()
        return apoderaDo

    def update(self, instance, validated_data):
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance


class RecordatorioSerializer(serializers.Serializer):
    """Serializer para Recordatorio"""

    id = serializers.CharField(source="_id", read_only=True)
    usuario_id = serializers.CharField(required=False, allow_null=True)
    titulo = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    descripcion = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )
    fecha = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    fecha_limite = serializers.CharField(
        required=False, allow_null=True, allow_blank=True
    )
    hora = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    privado = serializers.BooleanField(default=True)
    completada = serializers.BooleanField(default=False)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        # Normalizar fechas si vienen en formato DD-MM-YYYY
        for campo in ["fecha", "fecha_limite"]:
            val = validated_data.get(campo)
            if val and isinstance(val, str) and "-" in val:
                parts = val.split("-")
                if len(parts[0]) == 2 and len(parts[2]) == 4:  # DD-MM-YYYY
                    validated_data[campo] = f"{parts[2]}-{parts[1]}-{parts[0]}"
        # Asegurar valores por defecto
        if not validated_data.get("titulo"):
            validated_data["titulo"] = "Sin título"
        if validated_data.get("fecha_limite") and not validated_data.get("fecha"):
            validated_data["fecha"] = validated_data["fecha_limite"]
        recordatorio = Recordatorio(validated_data)
        recordatorio.save()
        return recordatorio

    def update(self, instance, validated_data):
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance


class AsignacionDocenteSerializer(serializers.Serializer):
    """Serializer para Asignación Docente"""

    id = serializers.CharField(source="_id", read_only=True)
    docente_id = serializers.CharField(required=False, allow_null=True)
    curso_id = serializers.CharField(required=False, allow_null=True)
    asignatura = serializers.CharField(required=False, allow_null=True)
    activo = serializers.BooleanField(default=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        asignacion = AsignacionDocente(validated_data)
        asignacion.save()
        return asignacion

    def update(self, instance, validated_data):
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance


class NotaSerializer(serializers.Serializer):
    """Serializer para Notas"""

    id = serializers.CharField(source="_id", read_only=True)
    estudiante_id = serializers.CharField(required=True)
    curso_id = serializers.CharField(required=True)
    asignatura = serializers.CharField(required=True)
    ano_escolar = serializers.IntegerField(required=True)
    notas = serializers.DictField(required=False, allow_null=True)
    nota_final = serializers.FloatField(required=False, allow_null=True)
    cerrado = serializers.BooleanField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        nota = Nota(validated_data)
        nota.save()
        return nota

    def update(self, instance, validated_data):
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance


# ============================================================
# SERIALIZERS DEL INSPECTOR GENERAL
# ============================================================


class DocumentoGeneradoSerializer(serializers.Serializer):
    """Serializer para DocumentoGenerado"""

    id = serializers.CharField(source="_id", read_only=True)
    tipo_documento = serializers.CharField(required=True)
    estudiante_id = serializers.CharField(required=False, allow_null=True)
    inspector_id = serializers.CharField(required=True)
    fecha_emision = serializers.CharField(required=False, allow_null=True)
    datos_adicionales = serializers.DictField(required=False, default={})
    estado = serializers.CharField(default="emitido")
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        doc = DocumentoGenerado(validated_data)
        doc.save()
        return doc

    def update(self, instance, validated_data):
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance


class AccidenteEscolarSerializer(serializers.Serializer):
    """Serializer para AccidenteEscolar"""

    id = serializers.CharField(source="_id", read_only=True)
    estudiante_id = serializers.CharField(required=True)
    fecha_accidente = serializers.CharField(required=True)
    hora_accidente = serializers.CharField(required=False, allow_null=True)
    lugar = serializers.CharField(required=False, allow_null=True)
    descripcion = serializers.CharField(required=True)
    tipo_lesion = serializers.CharField(required=False, allow_null=True)
    testigos = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    inspector_id = serializers.CharField(required=True)
    derivacion = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    estado = serializers.CharField(default="pendiente")
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        accidente = AccidenteEscolar(validated_data)
        accidente.save()
        return accidente

    def update(self, instance, validated_data):
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance


class RetiroAlumnoSerializer(serializers.Serializer):
    """Serializer para RetiroAlumno"""

    id = serializers.CharField(source="_id", read_only=True)
    estudiante_id = serializers.CharField(required=True)
    apoderado_autorizante = serializers.CharField(required=True)
    motivo = serializers.CharField(required=True)
    fecha = serializers.CharField(required=True)
    hora_salida = serializers.CharField(required=True)
    inspector_id = serializers.CharField(required=True)
    observacion = serializers.CharField(required=False, allow_blank=True, default="")
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        retiro = RetiroAlumno(validated_data)
        retiro.save()
        return retiro

    def update(self, instance, validated_data):
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance


class LibroInspectoriaSerializer(serializers.Serializer):
    """Serializer para LibroInspectoria"""

    id = serializers.CharField(source="_id", read_only=True)
    tipo = serializers.CharField(required=True)
    estudiante_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    curso_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    descripcion = serializers.CharField(required=True)
    inspector_id = serializers.CharField(required=True)
    fecha = serializers.CharField(required=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        registro = LibroInspectoria(validated_data)
        registro.save()
        return registro

    def update(self, instance, validated_data):
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance


class ConfiguracionEstablecimientoSerializer(serializers.Serializer):
    """Serializer para ConfiguracionEstablecimiento"""

    id = serializers.CharField(source="_id", read_only=True)
    nombre = serializers.CharField(required=True)
    rut = serializers.CharField(required=False, allow_null=True)
    direccion = serializers.CharField(required=False, allow_null=True)
    telefono = serializers.CharField(required=False, allow_null=True)
    email = serializers.CharField(required=False, allow_null=True)
    director = serializers.CharField(required=False, allow_null=True)
    inspector_general = serializers.CharField(required=False, allow_null=True)
    logo_url = serializers.CharField(required=False, allow_null=True)
    codigo_sostenedor = serializers.CharField(required=False, allow_null=True)
    dependencia = serializers.CharField(required=False, allow_null=True)
    region = serializers.CharField(required=False, allow_null=True)
    comuna = serializers.CharField(required=False, allow_null=True)
    texto_certificado_regular = serializers.CharField(required=False, allow_null=True)
    texto_certificado_notas = serializers.CharField(required=False, allow_null=True)
    texto_autorizacion_retiro = serializers.CharField(required=False, allow_null=True)
    texto_declaracion_accidente = serializers.CharField(required=False, allow_null=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        config = ConfiguracionEstablecimiento(validated_data)
        config.save()
        return config

    def update(self, instance, validated_data):
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance
