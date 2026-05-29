"""
Tests de rutas del modulo Inspector General.
Verifica que los endpoints respondan correctamente
y que las rutas especificas NO sean capturadas por <str:pk>.
"""

import pytest


class TestUrlsInspector:
    """Verifica que las rutas del inspector estén correctamente configuradas"""

    def test_urls_py_tiene_rutas_inspector(self):
        """
        Verifica que Backend/urls.py contenga las rutas del inspector.
        Este test fallará si alguien borra las rutas sin querer.
        """
        from urls import urlpatterns

        patterns_str = " ".join([str(p.pattern) for p in urlpatterns])

        rutas_requeridas = [
            "documentos/certificado-alumno-regular",
            "documentos/certificado-notas",
            "documentos/autorizacion-retiro",
            "documentos/accidente-escolar",
            "dashboard/inspector",
            "retiros/",
            "accidentes/",
            "libro-inspectoria/",
            "configuracion-establecimiento",
        ]

        for ruta in rutas_requeridas:
            assert ruta in patterns_str, f"Falta ruta requerida: {ruta}"

    def _verificar_orden_rutas(self, urlpatterns, module_name):
        """Helper: verifica que las rutas especificas esten ANTES que <str:pk>"""
        idx_cert = None
        idx_cert_noslash = None
        idx_pk_trailing = None
        idx_pk_noslash = None

        for i, p in enumerate(urlpatterns):
            pattern_str = str(p.pattern)
            if pattern_str == "documentos/certificado-alumno-regular/":
                idx_cert = i
            elif pattern_str == "documentos/certificado-alumno-regular":
                idx_cert_noslash = i
            elif pattern_str == "documentos/<str:pk>/":
                idx_pk_trailing = i
            elif pattern_str == "documentos/<str:pk>":
                idx_pk_noslash = i

        errors = []
        if idx_cert is None:
            errors.append("Falta 'documentos/certificado-alumno-regular/'")
        if idx_cert_noslash is None:
            errors.append("Falta 'documentos/certificado-alumno-regular' (sin slash)")
        if idx_pk_trailing is None:
            errors.append("Falta 'documentos/<str:pk>/'")
        if errors:
            pytest.fail(f"{module_name}: " + "; ".join(errors))

        assert idx_cert < idx_pk_trailing, (
            f"ERROR en {module_name}: certificado/ (pos {idx_cert}) "
            f"DESPUES de <str:pk>/ (pos {idx_pk_trailing})"
        )
        assert idx_cert_noslash < idx_pk_trailing, (
            f"ERROR en {module_name}: certificado (sin slash, pos {idx_cert_noslash}) "
            f"DESPUES de <str:pk>/ (pos {idx_pk_trailing})"
        )

    def test_urls_py_orden_correcto(self):
        """Backend/urls.py: certificados antes que <str:pk> (con y sin slash)"""
        from urls import urlpatterns
        self._verificar_orden_rutas(urlpatterns, "Backend/urls.py")

    def test_core_urls_orden_correcto(self):
        """core/urls.py: certificados antes que <str:pk> (con y sin slash)"""
        from core.urls import urlpatterns
        self._verificar_orden_rutas(urlpatterns, "core/urls.py")
