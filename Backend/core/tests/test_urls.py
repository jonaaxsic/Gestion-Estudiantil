"""
Tests de rutas del modulo Inspector General.
Verifica que los endpoints respondan correctamente
y que las rutas especificas NO sean capturadas por <str:pk>.
"""


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

    def test_certificado_no_es_capturado_como_pk(self):
        """
        Verifica que 'certificado-alumno-regular' aparezca como ruta
        ANTES que 'documentos/<str:pk>' en urlpatterns.
        Si aparece despues, Django lo captura como pk y da 405.
        """
        from urls import urlpatterns

        # Buscar indices
        idx_cert = None
        idx_pk = None

        for i, p in enumerate(urlpatterns):
            pattern_str = str(p.pattern)
            if "certificado-alumno-regular" in pattern_str:
                idx_cert = i
            if "documentos/<str:pk>" in pattern_str:
                idx_pk = i

        assert idx_cert is not None, (
            "No se encontro ruta 'certificado-alumno-regular' en urlpatterns"
        )
        assert idx_pk is not None, (
            "No se encontro ruta 'documentos/<str:pk>' en urlpatterns"
        )
        assert idx_cert < idx_pk, (
            f"ERROR: 'certificado-alumno-regular' (posicion {idx_cert}) "
            f"esta DESPUES de 'documentos/<str:pk>' (posicion {idx_pk}). "
            "Django capturara 'certificado-alumno-regular' como un pk y dara error 405."
        )

    def test_core_urls_tiene_mismo_orden_correcto(self):
        """core/urls.py tambien debe tener las rutas especificas antes que <str:pk>"""
        from core.urls import urlpatterns

        idx_cert = None
        idx_pk = None

        for i, p in enumerate(urlpatterns):
            pattern_str = str(p.pattern)
            if "certificado-alumno-regular" in pattern_str:
                idx_cert = i
            if "documentos/<str:pk>" in pattern_str:
                idx_pk = i

        assert idx_cert is not None, (
            "Falta 'certificado-alumno-regular' en core/urls.py"
        )
        assert idx_pk is not None, "Falta 'documentos/<str:pk>' en core/urls.py"
        assert idx_cert < idx_pk, (
            f"ERROR en core/urls.py: certificado ({idx_cert}) "
            f"despues de <str:pk> ({idx_pk})"
        )
