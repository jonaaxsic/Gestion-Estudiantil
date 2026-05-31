"""
Tests para la autenticación y hasheo de contraseñas.
Verifica que:
  - Las contraseñas se hasheen al crear/actualizar usuarios
  - El login funcione tanto con contraseñas hasheadas como en texto plano (legacy)
  - Las contraseñas legacy se actualicen automáticamente al hacer login
  - No se expongan contraseñas en las respuestas de la API
"""

import pytest
from unittest.mock import patch, MagicMock


class TestPasswordHashing:
    """Verifica que las funciones de hasheo funcionen correctamente"""

    def test_make_password_genera_hash(self):
        """make_password debe generar un hash con prefijo reconocible"""
        from django.contrib.auth.hashers import make_password

        password = "admin123"
        hashed = make_password(password)

        # Debe ser diferente del texto plano
        assert hashed != password
        # Debe empezar con un algoritmo conocido
        assert hashed.startswith("pbkdf2_sha256$") or hashed.startswith("bcrypt")
        # check_password debe validarlo
        from django.contrib.auth.hashers import check_password

        assert check_password(password, hashed)

    def test_make_password_hashea_dos_veces_distinto(self):
        """Mismo password debe generar hashes distintos (por el salt)"""
        from django.contrib.auth.hashers import make_password

        password = "admin123"
        hash1 = make_password(password)
        hash2 = make_password(password)

        assert hash1 != hash2

    def test_check_password_rechaza_password_incorrecto(self):
        """check_password debe retornar False para password incorrecto"""
        from django.contrib.auth.hashers import make_password, check_password

        hashed = make_password("correcto")
        assert check_password("incorrecto", hashed) is False

    def test_check_password_rechaza_texto_plano(self):
        """check_password debe retornar False para texto plano (no es hash)"""
        from django.contrib.auth.hashers import check_password

        assert check_password("admin123", "admin123") is False


class TestIsHashedHelper:
    """Verifica el helper _is_hashed que detecta si un password está hasheado"""

    def test_is_hashed_reconoce_pbkdf2(self):
        """Debe reconocer hash PBKDF2 de Django"""
        from core.views import _is_hashed

        hash_pbkdf2 = "pbkdf2_sha256$720000$abc123$hashhashhash=="
        assert _is_hashed(hash_pbkdf2) is True

    def test_is_hashed_reconoce_bcrypt(self):
        """Debe reconocer hash bcrypt"""
        from core.views import _is_hashed

        hash_bcrypt = "bcrypt$$2a$12$abcdefghijklmnopqrstuv"
        assert _is_hashed(hash_bcrypt) is True

    def test_is_hashed_reconoce_argon2(self):
        """Debe reconocer hash Argon2"""
        from core.views import _is_hashed

        hash_argon2 = "argon2$argon2id$v=19$m=102400,t=2,p=8$..."
        assert _is_hashed(hash_argon2) is True

    def test_is_hashed_rechaza_texto_plano(self):
        """Texto plano NO debe ser reconocido como hash"""
        from core.views import _is_hashed

        assert _is_hashed("admin123") is False

    def test_is_hashed_rechaza_vacio(self):
        """String vacío NO debe ser reconocido como hash"""
        from core.views import _is_hashed

        assert _is_hashed("") is False

    def test_is_hashed_rechaza_none(self):
        """None NO debe ser reconocido como hash (sin crash)"""
        from core.views import _is_hashed

        assert _is_hashed(None) is False


