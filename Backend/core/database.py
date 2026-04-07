"""
MongoDB Database Connection Module
Uses MongoDB Atlas with Atlas SQL endpoint
"""

import os
from pymongo import MongoClient
from django.conf import settings

_client = None
_db = None
_mongo_available = False
_connection_mode = "memory"


def get_client():
    """Get MongoDB client singleton"""
    global _client, _mongo_available, _connection_mode

    if _client is not None:
        return _client

    # Try different connection methods in order
    mongo_uris = []

    # Debug: Print environment variables
    print(f"DEBUG - MONGO_USER: {getattr(settings, 'MONGO_USER', 'NOT_SET')}")
    print(
        f"DEBUG - MONGO_PASSWORD: {'SET' if getattr(settings, 'MONGO_PASSWORD', None) else 'NOT_SET'}"
    )
    print(f"DEBUG - MONGO_HOST: {getattr(settings, 'MONGO_HOST', 'NOT_SET')}")
    print(f"DEBUG - MONGO_URI: {getattr(settings, 'MONGO_URI', 'NOT_SET')}")

    # 1. Try local MongoDB first
    mongo_uris.append(("local", "mongodb://localhost:27017"))

    # 2. Try from settings.MONGO_URI (full URI from settings)
    if settings.MONGO_URI:
        mongo_uris.append(("settings", settings.MONGO_URI))

    # 3. Try to build from separate variables (Atlas)
    if (
        hasattr(settings, "MONGO_USER")
        and settings.MONGO_USER
        and hasattr(settings, "MONGO_PASSWORD")
        and settings.MONGO_PASSWORD
    ):
        from urllib.parse import quote_plus

        password = quote_plus(settings.MONGO_PASSWORD)
        host = getattr(settings, "MONGO_HOST", "main-database.rpaamyh.mongodb.net")
        db_name = getattr(settings, "MONGO_DB_NAME", "App_estudiantil")
        atlas_uri = f"mongodb+srv://{settings.MONGO_USER}:{password}@{host}/{db_name}?appName=Main-Database"
        print(f"DEBUG - Atlas URI generated")
        mongo_uris.append(("atlas", atlas_uri))

    # 4. Try Atlas SQL endpoint (provided by user)
    atlas_sql_uri = os.environ.get("MONGO_ATLAS_SQL_URI")
    if atlas_sql_uri:
        mongo_uris.append(("atlas_sql", atlas_sql_uri))

    # Try each URI
    for mode, uri in mongo_uris:
        try:
            print(f"Attempting MongoDB connection ({mode})...")

            # Configure client based on connection type
            if "+srv" in uri:
                # SRV connection (standard Atlas) with TLS options
                _client = MongoClient(
                    uri,
                    serverSelectionTimeoutMS=15000,
                    connectTimeoutMS=15000,
                    retryWrites=True,
                    retryReads=True,
                    tls=True,
                    tlsAllowInvalidCertificates=True,
                )
            else:
                # Standard MongoDB connection
                _client = MongoClient(
                    uri,
                    serverSelectionTimeoutMS=15000,
                    connectTimeoutMS=15000,
                    retryWrites=True,
                    retryReads=True,
                )

            # Test connection
            _client.admin.command("ping")
            _mongo_available = True
            _connection_mode = mode

            # Get database name from settings
            db_name = getattr(settings, "MONGO_DB_NAME", "App_estudiantil")
            print(f"✅ Connected to MongoDB ({mode}): {db_name}")
            break
        except Exception as e:
            print(f"❌ MongoDB connection failed ({mode}): {str(e)[:80]}")
            _client = None

    if not _mongo_available:
        print("⚠️ WARNING: No MongoDB connection available!")

    return _client


def get_db():
    """Get MongoDB database instance"""
    global _db
    # Ensure client is initialized
    if not _mongo_available:
        get_client()
    if _mongo_available and _db is None:
        db_name = getattr(settings, "MONGO_DB_NAME", "App_estudiantil")
        _db = get_client()[db_name]
    return _db


# Initialize connection when module is imported
# This ensures MongoDB is connected before any view tries to use it
try:
    get_client()
except Exception as e:
    print(f"Warning: Could not initialize MongoDB connection: {e}")


def get_collection(name):
    """Get a specific collection from the database"""
    # Ensure client is initialized
    if not _mongo_available:
        get_client()

    if _mongo_available:
        return get_db()[name]
    else:
        raise RuntimeError(
            "MongoDB is not connected! Cannot get collection. "
            "Please check your database connection."
        )


def is_connected():
    """Check if MongoDB is connected"""
    return _mongo_available


def get_connection_mode():
    """Get the current connection mode"""
    return _connection_mode
