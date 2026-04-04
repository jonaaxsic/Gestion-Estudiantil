"""
Script para verificar y crear datos de prueba en MongoDB
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


def check_data():
    """Verificar datos en MongoDB"""

    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB_NAME]

    # Verificar usuarios
    print("=== USUARIOS ===")
    usuarios = db["usuarios"].find()
    for u in usuarios:
        print(
            f"  ID: {u.get('_id')} | {u.get('nombre')} {u.get('apellido')} | RUT: {u.get('rut')} | Email: {u.get('email')} | Rol: {u.get('rol')}"
        )

    # Verificar estudiantes
    print("\n=== ESTUDIANTES ===")
    estudiantes = db["estudiantes"].find()
    for e in estudiantes:
        print(
            f"  ID: {e.get('_id')} | {e.get('nombre')} {e.get('apellido')} | RUT: {e.get('rut')} | Curso: {e.get('curso_id')} | Apoderado: {e.get('apoderado_id')}"
        )

    # Verificar cursos
    print("\n=== CURSOS ===")
    cursos = db["cursos"].find()
    for c in cursos:
        print(f"  ID: {c.get('_id')} | {c.get('nombre')} | {c.get('nivel')}")


if __name__ == "__main__":
    check_data()