class TestUsuarioSerializer:
    """Verifica que el UsuarioSerializer hashee passwords"""

    def test_serializer_create_hashea_password(self):
        """Al crear usuario, el password debe guardarse hasheado"""
        from core.serializers import UsuarioSerializer

        data = {
            "email": "test@test.com",
            "username": "testuser",
            "password": "mi_password_segura",
            "rol": "docente",
            "nombre": "Test",
            "apellido": "User",
        }

        serializer = UsuarioSerializer(data=data)
        assert serializer.is_valid(), f"Errores: {serializer.errors}"

        # Mockear save para no tocar MongoDB
        with patch("core.serializers.Usuario") as MockUsuario:
            mock_instance = MagicMock()
            MockUsuario.return_value = mock_instance

            serializer.save()

            # Verificar que Usuario fue creado con password hasheado
            args, kwargs = MockUsuario.call_args
            validated = args[0]
            stored_password = validated.get("password")

            # No debe ser texto plano
            assert stored_password != "mi_password_segura"
            # Debe ser un hash reconocible
            from django.contrib.auth.hashers import check_password

            assert check_password("mi_password_segura", stored_password)

    def test_serializer_update_hashea_password(self):
        """Al actualizar usuario con nuevo password, debe hashearlo"""
        from core.serializers import UsuarioSerializer
        from django.contrib.auth.hashers import check_password, make_password

        # Crear un mock de instancia con password ya hasheado
        mock_instance = MagicMock()
        mock_instance.password = make_password("old_password")

        data = {"password": "new_password_segura"}

        serializer = UsuarioSerializer(instance=mock_instance, data=data, partial=True)
        assert serializer.is_valid()

        serializer.save()

        # Verificar que se seteó el nuevo password hasheado
        setattr_calls = [
            call
            for call in mock_instance.mock_calls
            if call[0] == "password" or call[0].startswith("__setattr__")
        ]

        # El password debe haberse actualizado con hash
        new_password_set = None
        for call in mock_instance.mock_calls:
            if call[0] == "" and len(call.args) >= 2 and call.args[0] == "password":
                new_password_set = call.args[1]

        if new_password_set is None:
            # Puede haberse seteado via setattr
            password_changed = any(
                check_password("new_password_segura", getattr(mock_instance, attr))
                for attr in ["password"]
                for _ in [0]  # iterate once
            )
            # Simply verify by checking the stored attr
            stored = mock_instance.password
            assert stored != "new_password_segura"
            assert check_password("new_password_segura", stored)
        else:
            assert new_password_set != "new_password_segura"
            assert check_password("new_password_segura", new_password_set)

    def test_serializer_password_es_write_only(self):
        """El campo password NO debe aparecer en respuestas serializadas"""
        from core.serializers import UsuarioSerializer

        field = UsuarioSerializer().fields.get("password")
        assert field is not None
        assert field.write_only is True


class TestLoginView:
    """Verifica el endpoint de login con passwords hasheados y legacy"""

    @pytest.fixture
    def mock_request(self):
        """Crea un mock de request DRF"""
        from rest_framework.test import APIRequestFactory

        factory = APIRequestFactory()
        return factory

    def _crear_mock_usuario(self, password_field="password"):
        """Helper para crear un mock de usuario"""
        user = MagicMock()
        user.to_dict.return_value = {
            "_id": "abc123",
            "email": "test@test.com",
            "password": "stub",
            "nombre": "Test",
            "apellido": "User",
            "rol": "docente",
            "activo": True,
        }
        return user

    @patch("core.views.Usuario")
    def test_login_con_password_hasheado(self, MockUsuario):
        """Login debe funcionar con password hasheado"""
        from django.contrib.auth.hashers import make_password
        from core.views import login_view
        from rest_framework.test import APIRequestFactory

        hashed_password = make_password("correct_password")
        mock_user = MagicMock()
        mock_user.password = hashed_password
        MockUsuario.find_one.return_value = mock_user

        factory = APIRequestFactory()
        request = factory.post(
            "/auth/login/",
            {"email": "test@test.com", "password": "correct_password"},
            format="json",
        )

        response = login_view(request)
        assert response.status_code == 200, f"Error: {response.data}"
        assert response.data["success"] is True

    @patch("core.views.Usuario")
    def test_login_con_password_incorrecto(self, MockUsuario):
        """Login con password incorrecto debe retornar 401"""
        from django.contrib.auth.hashers import make_password
        from core.views import login_view
        from rest_framework.test import APIRequestFactory

        hashed_password = make_password("correct_password")
        mock_user = MagicMock()
        mock_user.password = hashed_password
        MockUsuario.find_one.return_value = mock_user

        factory = APIRequestFactory()
        request = factory.post(
            "/auth/login/",
            {"email": "test@test.com", "password": "wrong_password"},
            format="json",
        )

        response = login_view(request)
        assert response.status_code == 401

    @patch("core.views.Usuario")
    def test_login_con_password_texto_plano_legacy(self, MockUsuario):
        """Login debe funcionar con password en texto plano (usuarios legacy)"""
        from core.views import login_view
        from rest_framework.test import APIRequestFactory

        # Simular usuario legacy con password en texto plano
        mock_user = MagicMock()
        mock_user.password = "plain_text_password"
        MockUsuario.find_one.return_value = mock_user

        factory = APIRequestFactory()
        request = factory.post(
            "/auth/login/",
            {"email": "test@test.com", "password": "plain_text_password"},
            format="json",
        )

        response = login_view(request)
        assert response.status_code == 200, f"Error: {response.data}"
        assert response.data["success"] is True

    @patch("core.views.Usuario")
    def test_login_con_password_legacy_hace_upgrade(self, MockUsuario):
        """Login con password legacy debe hacer upgrade a hash"""
        from core.views import login_view
        from rest_framework.test import APIRequestFactory

        mock_user = MagicMock()
        mock_user.password = "plain_text_password"
        MockUsuario.find_one.return_value = mock_user

        factory = APIRequestFactory()
        request = factory.post(
            "/auth/login/",
            {"email": "test@test.com", "password": "plain_text_password"},
            format="json",
        )

        login_view(request)

        # Verificar que se llamó a save() (upgrade de password)
        assert mock_user.save.called, "Debe llamar a save() para upgrade del password"
        # Verificar que el password se actualizó a hash
        from core.views import _is_hashed

        assert _is_hashed(mock_user.password), "Password debe haber sido actualizado a hash"

    @patch("core.views.Usuario")
    def test_login_rechaza_sin_email(self, MockUsuario):
        """Login sin email debe retornar 400"""
        from core.views import login_view
        from rest_framework.test import APIRequestFactory

        factory = APIRequestFactory()
        request = factory.post(
            "/auth/login/", {"password": "somepass"}, format="json"
        )

        response = login_view(request)
        assert response.status_code == 400

    @patch("core.views.Usuario")
    def test_login_rechaza_sin_password(self, MockUsuario):
        """Login sin password debe retornar 400"""
        from core.views import login_view
        from rest_framework.test import APIRequestFactory

        factory = APIRequestFactory()
        request = factory.post(
            "/auth/login/", {"email": "test@test.com"}, format="json"
        )

        response = login_view(request)
        assert response.status_code == 400

    @patch("core.views.Usuario")
    def test_login_con_usuario_inexistente(self, MockUsuario):
        """Login con email no registrado debe retornar 401"""
        from core.views import login_view
        from rest_framework.test import APIRequestFactory

        MockUsuario.find_one.return_value = None

        factory = APIRequestFactory()
        request = factory.post(
            "/auth/login/",
            {"email": "noexiste@test.com", "password": "somepass"},
            format="json",
        )

        response = login_view(request)
        assert response.status_code == 401


