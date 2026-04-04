"""
Script para actualizar los RUTs de los usuarios existentes en MongoDB
Ejecutar con: python update_ruts.py
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


def update_ruts():
    """Actualizar los RUTs de los usuarios en MongoDB"""

    # Conectar a MongoDB
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB_NAME]
    collection = db["usuarios"]

    # Actualizar usuarios por email
    updates = [
        {
            "email": "admin@colegio.cl",
            "rut": "11.222333-4",
            "nombre": "Admin",
            "apellido": "Sistema",
        },
        {
            "email": "jonathan.anomisar@gmail.com",
            "rut": "17248548-9",
            "nombre": "Jonathan",
            "apellido": "Rodriguez",
        },
        {
            "email": "barbara@colegio.cl",
            "rut": "17903389-5",
            "nombre": "Barbara",
            "apellido": "Apoderado",
        },
    ]

    for user_data in updates:
        email = user_data.pop("email")
        result = collection.update_one({"email": email}, {"$set": user_data})
        print(f"Actualizado {email}: {result.modified_count} documento(s)")

    # Mostrar usuarios actualizados
    print("\nUsuarios en la base de datos:")
    for user in collection.find():
        print(
            f"  - {user.get('nombre')} {user.get('apellido')} ({user.get('email')}): RUT={user.get('rut')}, Rol={user.get('rol')}"
        )


if __name__ == "__main__":
    update_ruts()
