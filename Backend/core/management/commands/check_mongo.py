"""
Management command to verify MongoDB connection
"""

from django.core.management.base import BaseCommand
from backend.core.database import get_client, get_db


class Command(BaseCommand):
    help = "Verify MongoDB connection and list collections"

    def handle(self, *args, **options):
        try:
            self.stdout.write("Conectando a MongoDB...")
            client = get_client()
            db = get_db()

            # Verify connection
            client.admin.command("ping")
            self.stdout.write(self.style.SUCCESS("✓ Conexión a MongoDB exitosa"))

            # List collections
            collections = db.list_collection_names()
            self.stdout.write(f"\nColecciones en la base de datos:")
            for col in collections:
                count = db[col].count_documents({})
                self.stdout.write(f"  - {col}: {count} documentos")

            return

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"✗ Error de conexión: {e}"))
            raise
