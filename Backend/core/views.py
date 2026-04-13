"""
Views/ViewSets para la API REST
Implementan los endpoints de la aplicación
"""

from rest_framework import status
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import AnonRateThrottle
from django.core.cache import cache
from bson import ObjectId
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
    Nota,
)
from .serializers import (
    UsuarioSerializer,
    EstudianteSerializer,
    CursoSerializer,
    AsistenciaSerializer,
    EvaluacionSerializer,
    AnotacionSerializer,
    ReunioneSerializer,
    ApoderadoSerializer,
    RecordatorioSerializer,
    AsignacionDocenteSerializer,
    NotaSerializer,
)


class MongoObjectIdMixin:
    """Mixin para convertir ObjectIds de MongoDB"""

    def _convert_object_ids(self, data):
        """Convierte string IDs a ObjectId para consultas"""
        if isinstance(data, dict):
            result = {}
            for key, value in data.items():
                if key in ["_id", "id", "estudiante_id", "curso_id", "apoderado_id"]:
                    if value and isinstance(value, str):
                        try:
                            result[key] = ObjectId(value)
                        except:
                            result[key] = value
                    else:
                        result[key] = value
                else:
                    result[key] = self._convert_object_ids(value)
            return result
        elif isinstance(data, list):
            return [self._convert_object_ids(item) for item in data]
        return data


