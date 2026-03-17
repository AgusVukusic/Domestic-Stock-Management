from app.config.database import db

# Intentar conectarse y obtener la lista de colecciones
try:
    # Esto fuerza la conexión
    collections = db.list_collection_names()
    print("✅ Conexión exitosa a MongoDB!")
    print(f"Base de datos: {db.name}")
    print(f"Colecciones existentes: {collections}")
except Exception as e:
    print(f"❌ Error de conexión: {e}")