class TestCreateTestUser:
    """Verifica que create_test_user hashee el password"""

    @patch("core.views.Usuario")
    def test_create_test_user_hashea_password(self, MockUsuario):
        """create_test_user debe almacenar password hasheado, no texto plano"""
        from core.views import create_test_user
        from rest_framework.test import APIRequestFactory
        from django.contrib.auth.hashers import check_password

        MockUsuario.find_one.return_value = None

        factory = APIRequestFactory()
        request = factory.post("/create-test-user/", format="json")

        response = create_test_user(request)
        assert response.status_code == 201

        # Verificar que el password se guardó hasheado
        args, kwargs = MockUsuario.call_args
        creado = args[0]
        stored = creado.get("password")
        assert stored != "admin123"
        assert check_password("admin123", stored)

    @patch("core.views.Usuario")
    def test_create_test_user_response_no_incluye_password(self, MockUsuario):
        """La respuesta de create_test_user NO debe incluir el password"""
        from core.views import create_test_user
        from rest_framework.test import APIRequestFactory

        MockUsuario.find_one.return_value = None

        factory = APIRequestFactory()
        request = factory.post("/create-test-user/", format="json")

        response = create_test_user(request)
        assert response.status_code == 201

        user_data = response.data.get("user", {})
        assert "password" not in user_data, "Password no debe estar en la respuesta"


class TestRegistroApoderado:
    """Verifica que registro_apoderado hashee el password"""

    @patch("core.views.Usuario")
    @patch("core.views.Apoderado")
    @patch("core.views.Estudiante")
    def test_registro_apoderado_hashea_password(
        self, MockEstudiante, MockApoderado, MockUsuario
    ):
        """registro_apoderado debe guardar el password hasheado"""
        from core.views import registro_apoderado
        from rest_framework.test import APIRequestFactory
        from django.contrib.auth.hashers import check_password

        # Mocks: no existe usuario ni estudiante
        MockUsuario.find_one.return_value = None
        MockEstudiante.find_one.return_value = None

        factory = APIRequestFactory()
        request = factory.post(
            "/registro-apoderado/",
            {
                "email": "apoderado@test.com",
                "password": "segura123",
                "rut": "11.111.111-1",
                "nombre": "Apoderado",
                "apellido": "Test",
            },
            format="json",
        )

        response = registro_apoderado(request)
        assert response.status_code == 201, f"Error: {response.data}"

        # Verificar que el Usuario se creó con password hasheado
        usuario_calls = [
            args[0] for args, _ in MockUsuario.call_args_list if args
        ]
        assert len(usuario_calls) > 0

        stored_password = usuario_calls[0].get("password")
        assert stored_password != "segura123"
        assert check_password("segura123", stored_password)
