"""
Comando para normalizar el campo 'asignatura' en la colección 'notas'.
Corrige inconsistencias como "Matemáticas" → "matematicas", "Historia " → "historia".

Ejecutar: python manage.py normalize_asignaturas
"""
import unicodedata
from django.core.management.base import BaseCommand
from core.models import Nota


def normalize_text(text):
    """Normalizar texto: minúsculas, sin tildes, sin espacios extra"""
    if not text:
        return ""
    text = text.strip().lower()
    nfkd = unicodedata.normalize('NFKD', text)
    return ''.join(c for c in nfkd if not unicodedata.combining(c))


class Command(BaseCommand):
    help = 'Normaliza el campo asignatura en todos los documentos de la colección notas'

    def handle(self, *args, **options):
        collection = Nota.get_collection()
        todas = list(collection.find({}))

        corregidas = 0
        ya_ok = 0

        for nota in todas:
            asig_original = nota.get("asignatura", "")
            asig_normalizada = normalize_text(asig_original)
            if asig_original != asig_normalizada:
                collection.update_one(
                    {"_id": nota["_id"]},
                    {"$set": {"asignatura": asig_normalizada}}
                )
                self.stdout.write(
                    f"  Corregido: '{asig_original}' → '{asig_normalizada}' "
                    f"(nota {nota['_id']})"
                )
                corregidas += 1
            else:
                ya_ok += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\nMigración completada: {corregidas} notas corregidas, "
                f"{ya_ok} ya estaban correctas."
            )
        )