# ============ USUARIOS ============
class UsuarioList(APIView, MongoObjectIdMixin):
    """Listar todos los usuarios o crear nuevo"""

    def get(self, request):
        # Cache de 2 minutos para lista de usuarios
        cache_key = "usuarios_list"
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        usuarios = Usuario.find(sort=[("created_at", -1)])
        serializer = UsuarioSerializer(usuarios, many=True)
        cache.set(cache_key, serializer.data, 120)  # 2 minutos
        return Response(serializer.data)

    def post(self, request):
        serializer = UsuarioSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            # Invalidar cache de usuarios
            cache.delete("usuarios_list")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UsuarioDetail(APIView, MongoObjectIdMixin):
    """Detalle de un usuario específico"""

    def get_object(self, pk):
        return Usuario.find_one({"_id": ObjectId(pk)})

    def get(self, request, pk):
        usuario = self.get_object(pk)
        if not usuario:
            return Response(
                {"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = UsuarioSerializer(usuario)
        return Response(serializer.data)

    def put(self, request, pk):
        usuario = self.get_object(pk)
        if not usuario:
            return Response(
                {"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = UsuarioSerializer(usuario, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        recordatorio = self.get_object(pk)
        if not recordatorio:
            return Response(
                {"error": "Recordatorio no encontrado"},
                status=status.HTTP_404_NOT_FOUND,
            )
        recordatorio.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============ ASIGNACIONES DOCENTE ============
class AsignacionDocenteList(APIView, MongoObjectIdMixin):
    """Listar asignaciones o crear nueva"""

    def get(self, request):
        docente_id = request.query_params.get("docente_id")
        curso_id = request.query_params.get("curso_id")

        # Cache específico por docente (2 minutos)
        if docente_id:
            cache_key = f"asignaciones_docente_{docente_id}"
        else:
            cache_key = "asignaciones_all"

        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        query = {"activo": True}
        if docente_id:
            query["docente_id"] = docente_id
        if curso_id:
            query["curso_id"] = curso_id

        asignaciones = AsignacionDocente.find(query, sort=[("created_at", -1)])
        serializer = AsignacionDocenteSerializer(asignaciones, many=True)
        cache.set(cache_key, serializer.data, 120)  # 2 minutos
        return Response(serializer.data)

    def post(self, request):
        # Método simplificado para debugging
        try:
            data = request.data
            print(f"DEBUG - Datos recibidos: {data}")

            # Verificar conexión a MongoDB
            from core.database import is_connected

            mongo_ok = is_connected()
            print(f"DEBUG - MongoDB conectado: {mongo_ok}")

            if not mongo_ok:
                return Response(
                    {"error": "MongoDB no conectado"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            # Guardar directamente en MongoDB
            from core.models import AsignacionDocente

            print(f"DEBUG - Creando AsignacionDocente...")
            asignacion = AsignacionDocente(
                {
                    "docente_id": data.get("docente_id"),
                    "curso_id": data.get("curso_id"),
                    "asignatura": data.get("asignatura"),
                    "activo": True,
                }
            )

            print(f"DEBUG - Llamando save()...")
            asignacion.save()

            print(f"DEBUG - GUARDADO OK! _id: {asignacion._id}")

            return Response(
                {
                    "success": True,
                    "id": asignacion._id,
                    "docente_id": data.get("docente_id"),
                    "curso_id": data.get("curso_id"),
                    "asignatura": data.get("asignatura"),
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            print(f"ERROR: {type(e).__name__}: {e}")
            import traceback

            traceback.print_exc()
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AsignacionDocenteDetail(APIView, MongoObjectIdMixin):
    """Detalle de una asignación"""

    def get_object(self, pk):
        return AsignacionDocente.find_one({"_id": ObjectId(pk)})

    def get(self, request, pk):
        asignacion = self.get_object(pk)
        if not asignacion:
            return Response(
                {"error": "Asignación no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = AsignacionDocenteSerializer(asignacion)
        return Response(serializer.data)

    def put(self, request, pk):
        asignacion = self.get_object(pk)
        if not asignacion:
            return Response(
                {"error": "Asignación no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = AsignacionDocenteSerializer(asignacion, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        asignacion = self.get_object(pk)
        if not asignacion:
            return Response(
                {"error": "Asignación no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )
        # En lugar de eliminar, desactivamos
        asignacion.activo = False
        asignacion.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
def login_view(request):
    """Endpoint de login"""
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response(
            {"error": "Email y password requeridos"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Debug: ver qué llega
    print(f"DEBUG login: email={email}, password={password}")

    # Buscar sin filtro de password primero para debug
    usuario_debug = Usuario.find_one({"email": email, "activo": True})
    if usuario_debug:
        print(f"DEBUG usuario encontrado: {usuario_debug.to_dict()}")

    # Login normal con password
    usuario = Usuario.find_one({"email": email, "password": password, "activo": True})

    if usuario:
        serializer = UsuarioSerializer(usuario)
        return Response({"success": True, "user": serializer.data})

    return Response(
        {"error": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED
    )


@api_view(["POST"])
def create_test_user(request):
    """Crear usuario de prueba - solo para desarrollo"""
    test_user = {
        "email": "admin@test.com",
        "password": "admin123",
        "nombre": "Admin",
        "apellido": "Test",
        "rol": "administrador",
        "rut": "12345678-9",
        "activo": True,
        "created_at": "2026-04-07T00:00:00Z",
    }

    # Verificar si ya existe
    existing = Usuario.find_one({"email": test_user["email"]})
    if existing:
        return Response({"message": "Usuario ya existe", "user": existing})

    # Crear usuario
    usuario = Usuario(test_user)
    usuario.save()

    return Response(
        {"message": "Usuario creado", "user": test_user}, status=status.HTTP_201_CREATED
    )


# ============ ESTUDIANTES ============
class EstudianteList(APIView, MongoObjectIdMixin):
    """Listar estudiantes o crear nuevo"""

    def get(self, request):
        curso_id = request.query_params.get("curso_id")

        # Cache específico por curso (1 minuto)
        if curso_id:
            cache_key = f"estudiantes_curso_{curso_id}"
        else:
            cache_key = "estudiantes_all"

        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        query = {}
        if curso_id:
            query["curso_id"] = curso_id

        estudiantes = Estudiante.find(query, sort=[("apellido", 1)])
        serializer = EstudianteSerializer(estudiantes, many=True)

        # Cache de 1 minuto para estudiantes
        cache.set(cache_key, serializer.data, 60)
        return Response(serializer.data)

    def post(self, request):
        serializer = EstudianteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            # Invalidar cache de estudiantes
            cache.delete("estudiantes_all")
            curso_id = request.data.get("curso_id")
            if curso_id:
                cache.delete(f"estudiantes_curso_{curso_id}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EstudianteDetail(APIView, MongoObjectIdMixin):
    """Detalle de un estudiante"""

    def get_object(self, pk):
        return Estudiante.find_one({"_id": ObjectId(pk)})

    def get(self, request, pk):
        estudiante = self.get_object(pk)
        if not estudiante:
            return Response(
                {"error": "Estudiante no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = EstudianteSerializer(estudiante)
        return Response(serializer.data)

    def put(self, request, pk):
        estudiante = self.get_object(pk)
        if not estudiante:
            return Response(
                {"error": "Estudiante no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = EstudianteSerializer(estudiante, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        estudiante = self.get_object(pk)
        if not estudiante:
            return Response(
                {"error": "Estudiante no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )
        estudiante.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============ CURSOS ============
class CursoList(APIView, MongoObjectIdMixin):
    """Listar cursos o crear nuevo"""

    def get(self, request):
        # Cache de 5 minutos para cursos (datos que cambian poco)
        cache_key = "cursos_list"
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        cursos = Curso.find(sort=[("nombre", 1)])
        serializer = CursoSerializer(cursos, many=True)
        cache.set(cache_key, serializer.data, 300)  # 5 minutos
        return Response(serializer.data)

    def post(self, request):
        serializer = CursoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            # Invalidar cache de cursos
            cache.delete("cursos_list")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CursoDetail(APIView, MongoObjectIdMixin):
    """Detalle de un curso"""

    def get_object(self, pk):
        return Curso.find_one({"_id": ObjectId(pk)})

    def get(self, request, pk):
        curso = self.get_object(pk)
        if not curso:
            return Response(
                {"error": "Curso no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = CursoSerializer(curso)
        return Response(serializer.data)

    def put(self, request, pk):
        curso = self.get_object(pk)
        if not curso:
            return Response(
                {"error": "Curso no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )

        # Actualizar directamente sin usar el serializer
        data = request.data
        if "nombre" in data:
            curso.nombre = data["nombre"]
        if "nivel" in data:
            curso.nivel = data["nivel"]
        if "ano" in data:
            curso.ano = data["ano"]

        curso.save()

        serializer = CursoSerializer(curso)
        return Response(serializer.data)

    def delete(self, request, pk):
        curso = self.get_object(pk)
        if not curso:
            return Response(
                {"error": "Curso no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )
        curso.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============ ASISTENCIA ============
class AsistenciaList(APIView, MongoObjectIdMixin):
    """Listar asistencia o crear nuevo"""

    def get(self, request):
        query = {}

        if request.query_params.get("estudiante_id"):
            query["estudiante_id"] = request.query_params.get("estudiante_id")
        if request.query_params.get("curso_id"):
            query["curso_id"] = request.query_params.get("curso_id")
        if request.query_params.get("fecha"):
            query["fecha"] = request.query_params.get("fecha")

        asistencia = Asistencia.find(query, sort=[("fecha", -1)])
        serializer = AsistenciaSerializer(asistencia, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = AsistenciaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AsistenciaBulk(APIView, MongoObjectIdMixin):
    """Crear asistencia masiva para un curso"""

    def post(self, request):
        curso_id = request.data.get("curso_id")
        fecha = request.data.get("fecha")
        registros = request.data.get("registros", [])

        if not curso_id or not fecha or not registros:
            return Response(
                {"error": "curso_id, fecha y registros requeridos"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = 0
        for registro in registros:
            asistencia = Asistencia(
                {
                    "estudiante_id": registro.get("estudiante_id"),
                    "curso_id": curso_id,
                    "fecha": fecha,
                    "presente": registro.get("presente", True),
                    "observacion": registro.get("observacion"),
                }
            )
            asistencia.save()
            created += 1

        return Response({"created": created}, status=status.HTTP_201_CREATED)


class AsistenciaDetail(APIView, MongoObjectIdMixin):
    """Detalle de asistencia"""

    def get_object(self, pk):
        return Asistencia.find_one({"_id": ObjectId(pk)})

    def get(self, request, pk):
        asistencia = self.get_object(pk)
        if not asistencia:
            return Response(
                {"error": "Asistencia no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = AsistenciaSerializer(asistencia)
        return Response(serializer.data)

    def put(self, request, pk):
        asistencia = self.get_object(pk)
        if not asistencia:
            return Response(
                {"error": "Asistencia no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = AsistenciaSerializer(asistencia, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        asistencia = self.get_object(pk)
        if not asistencia:
            return Response(
                {"error": "Asistencia no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )
        asistencia.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============ EVALUACIONES ============
class EvaluacionList(APIView, MongoObjectIdMixin):
    """Listar evaluaciones o crear nuevo"""

    def get(self, request):
        query = {}

        if request.query_params.get("curso_id"):
            query["curso_id"] = request.query_params.get("curso_id")
        if request.query_params.get("materia"):
            query["materia"] = request.query_params.get("materia")

        evaluaciones = Evaluacion.find(query, sort=[("fecha", -1)])
        serializer = EvaluacionSerializer(evaluaciones, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = EvaluacionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EvaluacionDetail(APIView, MongoObjectIdMixin):
    """Detalle de evaluacion"""

    def get_object(self, pk):
        return Evaluacion.find_one({"_id": ObjectId(pk)})

    def get(self, request, pk):
        evaluacion = self.get_object(pk)
        if not evaluacion:
            return Response(
                {"error": "Evaluación no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = EvaluacionSerializer(evaluacion)
        return Response(serializer.data)

    def put(self, request, pk):
        evaluacion = self.get_object(pk)
        if not evaluacion:
            return Response(
                {"error": "Evaluación no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = EvaluacionSerializer(evaluacion, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        evaluacion = self.get_object(pk)
        if not evaluacion:
            return Response(
                {"error": "Evaluación no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )
        evaluacion.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============ ANOTACIONES ============
class AnotacionList(APIView, MongoObjectIdMixin):
    """Listar anotaciones o crear nuevo"""

    def get(self, request):
        query = {}

        if request.query_params.get("estudiante_id"):
            query["estudiante_id"] = request.query_params.get("estudiante_id")
        if request.query_params.get("tipo"):
            query["tipo"] = request.query_params.get("tipo")

        anotaciones = Anotacion.find(query, sort=[("fecha", -1)])
        serializer = AnotacionSerializer(anotaciones, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = AnotacionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AnotacionDetail(APIView, MongoObjectIdMixin):
    """Detalle de anotacion"""

    def get_object(self, pk):
        return Anotacion.find_one({"_id": ObjectId(pk)})

    def get(self, request, pk):
        anotacion = self.get_object(pk)
        if not anotacion:
            return Response(
                {"error": "Anotación no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = AnotacionSerializer(anotacion)
        return Response(serializer.data)

    def put(self, request, pk):
        anotacion = self.get_object(pk)
        if not anotacion:
            return Response(
                {"error": "Anotación no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = AnotacionSerializer(anotacion, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        anotacion = self.get_object(pk)
        if not anotacion:
            return Response(
                {"error": "Anotación no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )
        anotacion.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============ REUNIONES ============
class ReunioneList(APIView, MongoObjectIdMixin):
    """Listar reuniones o crear nuevo"""

    def get(self, request):
        query = {}

        if request.query_params.get("curso_id"):
            query["curso_id"] = request.query_params.get("curso_id")

        reuniones = Reunione.find(query, sort=[("fecha", 1)])
        serializer = ReunioneSerializer(reuniones, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ReunioneSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReunioneDetail(APIView, MongoObjectIdMixin):
    """Detalle de reunion"""

    def get_object(self, pk):
        return Reunione.find_one({"_id": ObjectId(pk)})

    def get(self, request, pk):
        reunion = self.get_object(pk)
        if not reunion:
            return Response(
                {"error": "Reunión no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = ReunioneSerializer(reunion)
        return Response(serializer.data)

    def put(self, request, pk):
        reunion = self.get_object(pk)
        if not reunion:
            return Response(
                {"error": "Reunión no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = ReunioneSerializer(reunion, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        reunion = self.get_object(pk)
        if not reunion:
            return Response(
                {"error": "Reunión no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )
        reunion.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============ APODERADOS ============
class ApoderadoList(APIView, MongoObjectIdMixin):
    """Listar apoderados o crear nuevo"""

    def get(self, request):
        query = {}

        if request.query_params.get("estudiante_id"):
            query["estudiante_id"] = request.query_params.get("estudiante_id")

        apoderados = Apoderado.find(query, sort=[("apellido", 1)])
        serializer = ApoderadoSerializer(apoderados, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ApoderadoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ApoderadoDetail(APIView, MongoObjectIdMixin):
    """Detalle de apoderado"""

    def get_object(self, pk):
        return Apoderado.find_one({"_id": ObjectId(pk)})

    def get(self, request, pk):
        apoderado = self.get_object(pk)
        if not apoderado:
            return Response(
                {"error": "Apoderado no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = ApoderadoSerializer(apoderado)
        return Response(serializer.data)

    def put(self, request, pk):
        apoderado = self.get_object(pk)
        if not apoderado:
            return Response(
                {"error": "Apoderado no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = ApoderadoSerializer(apoderado, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        apoderado = self.get_object(pk)
        if not apoderado:
            return Response(
                {"error": "Apoderado no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )
        apoderado.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============ DASHBOARD ============
@api_view(["GET"])
def dashboard_docente(request):
    """Dashboard para docente"""
    docente_id = request.query_params.get("docente_id")

    if not docente_id:
        return Response(
            {"error": "docente_id requerido"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Aquí puedes agregar lógica para obtener datos del dashboard
    # Por ejemplo: total estudiantes, asistencia hoy, evaluaciones próximas, etc.

    return Response({"message": "Dashboard docente - implementa la lógica aquí"})


@api_view(["GET"])
def dashboard_apoderado(request):
    """Dashboard para apoderado"""
    estudiante_id = request.query_params.get("estudiante_id")

    if not estudiante_id:
        return Response(
            {"error": "estudiante_id requerido"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Obtener datos del estudiante
    estudiante = Estudiante.find_one({"_id": ObjectId(estudiante_id)})
    if not estudiante:
        return Response(
            {"error": "Estudiante no encontrado"}, status=status.HTTP_404_NOT_FOUND
        )

    # Obtener asistencia reciente
    asistencia = Asistencia.find(
        {"estudiante_id": estudiante_id}, limit=10, sort=[("fecha", -1)]
    )

    # Obtener evaluaciones próximas
    curso_id = estudiante.curso_id
    evaluaciones = Evaluacion.find({"curso_id": curso_id}, limit=5, sort=[("fecha", 1)])

    # Obtener anotaciones
    anotaciones = Anotacion.find(
        {"estudiante_id": estudiante_id}, limit=5, sort=[("fecha", -1)]
    )

    return Response(
        {
            "estudiante": EstudianteSerializer(estudiante).data,
            "asistencia": AsistenciaSerializer(asistencia, many=True).data,
            "evaluaciones": EvaluacionSerializer(evaluaciones, many=True).data,
            "anotaciones": AnotacionSerializer(anotaciones, many=True).data,
        }
    )


# ============ RECORDATORIOS ============
class RecordatorioList(APIView, MongoObjectIdMixin):
    """Listar recordatorios o crear nuevo"""

    def get(self, request):
        # Obtener usuario_id de los filtros o del query
        usuario_id = request.query_params.get("usuario_id")

        query = {}
        if usuario_id:
            # Mostrar solo los recordatorios del usuario o los no privados
            query["$or"] = [{"usuario_id": usuario_id}, {"privado": False}]

        recordatorios = Recordatorio.find(query, sort=[("fecha", 1)])
        serializer = RecordatorioSerializer(recordatorios, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = RecordatorioSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RecordatorioDetail(APIView, MongoObjectIdMixin):
    """Detalle de un recordatorio"""

    def get_object(self, pk):
        return Recordatorio.find_one({"_id": ObjectId(pk)})

    def get(self, request, pk):
        recordatorio = self.get_object(pk)
        if not recordatorio:
            return Response(
                {"error": "Recordatorio no encontrado"},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = RecordatorioSerializer(recordatorio)
        return Response(serializer.data)

    def put(self, request, pk):
        recordatorio = self.get_object(pk)
        if not recordatorio:
            return Response(
                {"error": "Recordatorio no encontrado"},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = RecordatorioSerializer(recordatorio, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        recordatorio = self.get_object(pk)
        if not recordatorio:
            return Response(
                {"error": "Recordatorio no encontrado"},
                status=status.HTTP_404_NOT_FOUND,
            )
        recordatorio.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============ CURSOS CON ASIGNACIONES ============
@api_view(["GET"])
def cursos_con_asignaciones(request):
    """Obtener cursos con sus docentes y asignaturas"""
    cursos = Curso.find(sort=[("nombre", 1)])
    asignaciones = AsignacionDocente.find({"activo": True})

    # Crear mapa de asignaciones por curso
    asignaciones_por_curso = {}
    for asig in asignaciones:
        curso_id = asig.curso_id
        if curso_id not in asignaciones_por_curso:
            asignaciones_por_curso[curso_id] = []
        asignaciones_por_curso[curso_id].append(
            {
                "docente_id": asig.docente_id,
                "asignatura": asig.asignatura,
                "asignacion_id": asig._id,
            }
        )

    # Combinar con cursos
    resultado = []
    for curso in cursos:
        curso_data = CursoSerializer(curso).data
        curso_data["asignaciones"] = asignaciones_por_curso.get(curso._id, [])
        resultado.append(curso_data)

    return Response(resultado)


@api_view(["GET"])
def mis_cursos_docente(request):
    """Obtener los cursos asignados a un docente específico"""
    docente_id = request.query_params.get("docente_id")

    if not docente_id:
        return Response(
            {"error": "docente_id requerido"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Buscar las asignaciones del docente
    asignaciones = AsignacionDocente.find({"docente_id": docente_id, "activo": True})

    if not asignaciones:
        return Response([])

    # Obtener los cursos
    cursos_ids = [asig.curso_id for asig in asignaciones]
    cursos = []

    for asig in asignaciones:
        curso = Curso.find_one({"_id": asig.curso_id})
        if curso:
            curso_data = CursoSerializer(curso).data
            curso_data["asignatura"] = asig.asignatura
            curso_data["asignacion_id"] = asig._id
            cursos.append(curso_data)

    return Response(cursos)


# ============ APODERADOS Y PUPILOS ============
@api_view(["GET", "POST"])
def estudiantes_apoderado(request):
    """Listar o crear estudiantes para un apoderado específico"""
    if request.method == "GET":
        # Listar estudiantes de un apoderado
        apoderado_id = request.query_params.get("apoderado_id")

        if not apoderado_id:
            return Response(
                {"error": "apoderado_id requerido"}, status=status.HTTP_400_BAD_REQUEST
            )

        estudiantes = Estudiante.find(
            {"apoderado_id": apoderado_id}, sort=[("apellido", 1)]
        )
        serializer = EstudianteSerializer(estudiantes, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        # Crear estudiante y asignar como pupilo del apoderado
        data = request.data.copy()
        data["apoderado_id"] = request.data.get("apoderado_id")

        serializer = EstudianteSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def estudiantes_sin_apoderado(request):
    """Listar estudiantes que no tienen apoderado asignado"""
    # Buscar estudiantes sin apoderado_id o con apoderado_id null/empty
    estudiantes = Estudiante.find(sort=[("apellido", 1)])

    # Filtrar los que no tienen apoderado
    estudiantes_sin_apoderado = [est for est in estudiantes if not est.apoderado_id]

    serializer = EstudianteSerializer(estudiantes_sin_apoderado, many=True)
    return Response(serializer.data)


# ============ NOTAS ============
class NotaList(APIView, MongoObjectIdMixin):
    """Listar notas o crear nueva"""

    def get(self, request):
        query = {}

        if request.query_params.get("estudiante_id"):
            query["estudiante_id"] = request.query_params.get("estudiante_id")
        if request.query_params.get("curso_id"):
            query["curso_id"] = request.query_params.get("curso_id")
        if request.query_params.get("asignatura"):
            query["asignatura"] = request.query_params.get("asignatura")
        if request.query_params.get("ano_escolar"):
            query["ano_escolar"] = request.query_params.get("ano_escolar")

        notas = Nota.find(query, sort=[("created_at", -1)])
        serializer = NotaSerializer(notas, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = NotaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NotaDetail(APIView, MongoObjectIdMixin):
    """Detalle de una nota"""

    def get_object(self, pk):
        return Nota.find_one({"_id": ObjectId(pk)})

    def get(self, request, pk):
        nota = self.get_object(pk)
        if not nota:
            return Response(
                {"error": "Nota no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = NotaSerializer(nota)
        return Response(serializer.data)

    def put(self, request, pk):
        nota = self.get_object(pk)
        if not nota:
            return Response(
                {"error": "Nota no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )

        # Si se actualizan las notas, recalcular el promedio
        if "notas" in request.data:
            nueva_nota = request.data.get("notas", {})
            valores = [v for v in nueva_nota.values() if v is not None]
            if valores:
                request.data["nota_final"] = round(sum(valores) / len(valores), 1)

        serializer = NotaSerializer(nota, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        nota = self.get_object(pk)
        if not nota:
            return Response(
                {"error": "Nota no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )
        nota.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
def cerrar_ramo(request):
    """Cerrar un ramo (después del 25 de diciembre)"""
    nota_id = request.data.get("nota_id")

    if not nota_id:
        return Response(
            {"error": "nota_id requerido"}, status=status.HTTP_400_BAD_REQUEST
        )

    nota = Nota.find_one({"_id": ObjectId(nota_id)})
    if not nota:
        return Response(
            {"error": "Nota no encontrada"}, status=status.HTTP_404_NOT_FOUND
        )

    nota.cerrado = True
    nota.save()

    serializer = NotaSerializer(nota)
    return Response(serializer.data)


@api_view(["POST"])
def actualizar_nota_simple(request):
    """Actualizar una nota específica de un estudiante en una asignatura"""
    estudiante_id = request.data.get("estudiante_id")
    curso_id = request.data.get("curso_id")
    asignatura = request.data.get("asignatura")
    ano_escolar = request.data.get("ano_escolar")
    numero_nota = request.data.get("numero_nota")  # "nota1", "nota2", etc.
    valor = request.data.get("valor")  # valor numérico de la nota

    if not all([estudiante_id, curso_id, asignatura, numero_nota, valor]):
        return Response(
            {
                "error": "estudiante_id, curso_id, asignatura, numero_nota y valor requeridos"
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Buscar o crear la nota del estudiante
    nota = Nota.find_one(
        {
            "estudiante_id": estudiante_id,
            "curso_id": curso_id,
            "asignatura": asignatura,
            "ano_escolar": ano_escolar,
        }
    )

    if not nota:
        # Crear nueva entrada de notas
        notas_dict = {
            "nota1": None,
            "nota2": None,
            "nota3": None,
            "nota4": None,
            "nota5": None,
            "nota6": None,
        }
        notas_dict[numero_nota] = valor

        nuevo = Nota(
            {
                "estudiante_id": estudiante_id,
                "curso_id": curso_id,
                "asignatura": asignatura,
                "ano_escolar": ano_escolar,
                "notas": notas_dict,
                "nota_final": valor,
                "cerrado": False,
            }
        )
        nuevo.save()
        serializer = NotaSerializer(nuevo)
        return Response(serializer.data)
    else:
        # Actualizar nota específica
        if nota.cerrado:
            return Response(
                {"error": "El ramo está cerrado y no puede ser modificado"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        notas = nota.notas or {}
        notas[numero_nota] = valor
        nota.notas = notas

        # Recalcular promedio
        valores = [v for v in notas.values() if v is not None]
        if valores:
            nota.nota_final = round(sum(valores) / len(valores), 1)

        nota.save()
        serializer = NotaSerializer(nota)
        return Response(serializer.data)


# ============ REGISTRO PÚBLICO DE APODERADOS ============
@api_view(["POST"])
def registro_apoderado(request):
    """Registro público de nuevos apoderados"""
    email = request.data.get("email")
    password = request.data.get("password")
    rut = request.data.get("rut")
    nombre = request.data.get("nombre")
    apellido = request.data.get("apellido")
    telefono = request.data.get("telefono")
    direccion = request.data.get("direccion")
    estudiante_id = request.data.get("estudiante_id")  # ID del pupilo

    # Validaciones básicas
    if not all([email, password, rut, nombre, apellido]):
        return Response(
            {"error": "Todos los campos obligatorios deben ser completados"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Verificar si el email ya existe
    if Usuario.find_one({"email": email}):
        return Response(
            {"error": "El correo electrónico ya está registrado"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Verificar si el RUT ya existe
    if Usuario.find_one({"rut": rut}):
        return Response(
            {"error": "El RUT ya está registrado"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Verificar que el estudiante_id corresponda a un estudiante válido
    if estudiante_id:
        estudiante = Estudiante.find_one({"_id": ObjectId(estudiante_id)})
        if not estudiante:
            return Response(
                {"error": "Estudiante no encontrado"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    # Crear el usuario con rol de apoderado
    nuevo_apoderado = Usuario(
        {
            "email": email,
            "password": password,
            "rut": rut,
            "nombre": nombre,
            "apellido": apellido,
            "telefono": telefono,
            "direccion": direccion,
            "rol": "apoderado",
            "activo": True,
        }
    )
    nuevo_apoderado.save()

    # Si se proporcionó estudiante_id, vincular al estudiante
    if estudiante_id:
        estudiante = Estudiante.find_one({"_id": ObjectId(estudiante_id)})
        if estudiante:
            estudiante.apoderado_id = str(nuevo_apoderado._id)
            estudiante.save()

    # También crear entrada en colección de apoderados (para compatibilidad)
    nuevo_apoderado_data = Apoderado(
        {
            "rut": rut,
            "nombre": nombre,
            "apellido": apellido,
            "telefono": telefono,
            "email": email,
            "direccion": direccion,
            "estudiante_id": estudiante_id,
        }
    )
    nuevo_apoderado_data.save()

    serializer = UsuarioSerializer(nuevo_apoderado)
    return Response(
        {"success": True, "user": serializer.data}, status=status.HTTP_201_CREATED
    )
