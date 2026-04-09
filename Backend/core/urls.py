"""
URL Configuration for Backend API
"""

from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path("auth/login", views.login_view, name="login"),
    # Usuarios
    path("usuarios", views.UsuarioList.as_view(), name="usuario-list"),
    path("usuarios/<str:pk>", views.UsuarioDetail.as_view(), name="usuario-detail"),
    # Estudiantes
    path("estudiantes", views.EstudianteList.as_view(), name="estudiante-list"),
    path(
        "estudiantes/<str:pk>",
        views.EstudianteDetail.as_view(),
        name="estudiante-detail",
    ),
    # Cursos
    path("cursos", views.CursoList.as_view(), name="curso-list"),
    path("cursos/<str:pk>", views.CursoDetail.as_view(), name="curso-detail"),
    # Asistencia
    path("asistencia", views.AsistenciaList.as_view(), name="asistencia-list"),
    path("asistencia/bulk", views.AsistenciaBulk.as_view(), name="asistencia-bulk"),
    path(
        "asistencia/<str:pk>",
        views.AsistenciaDetail.as_view(),
        name="asistencia-detail",
    ),
    # Evaluaciones
    path("evaluaciones", views.EvaluacionList.as_view(), name="evaluacion-list"),
    path(
        "evaluaciones/<str:pk>",
        views.EvaluacionDetail.as_view(),
        name="evaluacion-detail",
    ),
    # Anotaciones
    path("anotaciones", views.AnotacionList.as_view(), name="anotacion-list"),
    path(
        "anotaciones/<str:pk>", views.AnotacionDetail.as_view(), name="anotacion-detail"
    ),
    # Reuniones
    path("reuniones", views.ReunioneList.as_view(), name="reunion-list"),
    path("reuniones/<str:pk>", views.ReunioneDetail.as_view(), name="reunion-detail"),
    # Apoderados
    path("apoderados", views.ApoderadoList.as_view(), name="apoderado-list"),
    path(
        "apoderados/<str:pk>", views.ApoderadoDetail.as_view(), name="apoderado-detail"
    ),
    # Recordatorios
    path("recordatorios", views.RecordatorioList.as_view(), name="recordatorio-list"),
    path(
        "recordatorios/<str:pk>",
        views.RecordatorioDetail.as_view(),
        name="recordatorio-detail",
    ),
    # Dashboards
    path("dashboard/docente", views.dashboard_docente, name="dashboard-docente"),
    path("dashboard/apoderado", views.dashboard_apoderado, name="dashboard-apoderado"),
]
