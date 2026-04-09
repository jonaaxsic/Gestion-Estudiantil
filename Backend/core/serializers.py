"""
Serializers para la API REST
Convierten los modelos MongoDB a JSON y viceversa
"""

from rest_framework import serializers
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
        usuario = Usuario(validated_data)
        usuario.save()
        return usuario

    def update(self, instance, validated_data):
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance


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
        print(f"DEBUG - Creating Asistencia with data: {validated_data}")
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
    fecha = serializers.DateField(required=False, allow_null=True)
    ponderacion = serializers.FloatField(required=False, allow_null=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        print(f"DEBUG - Creating Evaluacion with data: {validated_data}")
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
    fecha = serializers.DateField(required=False, allow_null=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        # Si no hay fecha, usar la fecha actual
        if not validated_data.get("fecha"):
            from datetime import date

            validated_data["fecha"] = date.today().isoformat()
        # Si no hay tipo, usar 'negativa' por defecto
        if not validated_data.get("tipo"):
            validated_data["tipo"] = "negativa"
        print(f"DEBUG - Creating Anotacion with data: {validated_data}")
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
    hora = serializers.TimeField(required=False, allow_null=True)
    lugar = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    descripcion = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )
    notificacion_enviada = serializers.BooleanField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        print(f"DEBUG - Creating Reunione with data: {validated_data}")
        # Valores por defecto
        if not validated_data.get("lugar"):
            validated_data["lugar"] = "Por definir"
        if not validated_data.get("notificacion_enviada"):
            validated_data["notificacion_enviada"] = False
        reunion = Reunione(validated_data)
        reunion.save()
        return reunion

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
        apoderado = Apoderado(validated_data)
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
    fecha = serializers.DateField(required=False, allow_null=True)
    fecha_limite = serializers.DateField(required=False, allow_null=True)
    hora = serializers.TimeField(required=False, allow_null=True)
    privado = serializers.BooleanField(default=True)
    completada = serializers.BooleanField(default=False)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        print(f"DEBUG - Creating Recordatorio with data: {validated_data}")
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
        print(f"DEBUG - Creating AsignacionDocente with data: {validated_data}")
        asignacion = AsignacionDocente(validated_data)
        print(f"DEBUG - Before save: {asignacion.to_dict()}")
        asignacion.save()
        print(f"DEBUG - After save, _id: {asignacion._id}")
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
