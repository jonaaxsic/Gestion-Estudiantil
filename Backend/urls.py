"""
URL Configuration for Backend API
Simple and clean endpoints - no admin, no docs complications
"""

from django.urls import path, re_path
from django.http import JsonResponse
from core import views


def api_root(request):
    """Endpoint raíz del API"""
    return JsonResponse({"status": "ok", "message": "Servidor backend corriendo"})


urlpatterns = [
    path("", api_root, name="api-root"),
    # Authentication
    path("auth/login", views.login_view, name="login"),
    path("auth/create-test-user", views.create_test_user, name="create-test-user"),
    # CRUD endpoints - con y sin trailing slash
    path("usuarios", views.UsuarioList.as_view(), name="usuario-list"),
    path("usuarios/", views.UsuarioList.as_view(), name="usuario-list-slash"),
    path("usuarios/<str:pk>", views.UsuarioDetail.as_view(), name="usuario-detail"),
    path(
        "usuarios/<str:pk>/", views.UsuarioDetail.as_view(), name="usuario-detail-slash"
    ),
    path("estudiantes", views.EstudianteList.as_view(), name="estudiante-list"),
    path("estudiantes/", views.EstudianteList.as_view(), name="estudiante-list-slash"),
    path(
        "estudiantes/<str:pk>",
        views.EstudianteDetail.as_view(),
        name="estudiante-detail",
    ),
    path("cursos", views.CursoList.as_view(), name="curso-list"),
    path("cursos/", views.CursoList.as_view(), name="curso-list-slash"),
    path("cursos/<str:pk>", views.CursoDetail.as_view(), name="curso-detail"),
    path("cursos/<str:pk>/", views.CursoDetail.as_view(), name="curso-detail-slash"),
    path("asistencia", views.AsistenciaList.as_view(), name="asistencia-list"),
    path("asistencia/", views.AsistenciaList.as_view(), name="asistencia-list-slash"),
    path("asistencia/bulk", views.AsistenciaBulk.as_view(), name="asistencia-bulk"),
    path(
        "asistencia/<str:pk>",
        views.AsistenciaDetail.as_view(),
        name="asistencia-detail",
    ),
    path("evaluaciones", views.EvaluacionList.as_view(), name="evaluacion-list"),
    path("evaluaciones/", views.EvaluacionList.as_view(), name="evaluacion-list-slash"),
    path(
        "evaluaciones/<str:pk>",
        views.EvaluacionDetail.as_view(),
        name="evaluacion-detail",
    ),
    path("anotaciones", views.AnotacionList.as_view(), name="anotacion-list"),
    path("anotaciones/", views.AnotacionList.as_view(), name="anotacion-list-slash"),
    path(
        "anotaciones/<str:pk>", views.AnotacionDetail.as_view(), name="anotacion-detail"
    ),
    path("reuniones", views.ReunioneList.as_view(), name="reunion-list"),
    path("reuniones/", views.ReunioneList.as_view(), name="reunion-list-slash"),
    path("reuniones/<str:pk>", views.ReunioneDetail.as_view(), name="reunion-detail"),
    path("apoderados", views.ApoderadoList.as_view(), name="apoderado-list"),
    path("apoderados/", views.ApoderadoList.as_view(), name="apoderado-list-slash"),
    path(
        "apoderados/<str:pk>", views.ApoderadoDetail.as_view(), name="apoderado-detail"
    ),
    # Dashboards
    path("dashboard/docente", views.dashboard_docente, name="dashboard-docente"),
    path("dashboard/apoderado", views.dashboard_apoderado, name="dashboard-apoderado"),
    # Registro público de apoderados
    path("auth/registro", views.registro_apoderado, name="registro-apoderado"),
    path(
        "estudiantes/sin-apoderado",
        views.estudiantes_sin_apoderado,
        name="estudiantes-sin-apoderado",
    ),
    # Notas
    path("notas", views.NotaList.as_view(), name="nota-list"),
    path("notas/", views.NotaList.as_view(), name="nota-list-slash"),
    path("notas/<str:pk>", views.NotaDetail.as_view(), name="nota-detail"),
    path("notas/cerrar", views.cerrar_ramo, name="cerrar-ramo"),
    path("notas/actualizar", views.actualizar_nota_simple, name="actualizar-nota"),
    # Recordatorios
    path("recordatorios", views.RecordatorioList.as_view(), name="recordatorio-list"),
    path(
        "recordatorios/",
        views.RecordatorioList.as_view(),
        name="recordatorio-list-slash",
    ),
    path(
        "recordatorios/<str:pk>",
        views.RecordatorioDetail.as_view(),
        name="recordatorio-detail",
    ),
    # Asignaciones Docente
    path(
        "asignaciones-docente",
        views.AsignacionDocenteList.as_view(),
        name="asignacion-docente-list",
    ),
    path(
        "asignaciones-docente/",
        views.AsignacionDocenteList.as_view(),
        name="asignacion-docente-list-slash",
    ),
    path(
        "asignaciones-docente/<str:pk>",
        views.AsignacionDocenteDetail.as_view(),
        name="asignacion-docente-detail",
    ),
]
