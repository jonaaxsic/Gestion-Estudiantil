"""
MongoDB Database Connection Module
"""

from pymongo import MongoClient
from django.conf import settings

_client = None
_db = None


def get_client():
    """Get MongoDB client singleton"""
    global _client
    if _client is None:
        _client = MongoClient(settings.MONGO_URI)
    return _client


def get_db():
    """Get MongoDB database instance"""
    global _db
    if _db is None:
        _db = get_client()[settings.MONGO_DB_NAME]
    return _db


def get_collection(name):
    """Get a specific collection from the database"""
    return get_db()[name]
