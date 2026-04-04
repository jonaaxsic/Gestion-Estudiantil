"""
Script para crear estudiante de prueba vinculado a Barbara
"""

from pymongo import MongoClient
from urllib.parse import quote_plus

# MongoDB Configuration
MONGO_HOST = "main-database.rpaamyh.mongodb.net"
MONGO_USER = "jonaaxsic"
MONGO_PASSWORD = "Diegosalvador15$"

# Build MongoDB URI
password = quote_plus(MONGO_PASSWORD)
MONGO_URI = f"mongodb+srv://{MONGO_USER}:{password}@{MONGO_HOST}/?appName=Main-Database"
MONGO_DB_NAME = "App_estudiantil"


def create_test_student():
    """Crear estudiante de prueba"""

    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB_NAME]

    # Buscar el ID de Barbara
    barbara = db["usuarios"].find_one({"email": "barbara@colegio.cl"})
    barbara_id = str(barbara.get("_id")) if barbara else None

    # Buscar un curso
    curso = db["cursos"].find_one()
    curso_id = str(curso.get("_id")) if curso else None

    if not barbara_id or not curso_id:
        print("Error: No se encontró Barbara o un curso")
        return

    # Crear estudiante
    estudiante = {
        "rut": "20500444-5",
        "nombre": "Juan",
        "apellido": "Pérez",
        "fecha_nacimiento": "2013-05-15",
        "direccion": "Av. Principal 123",
        "telefono": "+56912345678",
        "curso_id": curso_id,
        "apoderado_id": barbara_id,
    }

    result = db["estudiantes"].insert_one(estudiante)
    print(f"Estudiante creado con ID: {result.inserted_id}")
    print(f"  Nombre: {estudiante['nombre']} {estudiante['apellido']}")
    print(f"  RUT: {estudiante['rut']}")
    print(f"  Apoderado ID: {estudiante['apoderado_id']}")

    # Verificar
    print("\n=== ESTUDIANTES ===")
    for e in db["estudiantes"].find():
        print(
            f"  {e.get('nombre')} {e.get('apellido')} | RUT: {e.get('rut')} | Apoderado: {e.get('apoderado_id')}"
        )


if __name__ == "__main__":
    create_test_student()
