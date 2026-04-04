"""
Script para limpiar datos de prueba en MongoDB
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


def clean_test_data():
    """Limpiar datos de prueba"""

    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB_NAME]

    # Verificar y eliminar evaluaciones de prueba
    print("=== Limpiando EVALUACIONES ===")
    result = db["evaluaciones"].delete_many({"titulo": {"$regex": "Prueba"}})
    print(f"  Eliminadas {result.deleted_count} evaluaciones de prueba")

    # Verificar y eliminar anotaciones de prueba
    print("\n=== Limpiando ANOTACIONES ===")
    result = db["anotaciones"].delete_many(
        {"descripcion": {"$regex": " prueba | test |Prueba"}}
    )
    print(f"  Eliminadas {result.deleted_count} anotaciones de prueba")

    # Verificar datos restantes
    print("\n=== DATOS RESTANTES ===")
    print(f"  Evaluaciones: {db['evaluaciones'].count_documents({})}")
    print(f"  Anotaciones: {db['anotaciones'].count_documents({})}")
    print(f"  Asistencia: {db['asistencia'].count_documents({})}")
    print(f"  Reuniones: {db['reuniones'].count_documents({})}")


if __name__ == "__main__":
    clean_test_data()
